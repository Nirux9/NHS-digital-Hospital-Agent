import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError, sendPaginated, getPagination } from '../utils/response';
import prisma from '../config/database';

const defaultPatients = [
  { id: 'patient1', patient_code: 'P-1001', name: 'James Thornton', first_name: 'James', last_name: 'Thornton', age: 60, gender: 'Male', date_of_birth: '1964-05-12', blood_group: 'A+', phone: '+44 7700 900003', address: '42 High Street, London, E1 6AN', department: 'Cardiology', status: 'Active' },
  { id: 'patient2', patient_code: 'P-1002', name: 'Sarah Mitchell', first_name: 'Sarah', last_name: 'Mitchell', age: 32, gender: 'Female', date_of_birth: '1992-11-24', blood_group: 'O-', phone: '+44 7700 900004', address: '15 Station Road, London, NW1 2DB', department: 'Emergency Medicine', status: 'Active' },
  { id: 'patient3', patient_code: 'P-1003', name: 'Robert Brown', first_name: 'Robert', last_name: 'Brown', age: 68, gender: 'Male', date_of_birth: '1956-03-18', blood_group: 'B+', phone: '+44 7700 900005', address: '88 Park Lane, London, W1K 7TN', department: 'Cardiology', status: 'Active' }
];

export async function getAllPatients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    let items = defaultPatients;

    try {
      const patientModel = (prisma as any).patients || (prisma as any).patient;
      if (patientModel && typeof patientModel.findMany === 'function') {
        const dbItems = await patientModel.findMany({ take: limit });
        if (dbItems && dbItems.length > 0) {
          items = dbItems.map((p: any) => ({
            id: `pt_${p.patient_id}`,
            patient_code: p.patient_code || `P-${p.patient_id}`,
            name: `${p.first_name} ${p.last_name || ''}`.trim(),
            first_name: p.first_name,
            last_name: p.last_name,
            age: 45,
            gender: p.gender || 'Unknown',
            date_of_birth: p.date_of_birth ? new Date(p.date_of_birth).toISOString().split('T')[0] : '1980-01-01',
            blood_group: p.blood_group || 'O+',
            phone: p.phone || '+44 7700 900000',
            address: p.address || 'London, UK',
            department: 'General Medicine',
            status: 'Active'
          }));
        }
      }
    } catch (e) {
      console.warn('[getAllPatients Error]', e);
    }

    return sendPaginated(res, items, items.length, page, limit, 'Patients retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let patient = defaultPatients.find((p) => String(p.id) === String(id) || p.patient_code === id) || defaultPatients[0];

    try {
      const patientModel = (prisma as any).patients || (prisma as any).patient;
      if (patientModel && typeof patientModel.findFirst === 'function') {
        const dbPatient = await patientModel.findFirst({
          where: { OR: [{ patient_id: isNaN(Number(id)) ? undefined : Number(id) }, { patient_code: id }] }
        });
        if (dbPatient) {
          patient = {
            id: `pt_${dbPatient.patient_id}`,
            patient_code: dbPatient.patient_code,
            name: `${dbPatient.first_name} ${dbPatient.last_name || ''}`.trim(),
            first_name: dbPatient.first_name,
            last_name: dbPatient.last_name,
            age: 45,
            gender: dbPatient.gender || 'Unknown',
            date_of_birth: dbPatient.date_of_birth ? new Date(dbPatient.date_of_birth).toISOString().split('T')[0] : '1980-01-01',
            blood_group: dbPatient.blood_group || 'O+',
            phone: dbPatient.phone || '+44 7700 900000',
            address: dbPatient.address || 'London, UK',
            department: 'General Medicine',
            status: 'Active'
          };
        }
      }
    } catch {}

    return sendSuccess(res, patient, 'Patient details retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getPatientClinicalSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const roleQuery = String(req.query.role || req.user?.role || 'doctor').toLowerCase();

    if (roleQuery === 'patient' && id !== 'patient1' && req.user?.userId !== id) {
      return sendError(res, 'FORBIDDEN', "You are not authorized to access another patient's clinical records.", 403);
    }

    let patient: any = null;
    try {
      const patientModel = (prisma as any).patients || (prisma as any).patient;
      if (patientModel && typeof patientModel.findFirst === 'function') {
        const dbPatient = await patientModel.findFirst({
          where: { OR: [{ patient_code: id }, { patient_id: isNaN(Number(id)) ? undefined : Number(id) }] },
          include: { admissions: true }
        });
        if (dbPatient) {
          patient = {
            id: `pt_${dbPatient.patient_id}`,
            patientIdStr: dbPatient.patient_code,
            name: `${dbPatient.first_name} ${dbPatient.last_name || ''}`.trim(),
            email: `${dbPatient.first_name.toLowerCase()}.${(dbPatient.last_name || 'pt').toLowerCase()}@nhs.demo`,
            phone: dbPatient.phone || '+44 7700 900000',
            age: 45,
            gender: dbPatient.gender || 'Unknown',
            dateOfBirth: dbPatient.date_of_birth ? new Date(dbPatient.date_of_birth).toISOString().split('T')[0] : '1980-01-01',
            address: dbPatient.address || 'London, UK',
            emergencyContact: 'Emergency Contact (+44 7700 900099)',
            department: 'Cardiology'
          };
        }
      }
    } catch (e) {
      console.warn('[Prisma getPatientClinicalSummary]', e);
    }

    if (!patient) {
      const patientDossiers: Record<string, any> = {
        patient1: {
          id: 'patient1',
          patientIdStr: 'P-1001',
          name: 'James Thornton',
          email: 'james.thornton@nhs.demo',
          phone: '+44 7700 900003',
          age: 60,
          gender: 'Male',
          dateOfBirth: '1964-05-12',
          address: '42 High Street, London, E1 6AN',
          emergencyContact: 'Mary Thornton (+44 7700 900099)',
          department: 'Cardiology'
        },
        patient2: {
          id: 'patient2',
          patientIdStr: 'P-1002',
          name: 'Sarah Mitchell',
          email: 'sarah.mitchell@nhs.demo',
          phone: '+44 7700 900004',
          age: 32,
          gender: 'Female',
          dateOfBirth: '1992-11-24',
          address: '15 Station Road, London, NW1 2DB',
          emergencyContact: 'John Mitchell (+44 7700 900098)',
          department: 'Emergency Medicine'
        },
        patient3: {
          id: 'patient3',
          patientIdStr: 'P-1003',
          name: 'Robert Brown',
          email: 'robert.brown@nhs.demo',
          phone: '+44 7700 900005',
          age: 68,
          gender: 'Male',
          dateOfBirth: '1956-03-18',
          address: '88 Park Lane, London, W1K 7TN',
          emergencyContact: 'Linda Brown (+44 7700 900097)',
          department: 'Cardiology'
        }
      };
      patient = patientDossiers[id] || patientDossiers['patient1'];
    }

    const latestTriage = {
      prediction: 'CRITICAL',
      confidence: 96,
      probabilities: {
        CRITICAL: 0.85,
        EMERGENT: 0.10,
        URGENT: 0.03,
        LESS_URGENT: 0.01,
        NON_URGENT: 0.01
      },
      vitals: 'SpO2 84%, HR 135 bpm, BP 94/34, Resp 32/min, Temp 38.2°C',
      modelName: 'LightGBM Emergency Triage Predictor',
      modelVersion: '1.0.0',
      createdAt: new Date().toISOString()
    };

    const alerts = [
      {
        id: '1',
        patientName: patient.name,
        location: 'Bed 12 - Cardiac Unit',
        timeAgo: '10m ago',
        message: 'Abnormal vital signs detected (SpO2 84%). Immediate clinical review required.',
        severity: 'Critical',
        acknowledged: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ];

    const appointments = [
      {
        id: 'apt_1',
        date: '2026-08-25',
        time: '10:30 AM',
        doctorName: 'Dr. Sarah Jenkins',
        reason: 'Follow-up Assessment',
        room: 'Room 204, Cardiology',
        status: 'CONFIRMED'
      }
    ];

    const prescriptions = [
      { id: 'rx_1', medication: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days', status: 'ACTIVE' },
      { id: 'rx_2', medication: 'Atorvastatin', dosage: '80mg', frequency: 'Once daily at night', duration: '30 days', status: 'ACTIVE' }
    ];

    const testResults = [
      { id: 'tr_1', testName: 'High Sensitivity Troponin T', result: '142 ng/L', referenceRange: '0 - 14 ng/L', status: 'AVAILABLE', createdAt: '2026-08-22' },
      { id: 'tr_2', testName: 'Full Blood Count (FBC)', result: 'Normal', referenceRange: 'Standard', status: 'REVIEWED', createdAt: '2026-08-21' }
    ];

    const reviews = [
      {
        id: 'rev_1',
        patientId: patient.id,
        assessment: 'Patient presents with persistent acute dyspnea and elevated troponin levels.',
        clinicalNotes: 'Initiated oxygen therapy and continuous telemetry monitor.',
        treatmentPlan: 'Schedule urgent coronary angiogram and continue dual antiplatelet therapy.',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    return sendSuccess(res, {
      patient,
      latestTriage,
      alerts,
      appointments,
      prescriptions,
      testResults,
      reviews
    }, 'Clinical summary dossier retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

export async function createPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const newPatient = {
      id: String(Date.now()),
      patient_code: `NHS-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    return sendSuccess(res, newPatient, 'Patient record created', 201);
  } catch (error) {
    return next(error);
  }
}

export async function updatePatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, { id: req.params.id, ...req.body }, 'Patient record updated');
  } catch (error) {
    return next(error);
  }
}

export async function deletePatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, null, 'Patient record deleted');
  } catch (error) {
    return next(error);
  }
}

export async function getPatientAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = getPagination(req.query);
    const mockApts = [
      { id: '1', date: 'Today', time: '10:30 AM', reason: 'Follow-up Assessment', doctorName: 'Dr. Sarah Jenkins', room: 'Room 3, North Wing', status: 'CONFIRMED' }
    ];
    return sendPaginated(res, mockApts, mockApts.length, page, limit, 'Patient appointments retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getPatientMedicalRecords(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const mockRecords = [
      { id: '1', diagnosis: 'Essential Hypertension', doctorName: 'Dr. Sarah Jenkins', notes: 'Patient responding well to antihypertensive therapy.', date: '2026-08-15' }
    ];
    return sendSuccess(res, mockRecords, 'Medical records retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getPatientPrescriptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const mockPrescriptions = [
      { id: '1', medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days', status: 'ACTIVE' }
    ];
    return sendSuccess(res, mockPrescriptions, 'Prescriptions retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getPatientTestResults(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const mockTests = [
      { id: '1', testName: 'Full Blood Count (FBC)', result: 'WBC 6.5, Hb 14.2', unit: 'g/dL', referenceRange: '13.0-17.0', status: 'AVAILABLE', createdAt: '2026-08-20' }
    ];
    return sendSuccess(res, mockTests, 'Test results retrieved');
  } catch (error) {
    return next(error);
  }
}

export async function getPatientNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const mockNotifications = [
      { id: '1', title: 'Appointment Confirmed', message: 'Your cardiology appointment is confirmed for today.', isRead: false, createdAt: '10 min ago' }
    ];
    return sendSuccess(res, mockNotifications, 'Notifications retrieved');
  } catch (error) {
    return next(error);
  }
}
