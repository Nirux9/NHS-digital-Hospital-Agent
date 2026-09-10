import React from 'react';
import { X, User, Shield, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
  currentRole?: UserRole;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userRole, currentRole }) => {
  if (!isOpen) return null;

  const role = userRole || currentRole || 'Patient';

  const profileData = {
    Doctor: {
      name: 'Dr. Sarah Jenkins',
      email: 'dr.jenkins@nhs.demo',
      phone: '+44 7700 900001',
      role: 'Consultant Doctor',
      department: 'Cardiology & Intensive Care',
      specialty: 'Interventional Cardiology',
      license: 'GMC-7492018',
      hospital: 'NHS Central Region Trust · St. Jude Hospital',
    },
    Admin: {
      name: 'Sarah Jenkins',
      email: 'admin@nhs.demo',
      phone: '+44 7700 900000',
      role: 'Clinical Operations Director',
      department: 'Hospital Administration & Governance',
      specialty: 'EPR Operations & System Audit',
      license: 'NHS-ADM-8821',
      hospital: 'NHS Central Region Trust',
    },
    Patient: {
      name: 'John Doe',
      email: 'patient1@demo.com',
      phone: '+44 7700 900003',
      role: 'Registered Patient',
      department: 'General Medicine',
      specialty: 'Patient Access Portal',
      license: 'NHS-904-218',
      hospital: 'NHS Central Region Trust',
    },
  }[role || 'Patient'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-[#003087] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black">
              {profileData.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{profileData.name}</h3>
              <p className="text-xs text-blue-200">{profileData.role}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                Verified NHS Staff & User
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                <p className="font-semibold text-slate-900">{profileData.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                <p className="font-semibold text-slate-900">{profileData.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">License / NHS ID</p>
                <p className="font-semibold text-slate-900">{profileData.license}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Department & Trust</p>
                <p className="font-semibold text-slate-900">{profileData.department}</p>
                <p className="text-[10px] text-slate-500">{profileData.hospital}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#003087] text-white rounded-xl font-bold hover:bg-[#002060]"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
