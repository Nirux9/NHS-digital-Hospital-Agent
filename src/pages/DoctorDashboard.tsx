import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, BedDouble, AlertTriangle, CheckCircle2, Activity, ArrowUpRight, Eye } from 'lucide-react';
import { getTriageAlerts, acknowledgeTriageAlert, getAppointments } from '../services/api';
import { SeverityBadge, StatusBadge, CardSkeleton, TableSkeleton } from '../components/CommonUI';

interface DoctorDashboardProps {
  onNavigateToTab?: (tab: string) => void;
  onShowToast?: (msg: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigateToTab, onShowToast }) => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [tAlertsData, aptsData] = await Promise.all([
        getTriageAlerts().catch(() => null),
        getAppointments().catch(() => null),
      ]);

      if (tAlertsData && Array.isArray(tAlertsData)) {
        setAlerts(tAlertsData);
      } else {
        setAlerts([
          { id: '1', location: 'Bed 12 - Cardiac Unit', patientName: 'John Doe', timeAgo: '10m ago', message: 'Abnormal vital signs detected (HR 130, SpO2 88%). High priority review required.', severity: 'CRITICAL', acknowledged: false },
          { id: '2', location: 'Ward B - Waiting Room', patientName: 'Jane Smith', timeAgo: '25m ago', message: 'Patient waiting time exceeded 45 mins. Escalation suggested.', severity: 'URGENT', acknowledged: false },
          { id: '3', location: 'Emergency Bay 4', patientName: 'Robert Brown', timeAgo: '42m ago', message: 'Oxygen desaturation flagged on telemetry monitor (SpO2 91%).', severity: 'CRITICAL', acknowledged: true },
        ]);
      }

      if (aptsData && Array.isArray(aptsData)) {
        setAppointments(aptsData);
      } else {
        setAppointments([
          { id: 'a1', time: '09:00 AM', patientName: 'John Doe', reason: 'Follow-up Assessment', triage: 'Standard', status: 'Confirmed' },
          { id: 'a2', time: '10:30 AM', patientName: 'Jane Smith', reason: 'Acute Pain Review', triage: 'Urgent', status: 'Confirmed' },
          { id: 'a3', time: '11:15 AM', patientName: 'Robert Brown', reason: 'Post Op Check', triage: 'Critical', status: 'Scheduled' },
          { id: 'a4', time: '01:00 PM', patientName: 'Emily Davis', reason: 'Routine Checkup', triage: 'Standard', status: 'Confirmed' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true, status: 'ACKNOWLEDGED' } : a))
    );
    try {
      await acknowledgeTriageAlert(id);
      onShowToast?.('Triage alert acknowledged & logged in audit record.');
    } catch {}
  };

  const activeAlertsCount = alerts.filter((a) => !a.acknowledged && a.status !== 'ACKNOWLEDGED').length;

  if (loading) return <CardSkeleton height="h-64" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dr. Sarah Jenkins</h1>
          <p className="text-xs text-slate-500 font-semibold">Staff Home Dashboard · Clinical Operations Overview</p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Clinical Queue Active
        </span>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Patients Today</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">42</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">8 admissions in 24h</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#003087] flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">8</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">3 high-priority reviews</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Occupancy</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">87%</p>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">CCU Ward near capacity</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Today's Appointments & Triage Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Today's Scheduled Appointments</h2>
              <p className="text-[11px] text-slate-500">Live clinical consultations queue</p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('Schedules')}
              className="text-xs font-bold text-[#003087] hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Patient Name</th>
                  <th className="pb-2">Clinical Reason</th>
                  <th className="pb-2">Triage Level</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {appointments.slice(0, 6).map((apt, idx) => (
                  <tr key={apt.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 text-slate-500 font-mono text-[11px]">{apt.time || '09:00 AM'}</td>
                    <td className="py-3 font-bold text-slate-900">{apt.patientName || apt.patient?.name || 'John Doe'}</td>
                    <td className="py-3 text-slate-600">{apt.reason}</td>
                    <td className="py-3">
                      <SeverityBadge severity={apt.triage || apt.triageLevel || 'Standard'} size="sm" />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={apt.status || 'Confirmed'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Triage Alerts (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-sm text-slate-900">Live Triage Alerts</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-full">
              {activeAlertsCount} Active
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {alerts.map((alert) => {
              const isAck = alert.acknowledged || alert.status === 'ACKNOWLEDGED';
              const isCrit = String(alert.severity).toUpperCase().includes('CRITICAL');

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border-l-4 transition-all ${
                    isCrit
                      ? 'border-l-rose-600 bg-rose-50/40 border-rose-200'
                      : 'border-l-amber-500 bg-amber-50/40 border-amber-200'
                  } border text-xs space-y-1.5`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <SeverityBadge severity={alert.severity || (isCrit ? 'CRITICAL' : 'URGENT')} size="sm" />
                      <span className="truncate max-w-[120px]">{alert.location || alert.patientName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{alert.timeAgo || 'Just now'}</span>
                  </div>

                  <p className="text-slate-700 leading-snug font-medium">{alert.message}</p>

                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onNavigateToTab?.('Clinical Review')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Review
                    </button>

                    {isAck ? (
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Ack
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1 bg-[#003087] hover:bg-[#002060] text-white rounded-lg text-[11px] font-bold shadow-2xs"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: AI Risk Indicators & Recent Patient Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Risk Indicators */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="font-bold text-sm text-slate-900">AI Risk Indicators & Escalations</h2>
          <p className="text-xs text-slate-500">Pending clinical reviews flagged by LightGBM risk models.</p>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Patient #9042 — High Readmission Risk</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Moderate Risk</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              History of acute coronary syndrome + elevated troponin level (142 ng/L). Recommendation: Cardiology team consult before discharge.
            </p>
          </div>
        </div>

        {/* Recent Patient Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h2 className="font-bold text-sm text-slate-900">Recent Patient Activity & Audit Log</h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#003087] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900">Medication Administered</h4>
                <p className="text-slate-500">Patient #1122 · IV Fluids 500ml 0.9% Saline started.</p>
                <span className="text-[10px] text-slate-400 font-semibold">12 min ago · Nurse Ward B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
