import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  ClipboardList,
  BedDouble,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Building2,
  HelpCircle,
  LogOut,
  Plus,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewAdmission?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNewAdmission,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const sections = [
    {
      title: 'MAIN',
      items: [
        { id: 'Home Dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
        { id: 'Patients', label: 'Patients', icon: Users },
        { id: 'Schedules', label: 'Schedules', icon: Calendar },
        { id: 'Resources', label: 'Resources', icon: BookOpen },
      ],
    },
    {
      title: 'CLINICAL',
      items: [
        { id: 'Clinical Review', label: 'Clinical Review', icon: ClipboardList },
        { id: 'Ward Bed Map', label: 'Ward Bed Map', icon: BedDouble },
        { id: 'Team Messaging', label: 'Team Messaging', icon: MessageSquare },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'Operations Analytics', label: 'Operations Analytics', icon: BarChart3 },
        { id: 'Safety & Compliance', label: 'Safety & Compliance', icon: ShieldCheck },
      ],
    },
    {
      title: 'SERVICES',
      items: [
        { id: 'Hospital Facilities & Services', label: 'Hospital Facilities & Services', icon: Building2 },
        { id: 'Support & Guidelines', label: 'Support & Guidelines', icon: HelpCircle },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
      <div className="space-y-5">
        {/* EPR Sub-header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#003087] text-white font-bold flex items-center justify-center text-xs">
              +
            </div>
            <div>
              <p className="text-xs font-bold text-[#003087]">NHS Central Trust</p>
              <p className="text-[10px] text-slate-400 font-semibold">Acute Clinical EPR · RGT01</p>
            </div>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* New Admission Button */}
        <button
          onClick={() => { if (onCloseMobile) onCloseMobile(); onNewAdmission?.(); }}
          className="w-full py-2.5 px-4 bg-[#0072ce] hover:bg-[#005eb8] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          New Admission
        </button>

        {/* Grouped Navigation */}
        <nav className="space-y-4 pt-1">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider px-3 uppercase">
                {sec.title}
              </p>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-[#003087] font-bold shadow-2xs border border-blue-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#003087]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Sign Out */}
      <div className="border-t border-slate-100 pt-3">
        <button
          onClick={() => handleSelect('Sign Out')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Rail */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200/90 min-h-[calc(100vh-57px)] flex-shrink-0">
        {content}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <aside className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};
