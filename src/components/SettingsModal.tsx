import React, { useState } from 'react';
import { X, Settings, Bell, Shield, Database, Moon, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToast?: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaveToast }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [criticalSound, setCriticalSound] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [highDensityMode, setHighDensityMode] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveToast?.('System preferences updated successfully.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-[#003087] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">System & EPR Preferences</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#003087]" />
                <div>
                  <p className="font-bold text-slate-900">Real-Time Clinical Alerts</p>
                  <p className="text-[10px] text-slate-500">Receive popup notifications for high-priority triage alerts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 text-[#003087] rounded focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="font-bold text-slate-900">Critical Escalation Sound</p>
                  <p className="text-[10px] text-slate-500">Audible chime on Level 1 CRITICAL triage detections</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={criticalSound}
                onChange={(e) => setCriticalSound(e.target.checked)}
                className="w-4 h-4 text-[#003087] rounded focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-[#003087]" />
                <div>
                  <p className="font-bold text-slate-900">Auto Live Sync (15s)</p>
                  <p className="text-[10px] text-slate-500">Automatically poll backend PostgreSQL for live bed map & queue updates</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-[#003087] rounded focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-[#003087]" />
                <div>
                  <p className="font-bold text-slate-900">High-Density Clinical UI</p>
                  <p className="text-[10px] text-slate-500">Compact layout mode matching reference healthcare dashboard</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={highDensityMode}
                onChange={(e) => setHighDensityMode(e.target.checked)}
                className="w-4 h-4 text-[#003087] rounded focus:ring-0"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#003087] text-white rounded-xl font-bold hover:bg-[#002060] flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
