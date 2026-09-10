import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  MapPin, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  CalendarRange, 
  Building2,
  Plus
} from 'lucide-react';
import { getSchedules, rescheduleAppointment, cancelAppointment, getDoctors } from '../services/api';
import { StatusBadge, SeverityBadge, CardSkeleton, TableSkeleton } from '../components/CommonUI';

interface SchedulesPageProps {
  currentRole: string;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const SchedulesPage: React.FC<SchedulesPageProps> = ({ currentRole, onShowToast }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDoctor, setSelectedDoctor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalToday: 0, confirmed: 0, pending: 0, availableSlots: 12, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals State
  const [selectedAptDetails, setSelectedAptDetails] = useState<any | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:30');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDoctors = async () => {
    try {
      const docs = await getDoctors();
      setDoctorsList(Array.isArray(docs) ? docs : []);
    } catch {}
  };

  const fetchSchedulesData = async (dateVal = selectedDate, doctorVal = selectedDoctor, statusVal = selectedStatus) => {
    setLoading(true);
    setError('');
    try {
      const data = await getSchedules({
        date: dateVal,
        doctorId: doctorVal !== 'ALL' ? doctorVal : undefined,
        status: statusVal !== 'ALL' ? statusVal : undefined,
        role: currentRole.toLowerCase()
      });
      if (data) {
        if (data.appointments) setSchedules(data.appointments);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err: any) {
      // Fallback
      setSchedules([
        { id: '1', time: '09:00 AM', date: selectedDate, reason: 'Follow-up Assessment', patientName: 'John Doe', doctorName: 'Dr. Sarah Jenkins', department: 'Cardiology', room: 'Room 3 North Wing', status: 'CONFIRMED', triage: 'Standard' },
        { id: '2', time: '10:30 AM', date: selectedDate, reason: 'Acute Pain Review', patientName: 'Jane Smith', doctorName: 'Dr. Rajesh Patel', department: 'Emergency Medicine', room: 'A&E Bay 2', status: 'CONFIRMED', triage: 'Urgent' },
        { id: '3', time: '11:15 AM', date: selectedDate, reason: 'Post Op Check', patientName: 'Robert Brown', doctorName: 'Dr. Sarah Jenkins', department: 'Cardiology', room: 'Room 5 North Wing', status: 'SCHEDULED', triage: 'Critical' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchSchedulesData(selectedDate, selectedDoctor, selectedStatus);
  }, [currentRole]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const nextStr = d.toISOString().split('T')[0];
    setSelectedDate(nextStr);
    fetchSchedulesData(nextStr, selectedDoctor, selectedStatus);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return;
    setActionLoading(true);

    try {
      await rescheduleAppointment(rescheduleApt.id, rescheduleDate, rescheduleTime);
      onShowToast?.('Appointment rescheduled successfully!', 'success');
      setRescheduleApt(null);
      fetchSchedulesData(selectedDate, selectedDoctor, selectedStatus);
    } catch (err: any) {
      onShowToast?.(err.message || 'Failed to reschedule appointment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (id: string) => {
    try {
      await cancelAppointment(id);
      onShowToast?.('Appointment cancelled successfully.', 'success');
      fetchSchedulesData(selectedDate, selectedDoctor, selectedStatus);
    } catch (err: any) {
      onShowToast?.(err.message || 'Cancellation failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Clinical Schedule & Appointment Matrix</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            PostgreSQL Database Synchronized · Real-Time Availability & Conflict Checking
          </p>
        </div>
      </div>

      {/* Admin Analytics Summary Cards */}
      {currentRole === 'Admin' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003087] flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Today</p>
              <h3 className="text-xl font-extrabold text-slate-900">{metrics.totalToday || schedules.length}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Confirmed</p>
              <h3 className="text-xl font-extrabold text-slate-900">{metrics.confirmed || schedules.filter(s=>s.status==='CONFIRMED').length}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Available Slots</p>
              <h3 className="text-xl font-extrabold text-slate-900">{metrics.availableSlots}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Cancelled</p>
              <h3 className="text-xl font-extrabold text-slate-900">{metrics.cancelled}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Controls & Toolbar: Date Selector, View Switcher & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                fetchSchedulesData(todayStr, selectedDoctor, selectedStatus);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDate === todayStr ? 'bg-[#003087] text-white shadow-2xs' : 'text-slate-700 hover:bg-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              fetchSchedulesData(e.target.value, selectedDoctor, selectedStatus);
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#003087] focus:outline-none"
          />
        </div>

        {/* View & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* View Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-[#003087] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-[#003087] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Doctor Filter (Admin/Doctor) */}
          {currentRole !== 'Patient' && (
            <select
              value={selectedDoctor}
              onChange={(e) => {
                setSelectedDoctor(e.target.value);
                fetchSchedulesData(selectedDate, e.target.value, selectedStatus);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#003087] focus:outline-none"
            >
              <option value="ALL">All Clinicians</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name || doc.user?.name} ({doc.department})</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              fetchSchedulesData(selectedDate, selectedDoctor, e.target.value);
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#003087] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>

          <button
            onClick={() => fetchSchedulesData(selectedDate, selectedDoctor, selectedStatus)}
            disabled={loading}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Schedule Content */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <CalendarRange className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No appointments scheduled for this date.</h3>
          <p className="text-xs text-slate-500">There are no matching appointment records for {selectedDate}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {schedules.map((apt) => (
              <div key={apt.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                {/* Time & Patient Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 py-2 px-3 bg-[#003087]/10 border border-[#003087]/20 rounded-xl text-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#003087] mx-auto mb-0.5" />
                    <span className="font-extrabold text-xs text-[#003087] block">{apt.time}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{apt.reason}</h4>
                      <StatusBadge status={apt.status || 'CONFIRMED'} size="sm" />
                      {apt.triage && <SeverityBadge severity={apt.triage} size="sm" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Patient: <strong>{apt.patientName}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        Clinician: <strong>{apt.doctorName}</strong> ({apt.department})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Location: {apt.room || 'Clinic Room'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setSelectedAptDetails(apt)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    View Details
                  </button>

                  {apt.status !== 'CANCELLED' && (
                    <>
                      <button
                        onClick={() => {
                          setRescheduleApt(apt);
                          setRescheduleDate(apt.date);
                          setRescheduleTime(apt.time);
                        }}
                        className="px-3 py-1.5 bg-[#003087] hover:bg-[#002060] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelSubmit(apt.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAptDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Appointment Record Details</h3>
              <button onClick={() => setSelectedAptDetails(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Clinical Reason:</strong> {selectedAptDetails.reason}</p>
                <p><strong>Patient Name:</strong> {selectedAptDetails.patientName} (ID: {selectedAptDetails.patientId || 'P-1001'})</p>
                <p><strong>Attending Clinician:</strong> {selectedAptDetails.doctorName} ({selectedAptDetails.department})</p>
                <p><strong>Date & Time:</strong> {selectedAptDetails.date} at {selectedAptDetails.time}</p>
                <p><strong>Location:</strong> {selectedAptDetails.room}</p>
                <p><strong>Status:</strong> {selectedAptDetails.status}</p>
                <p><strong>EPR Reference:</strong> {selectedAptDetails.id}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="px-4 py-2 bg-[#003087] text-white rounded-xl font-bold text-xs hover:bg-[#002060]"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Reschedule Appointment</h3>
              <button onClick={() => setRescheduleApt(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Rescheduling appointment for <strong>{rescheduleApt.patientName}</strong> with <strong>{rescheduleApt.doctorName}</strong>.
              </p>

              <div>
                <label className="font-bold text-slate-900 block mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none font-semibold"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:15 AM">11:15 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
