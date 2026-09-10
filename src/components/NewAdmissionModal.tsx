import React, { useState, useEffect } from 'react';
import { X, User, BedDouble, Stethoscope, Plus, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getPatients, getDoctors, getWardsSummary, getBedsMap, createAdmission } from '../services/api';

interface NewAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export const NewAdmissionModal: React.FC<NewAdmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);

  // Form state
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('45');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  
  const [reason, setReason] = useState('Acute Respiratory Distress');
  const [department, setDepartment] = useState('Cardiology');
  const [doctorId, setDoctorId] = useState('');
  const [priority, setPriority] = useState('EMERGENT');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [notes, setNotes] = useState('Initial telemetry assessment');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setFormError(null);

    Promise.all([
      getPatients({ limit: 50 }).catch(() => []),
      getDoctors().catch(() => []),
      getWardsSummary().catch(() => []),
      getBedsMap({ status: 'AVAILABLE' }).catch(() => []),
    ])
      .then(([pList, dList, wList, bList]) => {
        const pArr = Array.isArray(pList) ? pList : (pList?.patients || pList?.data || []);
        const dArr = Array.isArray(dList) ? dList : (dList?.doctors || dList?.data || []);
        const wArr = Array.isArray(wList) ? wList : (wList?.wards || wList?.data || []);
        const bArr = Array.isArray(bList) ? bList : (bList?.beds || bList?.data || []);

        setPatients(pArr);
        setDoctors(dArr);
        setWards(wArr);
        setBeds(bArr);

        if (pArr.length > 0) setSelectedPatientId(String(pArr[0].id || pArr[0].patient_id));
        if (dArr.length > 0) setDoctorId(String(dArr[0].id || dArr[0].doctor_id));
        if (wArr.length > 0) setSelectedWardId(String(wArr[0].id || wArr[0].ward_id));
        if (bArr.length > 0) setSelectedBedId(String(bArr[0].id || bArr[0].bed_id));
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter available beds by ward if ward is selected
  const availableBeds = selectedWardId
    ? beds.filter((b) => {
        const bWard = String(b.wardId || b.ward_id || b.ward?.id || '');
        const targetWard = String(selectedWardId);
        return bWard === targetWard || bWard.includes(targetWard) || targetWard.includes(bWard);
      })
    : beds;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const payload = {
      patientType,
      selectedPatientId,
      patient_id: selectedPatientId,
      newPatientName,
      newPatientAge,
      newPatientGender,
      reason,
      admission_reason: reason,
      department,
      doctorId,
      doctor_id: doctorId,
      priority,
      selectedWardId,
      ward_id: selectedWardId,
      selectedBedId,
      bed_id: selectedBedId,
      notes,
      role: 'doctor'
    };

    try {
      const res = await createAdmission(payload);
      if (res && res.success) {
        const adm = res.data;
        const ptName = adm?.patient ? `${adm.patient.first_name} ${adm.patient.last_name || ''}`.trim() : (newPatientName || 'Patient');
        const wardName = adm?.ward?.ward_name || 'Ward';
        const bedNum = adm?.bed?.bed_number || 'Assigned Bed';
        onSuccess?.(`Admission created successfully. Patient: ${ptName} | Ward: ${wardName} | Bed: ${bedNum}`);
        onClose();
      } else {
        throw new Error(res?.error?.message || 'Failed to create admission record.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Unable to create the admission. Please try again.';
      setFormError(errMsg);
      onError?.(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#003087] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Clinical Admission Workflow</h3>
              <p className="text-[10px] text-blue-200 leading-tight">NHS Acute EPR · Real PostgreSQL Transaction</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1 hover:bg-white/20 rounded-lg text-white disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {formError && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Admission Error</p>
              <p className="text-[11px]">{formError}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Patient Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#003087]" /> Patient Information
              </span>
              <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPatientType('existing')}
                  className={`px-2.5 py-1 rounded-md ${patientType === 'existing' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientType('new')}
                  className={`px-2.5 py-1 rounded-md ${patientType === 'new' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  + New Patient
                </button>
              </div>
            </div>

            {patientType === 'existing' ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                >
                  {patients.length === 0 ? (
                    <option value="">Loading patients from PostgreSQL...</option>
                  ) : (
                    patients.map((p) => (
                      <option key={p.id || p.patient_id} value={p.id || p.patient_id}>
                        {p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user?.name} ({p.patientIdStr || p.patient_code || `ID: ${p.patient_id || p.id}`})
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Nolan Jack"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age & Gender</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value)}
                      className="w-16 border border-slate-300 rounded-xl px-2 py-2 text-xs"
                    />
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-xl px-2 py-2 text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Admission Details */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Stethoscope className="w-3.5 h-3.5 text-[#003087]" /> Admission & Priority
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Admission</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="General Surgery">General Surgery</option>
                  <option value="Intensive Care">Intensive Care Unit (ICU)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attending Clinician</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                >
                  {doctors.map((d) => (
                    <option key={d.id || d.doctor_id} value={d.id || d.doctor_id}>
                      {d.name || d.doctor_name || d.user?.name || `Dr. ${d.id}`} ({d.specialty || d.specialization || d.department || 'Cardiology'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#003087]"
                >
                  <option value="CRITICAL" className="text-rose-600">CRITICAL (Level 1)</option>
                  <option value="EMERGENT" className="text-orange-600">EMERGENT (Level 2)</option>
                  <option value="URGENT" className="text-amber-600">URGENT (Level 3)</option>
                  <option value="LESS_URGENT" className="text-sky-600">LESS URGENT (Level 4)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Ward & Bed Allocation */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BedDouble className="w-3.5 h-3.5 text-[#003087]" /> Ward & Bed Allocation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Ward</label>
                <select
                  value={selectedWardId}
                  onChange={(e) => {
                    const wId = e.target.value;
                    setSelectedWardId(wId);
                    const matchingBeds = beds.filter(b => String(b.wardId || b.ward_id || b.ward?.id || '') === wId);
                    if (matchingBeds.length > 0) setSelectedBedId(String(matchingBeds[0].id || matchingBeds[0].bed_id));
                  }}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                >
                  {wards.map((w) => (
                    <option key={w.id || w.ward_id} value={w.id || w.ward_id}>
                      {w.name || w.ward_name} ({w.department || w.ward_type || 'General Medicine'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Available Bed</label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#003087]"
                >
                  {availableBeds.length === 0 ? (
                    <option value="">No beds available in ward</option>
                  ) : (
                    availableBeds.map((b) => (
                      <option key={b.id || b.bed_id} value={b.id || b.bed_id}>
                        Bed {b.bedNumber || b.bed_number} ({b.wardName || 'Available'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Initial Clinical Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Clinical Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter initial clinical observations, triage indicators, or nursing requirements..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#003087] resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Creating Admission...' : 'Create Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
