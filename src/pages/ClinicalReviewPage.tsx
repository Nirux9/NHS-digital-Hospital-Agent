import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Activity, 
  User, 
  HeartPulse, 
  AlertTriangle, 
  Calendar, 
  Pill, 
  FileText, 
  Save, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  Info
} from 'lucide-react';
import { 
  getPatients, 
  getPatientClinicalSummary, 
  createClinicalReview, 
  updateClinicalReview, 
  acknowledgeTriageAlert, 
  getHealthCheck 
} from '../services/api';

interface ClinicalReviewPageProps {
  currentRole: string;
}

export const ClinicalReviewPage: React.FC<ClinicalReviewPageProps> = ({ currentRole }) => {
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('patient1');
  const [patientSearch, setPatientSearch] = useState('');

  const [clinicalSummary, setClinicalSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState<{ isLive: boolean; text: string }>({
    isLive: false,
    text: 'Checking Connection...'
  });

  // Clinical Review Form State
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [assessmentText, setAssessmentText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [planText, setPlanText] = useState('');
  const [reviewStatus, setReviewStatus] = useState('COMPLETED');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Check Backend Health (Requirement 21)
  const checkHealth = async () => {
    const health = await getHealthCheck();
    if (health && (health.status === 'ok' || health.database === 'connected')) {
      setBackendStatus({ isLive: true, text: 'Live Backend Connected' });
    } else {
      setBackendStatus({ isLive: false, text: 'Backend Offline' });
    }
  };

  // Fetch Patient Search Options
  const fetchPatientOptions = async (query = patientSearch) => {
    try {
      const data = await getPatients({ search: query, limit: 10, role: currentRole.toLowerCase() });
      if (data && data.patients) {
        setPatientsList(data.patients);
      }
    } catch (err) {
      console.warn('Failed to fetch patient list:', err);
    }
  };

  // Fetch Full Clinical Dossier for Selected Patient
  const fetchClinicalDossier = async (patientId = selectedPatientId) => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    setSaveError('');

    try {
      const dossier = await getPatientClinicalSummary(patientId, currentRole.toLowerCase());
      if (dossier) {
        setClinicalSummary(dossier);
        // Load latest review if available
        if (dossier.reviews && dossier.reviews.length > 0) {
          const latestRev = dossier.reviews[0];
          setActiveReviewId(latestRev.id);
          setAssessmentText(latestRev.assessment || '');
          setNotesText(latestRev.clinicalNotes || '');
          setPlanText(latestRev.treatmentPlan || '');
          setReviewStatus(latestRev.status || 'COMPLETED');
        } else {
          setActiveReviewId(null);
          setAssessmentText('');
          setNotesText('');
          setPlanText('');
          setReviewStatus('COMPLETED');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load patient clinical summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchPatientOptions('');
    fetchClinicalDossier('patient1');
  }, [currentRole]);

  // Handle Patient Selection Change
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    fetchClinicalDossier(id);
  };

  // Handle Acknowledge Alert (Requirement 15 & 16)
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeTriageAlert(alertId);
      fetchClinicalDossier(selectedPatientId);
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert.');
    }
  };

  // Handle Save / Update Clinical Review (Requirement 12 & 13)
  const handleSaveReview = async (statusToSet = reviewStatus) => {
    if (!assessmentText.trim()) {
      setSaveError('Clinical Assessment Rationale is required.');
      return;
    }

    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        patientId: selectedPatientId,
        assessment: assessmentText,
        clinicalNotes: notesText,
        treatmentPlan: planText,
        status: statusToSet,
        role: currentRole.toLowerCase()
      };

      let result;
      if (activeReviewId) {
        result = await updateClinicalReview(activeReviewId, payload);
      } else {
        result = await createClinicalReview(payload);
      }

      if (result && result.success) {
        setSaveSuccess(`Clinical review saved successfully (${statusToSet}).`);
        fetchClinicalDossier(selectedPatientId);
      } else {
        setSaveError(result?.error?.message || 'Failed to save clinical review.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Saving clinical review failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  const getTriageBadge = (prediction: string) => {
    switch (prediction) {
      case 'CRITICAL':
      case 'EMERGENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'URGENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LESS_URGENT':
      case 'NON_URGENT':
      default:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NHS Acute Clinical Review & Decision Support Workspace</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Synchronized with PostgreSQL · LightGBM Machine Learning Triage & Clinical Governance
          </p>
        </div>

        {/* Backend Health Status Badge (Requirement 21) */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-colors ${
              backendStatus.isLive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${backendStatus.isLive ? 'animate-pulse' : ''}`} />
            {backendStatus.text}
          </span>
        </div>
      </div>

      {/* Patient Search & Selection Bar (Requirement 6) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="font-bold text-xs text-gray-700 flex items-center gap-1.5 whitespace-nowrap">
            <User className="w-4 h-4 text-[#003087]" /> Select Patient:
          </label>

          <select
            value={selectedPatientId}
            onChange={(e) => handleSelectPatient(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#003087] focus:outline-none"
          >
            {patientsList.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.name} ({pt.patientIdStr || pt.id}) — {pt.department}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchClinicalDossier(selectedPatientId)}
          disabled={loading}
          className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Dossier
        </button>
      </div>

      {/* Main Workspace Layout */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-red-900 text-sm">{error}</h3>
          <button
            onClick={() => fetchClinicalDossier(selectedPatientId)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors"
          >
            Retry Loading Clinical Summary
          </button>
        </div>
      ) : loading || !clinicalSummary ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#003087] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Loading patient clinical summary & triage history from PostgreSQL...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left & Middle Column (Demographics, Triage, Clinical History) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Patient Summary (Requirement 7) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#003087]" /> Patient Demographics
                </h3>
                <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {clinicalSummary.patient.patientIdStr || clinicalSummary.patient.id}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-700">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Full Name</span>
                  <span className="font-bold text-gray-900">{clinicalSummary.patient.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Age / Gender</span>
                  <span className="font-bold text-gray-900">{clinicalSummary.patient.age} yrs / {clinicalSummary.patient.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Date of Birth</span>
                  <span className="font-bold text-gray-900">{clinicalSummary.patient.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Phone</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" /> {clinicalSummary.patient.phone}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-gray-400 font-medium block">Address</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" /> {clinicalSummary.patient.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Triage Assessment & ML Decision Support (Requirement 8, 9, 10, 17) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-green-700" /> Machine Learning Decision Support & Triage Assessment
                </h3>
                <span className={`px-3 py-1 text-xs font-bold border rounded-full ${getTriageBadge(clinicalSummary.latestTriage.prediction)}`}>
                  {clinicalSummary.latestTriage.prediction} ({clinicalSummary.latestTriage.confidence}% Confidence)
                </span>
              </div>

              {/* 5-Class Probabilities Grid */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-900">LightGBM Multiclass Probability Distribution ($\sum p_i = 100\%$):</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 bg-red-100/60 rounded-lg border border-red-200">
                    <span className="text-[10px] text-red-900 font-semibold block">Critical</span>
                    <span className="font-mono font-bold text-red-950">
                      {Math.round((clinicalSummary.latestTriage.probabilities?.CRITICAL || 0) * 100)}%
                    </span>
                  </div>
                  <div className="p-2 bg-orange-100/60 rounded-lg border border-orange-200">
                    <span className="text-[10px] text-orange-900 font-semibold block">Emergent</span>
                    <span className="font-mono font-bold text-orange-950">
                      {Math.round((clinicalSummary.latestTriage.probabilities?.EMERGENT || 0) * 100)}%
                    </span>
                  </div>
                  <div className="p-2 bg-amber-100/60 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-amber-900 font-semibold block">Urgent</span>
                    <span className="font-mono font-bold text-amber-950">
                      {Math.round((clinicalSummary.latestTriage.probabilities?.URGENT || 0) * 100)}%
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100/60 rounded-lg border border-blue-200">
                    <span className="text-[10px] text-blue-900 font-semibold block">Less Urgent</span>
                    <span className="font-mono font-bold text-blue-950">
                      {Math.round((clinicalSummary.latestTriage.probabilities?.LESS_URGENT || 0) * 100)}%
                    </span>
                  </div>
                  <div className="p-2 bg-green-100/60 rounded-lg border border-green-200">
                    <span className="text-[10px] text-green-900 font-semibold block">Non Urgent</span>
                    <span className="font-mono font-bold text-green-950">
                      {Math.round((clinicalSummary.latestTriage.probabilities?.NON_URGENT || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Vitals Summary */}
              <div className="text-xs text-gray-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <strong>Physiological Vitals:</strong> {clinicalSummary.latestTriage.vitals}
              </div>

              {/* Conservative AI Clinical Rationale (Requirement 10 & 17) */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-bold">Decision Support Disclaimer:</strong> The LightGBM model classified this triage input as <strong>{clinicalSummary.latestTriage.prediction}</strong>. This machine-learning output is decision support only and does not replace human clinical judgment.
                </p>
              </div>
            </div>

            {/* Section 3: Active Triage Alerts (Requirement 15 & 16) */}
            {clinicalSummary.alerts && clinicalSummary.alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-sm text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Active High-Risk Triage Alerts
                </h3>
                <div className="space-y-2">
                  {clinicalSummary.alerts.map((alt: any) => (
                    <div key={alt.id} className="bg-white p-3.5 rounded-xl border border-red-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="font-bold text-xs text-red-950">{alt.patientName} — {alt.severity}</p>
                        <p className="text-xs text-gray-700 mt-0.5">{alt.message}</p>
                        <span className="text-[10px] text-gray-400 font-medium">{alt.timeAgo}</span>
                      </div>
                      <button
                        onClick={() => handleAcknowledgeAlert(alt.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge Alert
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Clinical History (Requirement 11) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">Patient Clinical History</h3>

              {/* Appointments */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" /> Appointments
                </h4>
                {clinicalSummary.appointments.length === 0 ? (
                  <p className="text-xs text-gray-400">No appointment records.</p>
                ) : (
                  <div className="space-y-1.5">
                    {clinicalSummary.appointments.map((apt: any) => (
                      <div key={apt.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{apt.reason}</span>
                          <span className="text-gray-500 block text-[10px]">With {apt.doctorName} ({apt.department})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-800">{apt.date} at {apt.time}</span>
                          <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 block font-bold mt-0.5">
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Diagnostic Test Results */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" /> Diagnostic Test Results
                </h4>
                {clinicalSummary.testResults.length === 0 ? (
                  <p className="text-xs text-gray-400">No test results available.</p>
                ) : (
                  <div className="space-y-1.5">
                    {clinicalSummary.testResults.map((tr: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{tr.testName}</span>
                          <span className="text-gray-500 block text-[10px]">Ref Range: {tr.referenceRange}</span>
                        </div>
                        <span className="font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {tr.result}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Doctor's Clinical Review Form (Requirement 12, 13, 14, 17) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#003087]" /> Clinician Review & Notes
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Attending: Dr. Sarah Jenkins</span>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
                  {saveSuccess}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Clinical Assessment / Rationale *</label>
                  <input
                    type="text"
                    value={assessmentText}
                    onChange={(e) => setAssessmentText(e.target.value)}
                    placeholder="e.g. Acute Substernal Chest Pain - Rule out ACS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none font-semibold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Clinical Notes & Exam Findings</label>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Document physical exam, ECG findings, Troponin level..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Treatment & Management Plan</label>
                  <textarea
                    value={planText}
                    onChange={(e) => setPlanText(e.target.value)}
                    placeholder="Medications administered, telemetry monitoring, ward admission..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Review Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleSaveReview('DRAFT')}
                    disabled={saveLoading}
                    className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    Save Draft
                  </button>

                  <button
                    onClick={() => handleSaveReview('COMPLETED')}
                    disabled={saveLoading}
                    className="flex-1 py-2 px-3 bg-[#003087] hover:bg-[#005eb8] text-white rounded-xl font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Complete Review
                  </button>
                </div>
              </div>

              {/* Review History */}
              {clinicalSummary.reviews && clinicalSummary.reviews.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <h4 className="font-bold text-gray-900 text-xs">Previous Reviews ({clinicalSummary.reviews.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {clinicalSummary.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <span>{rev.doctorName}</span>
                          <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                            {rev.status}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium">{rev.assessment}</p>
                        <span className="text-[10px] text-gray-400 block">{new Date(rev.updatedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
