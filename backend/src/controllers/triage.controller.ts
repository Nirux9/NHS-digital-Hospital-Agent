import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';
import { logAudit } from '../services/audit.service';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TriageAlertRecord {
  id: string;
  patientName: string;
  location: string;
  timeAgo: string;
  message: string;
  severity: 'Critical' | 'Urgent' | 'Standard';
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
}

const inMemoryAlerts: TriageAlertRecord[] = [
  {
    id: '1',
    patientName: 'Telemetry Patient #12',
    location: 'Bed 12 - Cardiac Unit',
    timeAgo: '10m ago',
    message: 'Abnormal vital signs detected. High priority review required.',
    severity: 'Critical',
    acknowledged: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    patientName: 'Waiting Patient #04',
    location: 'Ward B - Waiting Room',
    timeAgo: '25m ago',
    message: 'Patient waiting time exceeded 45 mins. Escalation suggested.',
    severity: 'Urgent',
    acknowledged: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

export async function getTriageAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    const { severity } = req.query;

    let filtered = [...inMemoryAlerts];
    if (severity) {
      filtered = filtered.filter(a => a.severity.toLowerCase() === String(severity).toLowerCase());
    }

    const total = filtered.length;
    const startIndex = ((page || 1) - 1) * (limit || 10);
    const paginated = filtered.slice(startIndex, startIndex + (limit || 10));

    return sendPaginated(res, paginated, total, page, limit, 'Triage alerts retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getTriageAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const alert = inMemoryAlerts.find(a => a.id === id);
    if (!alert) return sendError(res, 'NOT_FOUND', 'Triage alert not found', 404);
    return sendSuccess(res, alert, 'Triage alert retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function acknowledgeTriageAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const alertIndex = inMemoryAlerts.findIndex(a => a.id === id);
    if (alertIndex === -1) return sendError(res, 'NOT_FOUND', 'Triage alert not found', 404);

    inMemoryAlerts[alertIndex].acknowledged = true;
    inMemoryAlerts[alertIndex].acknowledgedAt = new Date().toISOString();
    inMemoryAlerts[alertIndex].acknowledgedBy = userId || 'doctor';

    await logAudit({
      userId,
      action: 'ACKNOWLEDGE_TRIAGE_ALERT',
      entity: 'TriageAlert',
      entityId: id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, inMemoryAlerts[alertIndex], 'Triage alert acknowledged');
  } catch (error) {
    return next(error);
  }
}

function runLightGBMInference(patientData: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const candidatePaths = [
      path.resolve(process.cwd(), 'ml_inference.py'),
      path.resolve(process.cwd(), '..', 'ml_inference.py'),
    ];
    const scriptPath = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
    const scriptDir = path.dirname(scriptPath);
    const jsonInput = JSON.stringify(patientData);

    const child = execFile('python', [scriptPath], { cwd: scriptDir, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[LightGBM Inference Error]', stderr || error.message);
        return reject(new Error(`Model execution failed: ${stderr || error.message}`));
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) return reject(new Error(result.error));
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse model output: ${stdout}`));
      }
    });

    if (child.stdin) {
      child.stdin.write(jsonInput);
      child.stdin.end();
    }
  });
}

export async function submitTriageAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body || {};

    const age = Number(body.age);
    const heartRate = Number(body.heart_rate ?? body.heartRate ?? body.hr);
    const systolicBP = Number(body.systolic_bp ?? body.systolicBP ?? body.bp);
    const respiratoryRate = Number(body.respiratory_rate ?? body.respiratoryRate ?? body.respRate);
    const spo2 = Number(body.spo2);
    const temperatureC = Number(body.temperature_c ?? body.temperatureC ?? body.temperature ?? body.temp);
    let consciousness = String(body.consciousness ?? 'A').trim();
    const painScore = Number(body.pain_score ?? body.painScore ?? body.pain ?? 0);
    const chestPain = Boolean(body.chest_pain ?? body.chestPain);
    const breathingDifficulty = Boolean(body.breathing_difficulty ?? body.breathingDifficulty);
    const activeBleeding = Boolean(body.active_bleeding ?? body.activeBleeding);
    const chiefComplaint = String(body.chief_complaint ?? body.chiefComplaint ?? body.symptoms ?? '').trim();
    const symptoms = String(body.symptoms ?? chiefComplaint).trim();
    const duration = String(body.duration ?? 'Less than 24 hours').trim();

    const consciousnessMap: Record<string, string> = {
      'alert': 'A', 'a': 'A',
      'voice': 'V', 'v': 'V',
      'pain': 'P', 'p': 'P',
      'unresponsive': 'U', 'u': 'U'
    };
    consciousness = consciousnessMap[consciousness.toLowerCase()] ?? 'A';

    if (isNaN(age) || age <= 0 || age > 120) {
      return sendError(res, 'VALIDATION_ERROR', 'Age must be a positive number between 1 and 120.', 400);
    }
    if (isNaN(heartRate) || heartRate <= 0 || heartRate > 300) {
      return sendError(res, 'VALIDATION_ERROR', 'Heart Rate must be a valid positive number.', 400);
    }
    if (isNaN(systolicBP) || systolicBP <= 0 || systolicBP > 300) {
      return sendError(res, 'VALIDATION_ERROR', 'Systolic Blood Pressure must be a valid positive number.', 400);
    }
    if (isNaN(respiratoryRate) || respiratoryRate <= 0 || respiratoryRate > 100) {
      return sendError(res, 'VALIDATION_ERROR', 'Respiratory Rate must be a valid positive number.', 400);
    }
    if (isNaN(spo2) || spo2 < 0 || spo2 > 100) {
      return sendError(res, 'VALIDATION_ERROR', 'SpO2 must be between 0 and 100.', 400);
    }
    if (isNaN(temperatureC) || temperatureC < 25 || temperatureC > 45) {
      return sendError(res, 'VALIDATION_ERROR', 'Temperature must be between 25°C and 45°C.', 400);
    }
    if (isNaN(painScore) || painScore < 0 || painScore > 10) {
      return sendError(res, 'VALIDATION_ERROR', 'Pain Score must be between 0 and 10.', 400);
    }
    if (!chiefComplaint && !symptoms) {
      return sendError(res, 'VALIDATION_ERROR', 'Chief complaint or symptom description is required.', 400);
    }

    const mlInput = {
      age,
      heart_rate: heartRate,
      systolic_bp: systolicBP,
      respiratory_rate: respiratoryRate,
      spo2,
      temperature_c: temperatureC,
      consciousness,
      pain_score: painScore,
      chest_pain: chestPain ? 1 : 0,
      breathing_difficulty: breathingDifficulty ? 1 : 0,
      active_bleeding: activeBleeding ? 1 : 0,
      chief_complaint: chiefComplaint || symptoms
    };

    const mlResult = await runLightGBMInference(mlInput);

    const rawPrediction: string = mlResult.prediction; // "CRITICAL", "EMERGENT", "URGENT", "LESS_URGENT", "NON_URGENT"
    const proba: Record<string, number> = mlResult.probabilities || {};

    const predictedClassProb = Number(mlResult.confidence ?? proba[rawPrediction] ?? 0);
    const confidencePercentage = Math.round(predictedClassProb * 100);

    let urgencyCategory = 'STANDARD';
    if (rawPrediction === 'CRITICAL' || rawPrediction === 'EMERGENT') {
      urgencyCategory = 'CRITICAL';
    } else if (rawPrediction === 'URGENT') {
      urgencyCategory = 'URGENT';
    }

    console.log('\n=================== [TRIAGE INFERENCE LOG] ===================');
    console.log('Input features:', JSON.stringify(mlInput, null, 2));
    console.log('Raw model prediction (Class):', rawPrediction, `(Raw Code: ${mlResult.raw_class})`);
    console.log('Class probabilities:', JSON.stringify(proba, null, 2));
    console.log('Model Confidence:', `${confidencePercentage}%`);
    console.log('===============================================================\n');

    const assessmentId = `triage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const emergencyNumber = process.env.EMERGENCY_NUMBER || '999';

    await logAudit({
      userId: req.user?.userId,
      action: 'TRIAGE_ASSESSMENT',
      entity: 'TriageAssessment',
      entityId: assessmentId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      assessmentId,
      prediction: rawPrediction,
      urgencyCategory,
      confidence: confidencePercentage,
      probability_sum: mlResult.probability_sum ?? 1.0,
      probabilities: {
        CRITICAL: proba.CRITICAL || 0,
        EMERGENT: proba.EMERGENT || 0,
        URGENT: proba.URGENT || 0,
        LESS_URGENT: proba.LESS_URGENT || 0,
        NON_URGENT: proba.NON_URGENT || 0
      },
      emergencyNumber,
      emergencyEscalation: rawPrediction === 'CRITICAL' ? {
        initiated: true,
        emergencyNumber,
        defaultHospitalName: 'Emergency Department (A&E)',
        actionRequired: `Call Emergency Services (${emergencyNumber}) or attend nearest A&E immediately.`
      } : null,
      is_out_of_distribution: Boolean(mlResult.is_out_of_distribution),
      ood_warnings: mlResult.ood_warnings || [],
      model: {
        name: 'LightGBM Emergency Triage Predictor',
        version: mlResult.model_version || '1.0.0',
        dataset: 'synthetic_triage_data_250k.csv',
        datasetStatus: 'Development / Demo'
      },
      rationale: `Model assigned ${rawPrediction} based on the submitted vital signs and triage symptoms.`,
      disclaimer: 'Dataset: Synthetic (synthetic_triage_data_250k.csv) · Purpose: Development / Demo · Not a medical diagnosis.'
    }, 'Triage assessment completed successfully');
  } catch (error) {
    return next(error);
  }
}
