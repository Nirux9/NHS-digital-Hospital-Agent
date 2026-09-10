import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { createAppointment, getDoctors } from '../services/api';

export const BookAppointmentModal: React.FC<{ onClose: () => void; onSuccess?: (apt: any) => void }> = ({ onClose, onSuccess }) => {
  const [reason, setReason] = useState('Follow-up Assessment');
  const [date, setDate] = useState('2026-08-25');
  const [time, setTime] = useState('10:30');
  const [doctorId, setDoctorId] = useState('doc_1');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmedApt, setConfirmedApt] = useState<any>(null);

  useEffect(() => {
    getDoctors()
      .then((docs) => {
        if (docs && docs.length > 0) {
          setDoctorsList(docs);
          setDoctorId(docs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await createAppointment({
        patientId: 'patient1',
        doctorId: doctorId || 'doc_1',
        date,
        time,
        reason,
      });

      const booked = result.data?.appointment;
      setConfirmedApt(booked);
      setSubmitted(true);
      if (onSuccess) onSuccess(booked);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-5 space-y-4 relative">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-base text-gray-900">Book NHS Appointment</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h4 className="font-bold text-gray-900 text-base">Appointment Booked!</h4>
            <div className="text-xs text-gray-600 bg-green-50/70 p-3 rounded-xl border border-green-200 text-left space-y-1 max-w-xs mx-auto">
              <p className="font-bold text-green-900">{confirmedApt?.reason || reason}</p>
              <p>📅 {confirmedApt?.date || date} at {confirmedApt?.time || time}</p>
              <p>👨‍⚕️ {confirmedApt?.doctorName || 'Dr. Sarah Jenkins'}</p>
              <p>📍 {confirmedApt?.room || 'Room 204, Cardiology'}</p>
            </div>
            <p className="text-[11px] text-gray-400">Confirmation notification sent to your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 mb-1">Reason for Visit</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
              >
                <option value="Follow-up Assessment">Follow-up Assessment</option>
                <option value="Acute Pain Review">Acute Pain Review</option>
                <option value="Post Op Check">Post Op Check</option>
                <option value="Routine Checkup">Routine Checkup</option>
                <option value="Cardiology Consult">Cardiology Consult</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" /> Preferred Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" /> Time Slot
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087]"
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:15">11:15 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-500" /> Specialty / Doctor
              </label>
              {doctorsList.length > 0 ? (
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#003087] font-medium"
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value="Dr. Sarah Jenkins (Cardiology)"
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-medium"
                />
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#003087] text-white rounded-xl font-bold hover:bg-[#005eb8] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
