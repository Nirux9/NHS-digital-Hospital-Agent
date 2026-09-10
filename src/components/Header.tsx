import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { Search, Bell, HelpCircle, Settings, ExternalLink, Grid, User, LogOut, Check, ChevronDown } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

interface HeaderProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenFacilities?: () => void;
  onOpenSupport?: () => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setRole,
  activeNav,
  setActiveNav,
  onOpenFacilities,
  onOpenSupport,
  onOpenSearch,
  onOpenSettings,
  onOpenProfile,
  onLogout,
}) => {
  const roles: UserRole[] = ['Doctor', 'Admin', 'Patient'];
  const navItems = ['Dashboard', 'Patients', 'Schedules', 'Resources'];

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch real notifications from backend
  useEffect(() => {
    let isMounted = true;
    getNotifications(currentRole.toLowerCase())
      .then((data) => {
        if (isMounted && data) {
          const list = Array.isArray(data) ? data : (data.notifications || data.data || []);
          setNotifications(list);
          const unread = list.filter((n: any) => !n.isRead && !n.read).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {
        // Fallback default notification
        if (isMounted) {
          setNotifications([
            { id: '1', title: 'Critical Triage Alert', message: 'High priority review required for Bed 12', time: '10 min ago', isRead: false },
            { id: '2', title: 'Appointment Confirmed', message: 'Follow-up Assessment today at 10:30 AM', time: '1 hour ago', isRead: false },
            { id: '3', title: 'New Team Message', message: 'Dr. Sarah Jenkins sent a message', time: '2 hours ago', isRead: true },
          ]);
          setUnreadCount(2);
        }
      });

    return () => { isMounted = false; };
  }, [currentRole]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getUserTitle = () => {
    if (currentRole === 'Doctor') return { name: 'Dr. Sarah Jenkins', role: 'Consultant Cardiologist', dept: 'Cardiology' };
    if (currentRole === 'Admin') return { name: 'Sarah Jenkins', role: 'Clinical Operations Director', dept: 'Administration' };
    return { name: 'John Doe', role: 'NHS Patient', dept: 'General Medicine' };
  };

  const user = getUserTitle();

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs">
      {/* Left: NHS Logo & Tag */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#003087] flex items-center justify-center text-white font-black text-sm shadow-xs">
            +
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#003087] text-white text-[11px] font-black px-1.5 py-0.5 rounded-sm">NHS</span>
              <span className="font-bold text-[#003087] text-sm tracking-tight">Digital Hospital Agent</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">NHS Central Region Trust · Acute Clinical EPR</p>
          </div>
        </div>

        {/* AI Core badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] text-emerald-800 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          NHS AI Core v2.4
        </div>

        {/* Facilities & Services button */}
        <button
          onClick={onOpenFacilities}
          className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 transition-colors"
        >
          <Grid className="w-3.5 h-3.5 text-slate-500" />
          Facilities & Services
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActiveNav(item)}
            className={`py-1.5 text-xs font-bold transition-all relative cursor-pointer ${
              activeNav === item
                ? 'text-[#005EB8] border-b-2 border-[#005EB8]'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right Controls: Search, Role Selector & Notifications/Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#EAF4FF] border border-[#DCE6F0] rounded-xl text-xs text-slate-500 font-medium transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search patients, appointments...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-[#DCE6F0] rounded-md">⌘K</kbd>
        </button>

        {/* Role Selector Pills */}
        <div className="bg-[#EAF4FF]/80 p-0.5 rounded-full flex items-center gap-0.5 text-xs font-semibold border border-[#DCE6F0]">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                currentRole === r
                  ? 'bg-[#005EB8] text-white shadow-xs font-extrabold'
                  : 'text-[#0B1F3A] hover:text-[#005EB8]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#003087]" />
                    <span className="font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-[#003087] hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 font-medium">No notifications</div>
                  ) : (
                    notifications.map((n) => {
                      const isRead = n.isRead || n.read;
                      return (
                        <div
                          key={n.id}
                          onClick={() => !isRead && handleMarkRead(n.id)}
                          className={`p-3 transition-colors flex items-start gap-2.5 cursor-pointer ${
                            isRead ? 'bg-white opacity-80' : 'bg-blue-50/40 hover:bg-blue-50/70'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              isRead ? 'bg-slate-300' : 'bg-[#003087]'
                            }`}
                          ></span>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <h5 className="font-bold text-slate-900">{n.title || n.type}</h5>
                              <span className="text-[10px] text-slate-400 font-medium">{n.time || 'Today'}</span>
                            </div>
                            <p className="text-slate-600 leading-snug">{n.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenSupport}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-0.5 hover:bg-slate-100 rounded-full transition-colors border border-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                {currentRole === 'Patient' ? 'JD' : 'SJ'}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 pr-0.5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-[#003087] font-semibold">{user.role}</p>
                  <p className="text-[10px] text-slate-400">{user.dept}</p>
                </div>

                <button
                  onClick={() => { setShowProfileMenu(false); onOpenProfile?.(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  My Profile
                </button>
                <button
                  onClick={() => { setShowProfileMenu(false); onOpenSettings?.(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  System Settings
                </button>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); onLogout?.(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
