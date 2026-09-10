import React, { useState, useEffect } from 'react';
import { Calendar, Stethoscope, Bot, Info, Clock, MapPin, FileText, Activity, Heart, Thermometer, ShieldCheck } from 'lucide-react';
import { BookAppointmentModal } from '../components/BookAppointmentModal';
import { SymptomTriageModal } from '../components/SymptomTriageModal';
import { getAppointments } from '../services/api';
import { SeverityBadge } from '../components/CommonUI';

export const PatientDashboard: React.FC = () => {
  const [showBookModal, setShowBookModal] = useState(false);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [nextApt, setNextApt] = useState<any>(null);

  const loadNextAppointment = async () => {
    try {
      const apts = await getAppointments('patient1');
      if (apts && apts.length > 0) {
        setNextApt(apts[0]);
      }
    } catch (err) {
      console.warn('Failed to load patient appointments:', err);
    }
  };

  useEffect(() => {
    loadNextAppointment();
    const handleRefresh = () => loadNextAppointment();
    window.addEventListener('refresh-patient-dashboard', handleRefresh);
    return () => window.removeEventListener('refresh-patient-dashboard', handleRefresh);
  }, []);

  return (
    <div className="max-w-[1220px] mx-auto space-y-5 px-2 sm:px-4">
      {/* ROW 1: Greeting & AI Notice side-by-side */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A] tracking-tight">Good morning, John</h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">Here is an overview of your care.</p>
        </div>

        {/* AI Notice (Right-aligned compact clinical box) */}
        <div className="bg-[#EEF6FF] border border-[#C6DFFF] rounded-[14px] p-3 max-w-md flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-[#005EB8] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#0B1F3A] leading-snug font-medium">
            <strong className="font-bold text-[#005EB8]">AI Notice:</strong> Our AI helps guide decision support, but is not a diagnosis. Always consult a healthcare professional for medical advice.
          </p>
        </div>
      </div>

      {/* ROW 2: Primary Row (~68% Next Appointment / ~32% Recent Updates) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Next Appointment Card (lg:col-span-8 = ~67%) */}
        <div className="lg:col-span-8 bg-white rounded-[18px] border border-[#DFE8F2] p-5 shadow-[0_5px_18px_rgba(15,50,90,0.055)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-[11px] uppercase tracking-wider text-[#64748B] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#005EB8]" /> Next Appointment
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] text-[11px] font-extrabold rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
              {nextApt?.status || 'CONFIRMED'}
            </span>
          </div>

          {/* Inner Panel */}
          <div className="bg-[#F5F9FD] rounded-[14px] border border-[#E4ECF4] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#005EB8] text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-[#0B1F3A] text-base">{nextApt?.reason || 'Follow-up Assessment'}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#64748B] pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#005EB8]" />
                  {nextApt?.date || 'Today'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#005EB8]" />
                  {nextApt?.time || '09:00 AM'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#005EB8]" />
                  {nextApt?.room || 'Room 3, North Wing'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-0.5">
            <button
              onClick={() => setShowBookModal(true)}
              className="px-4 py-2 bg-[#005EB8] hover:bg-[#004B93] text-white font-extrabold text-xs rounded-[10px] shadow-xs transition-all cursor-pointer"
            >
              Reschedule
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#005EB8] border border-[#C8D8E8] font-bold text-xs rounded-[10px] transition-colors cursor-pointer"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>

          {showDetails && (
            <div className="p-3 bg-[#F5F9FD] rounded-[14px] border border-[#E4ECF4] text-xs text-[#0B1F3A] space-y-1">
              <p><strong>Attending Clinician:</strong> {nextApt?.doctorName || 'Dr. Sarah Jenkins'} (Consultant Cardiologist)</p>
              <p><strong>Clinical Prep:</strong> Fast for 2 hours prior to the assessment.</p>
              <p className="font-mono text-[11px] text-[#64748B]">EPR Reference: {nextApt?.id || 'APT-904218'}</p>
            </div>
          )}
        </div>

        {/* Recent Updates Card (lg:col-span-4 = ~33%) */}
        <div className="lg:col-span-4 bg-white rounded-[18px] border border-[#DFE8F2] p-5 shadow-[0_5px_18px_rgba(15,50,90,0.055)] flex flex-col justify-between space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-[11px] uppercase tracking-wider text-[#64748B]">Recent Updates</h2>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            {/* Item 1 */}
            <div className="pt-0.5">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#005EB8] mt-1 flex-shrink-0"></span>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#0B1F3A] text-xs">Your test results are ready</h4>
                  <p className="text-[#64748B] text-[11px] leading-snug">Blood panel from 12 Oct is now available to view.</p>
                  <span className="text-[10px] text-slate-400 font-mono block">2 hours ago</span>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="pt-3">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 mt-1 flex-shrink-0"></span>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#0B1F3A] text-xs">Prescription ready for collection</h4>
                  <p className="text-[#64748B] text-[11px] leading-snug">Lisinopril 10mg is ready at Pharmacy Direct.</p>
                  <span className="text-[10px] text-slate-400 font-mono block">Yesterday</span>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="pt-3">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 mt-1 flex-shrink-0"></span>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#0B1F3A] text-xs">Pre-appointment questionnaire</h4>
                  <p className="text-[#64748B] text-[11px] leading-snug">Please complete before your cardiology consult.</p>
                  <span className="text-[10px] text-slate-400 font-mono block">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: Secondary Row (~50% Health Overview / ~50% Triage Status) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Health Overview */}
        <div className="bg-white rounded-[18px] border border-[#DFE8F2] p-5 shadow-[0_5px_18px_rgba(15,50,90,0.055)] space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-extrabold text-xs text-[#0B1F3A] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#005EB8]" /> Health Overview
            </span>
            <span className="text-[10px] font-extrabold text-[#005EB8] bg-[#EEF6FF] border border-[#C6DFFF] px-2 py-0.5 rounded-full uppercase">
              Latest Vitals
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
            <div className="p-3.5 bg-[#F5F9FD] rounded-[14px] border border-[#E4ECF4] h-[75px] flex flex-col justify-center space-y-1">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block">Heart Rate</span>
              <span className="font-bold text-[#0B1F3A] text-lg flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#005EB8]" /> 72 bpm
              </span>
            </div>
            <div className="p-3.5 bg-[#F5F9FD] rounded-[14px] border border-[#E4ECF4] h-[75px] flex flex-col justify-center space-y-1">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block">SpO2</span>
              <span className="font-bold text-[#0B1F3A] text-lg flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-[#005EB8]" /> 98 %
              </span>
            </div>
          </div>
        </div>

        {/* Triage Status */}
        <div className="bg-white rounded-[18px] border border-[#DFE8F2] p-5 shadow-[0_5px_18px_rgba(15,50,90,0.055)] space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-extrabold text-xs text-[#0B1F3A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#005EB8]" /> Triage Status
            </span>
            <span className="bg-[#EEF6FF] text-[#005EB8] border border-[#C6DFFF] font-extrabold text-[11px] px-3 py-0.5 rounded-full">
              STANDARD
            </span>
          </div>
          <div className="p-3.5 bg-[#F5F9FD] rounded-[14px] border border-[#E4ECF4] space-y-1">
            <p className="font-bold text-[#0B1F3A] text-sm">Routine Assessment</p>
            <p className="text-xs text-slate-500 font-medium">No urgent symptoms detected in recent check.</p>
          </div>
        </div>
      </div>

      {/* ROW 4: Quick Actions Cards (3 Equal-width 33% Interactive Cards) */}
      <div className="space-y-2.5">
        <h2 className="font-extrabold text-[11px] uppercase tracking-wider text-[#64748B]">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* Action 1: Book Appointment */}
          <button
            onClick={() => setShowBookModal(true)}
            className="bg-white rounded-[18px] border border-[#DCE8F4] p-4 h-[110px] flex flex-col items-center justify-center gap-2 hover:border-[#005EB8] hover:shadow-md hover:-translate-y-0.5 transition-all group text-center cursor-pointer shadow-[0_5px_16px_rgba(15,60,100,0.045)]"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#EDF5FF] text-[#005EB8] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-[#0B1F3A]">Book Appointment</span>
          </button>

          {/* Action 2: Start Symptom Triage */}
          <button
            onClick={() => setShowTriageModal(true)}
            className="bg-white rounded-[18px] border border-[#DCE8F4] p-4 h-[110px] flex flex-col items-center justify-center gap-2 hover:border-sky-500 hover:shadow-md hover:-translate-y-0.5 transition-all group text-center cursor-pointer shadow-[0_5px_16px_rgba(15,60,100,0.045)]"
          >
            <div className="w-10 h-10 rounded-[12px] bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-[#0B1F3A]">Start Symptom Triage</span>
          </button>

          {/* Action 3: Ask Assistant */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-ask-assistant'));
            }}
            className="bg-white rounded-[18px] border border-[#DCE8F4] p-4 h-[110px] flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all group text-center cursor-pointer shadow-[0_5px_16px_rgba(15,60,100,0.045)]"
          >
            <div className="w-10 h-10 rounded-[12px] bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-[#0B1F3A]">Ask Assistant</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onSuccess={() => loadNextAppointment()}
        />
      )}
      {showTriageModal && <SymptomTriageModal onClose={() => setShowTriageModal(false)} />}
    </div>
  );
};
