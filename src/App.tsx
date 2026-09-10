import { useState, useEffect } from 'react';
import { UserRole } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { AskAssistantWidget } from './components/AskAssistantWidget';
import { ToastContainer } from './components/Toast';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NewAdmissionModal } from './components/NewAdmissionModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';

import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PatientsPage } from './pages/PatientsPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ClinicalReviewPage } from './pages/ClinicalReviewPage';
import { WardBedMapPage } from './pages/WardBedMapPage';
import { TeamMessagingPage } from './pages/TeamMessagingPage';
import { OperationsAnalyticsPage } from './pages/OperationsAnalyticsPage';
import { SafetyCompliancePage } from './pages/SafetyCompliancePage';
import { FacilitiesServicesPage } from './pages/FacilitiesServicesPage';
import { SupportGuidelinesPage } from './pages/SupportGuidelinesPage';

export default function App() {
  const [role, setRole] = useState<UserRole>('Patient');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [sidebarTab, setSidebarTab] = useState('Home Dashboard');

  // Modal States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateToNav = (nav: string) => {
    setActiveNav(nav);
    setSidebarTab('Home Dashboard');
  };

  const handleNavigateToTab = (tab: string) => {
    setActiveNav('Dashboard');
    setSidebarTab(tab);
  };

  const renderContent = () => {
    // 1. Check Facilities & Support pages (Accessible to all roles)
    if (sidebarTab === 'Hospital Facilities & Services' || activeNav === 'Hospital Facilities & Services') {
      return <FacilitiesServicesPage currentRole={role} />;
    }
    if (sidebarTab === 'Support & Guidelines' || activeNav === 'Support & Guidelines') {
      return (
        <SupportGuidelinesPage
          currentRole={role}
          onNavigateToNav={handleNavigateToNav}
          onNavigateToTab={handleNavigateToTab}
        />
      );
    }

    // 2. Check Header Top Navigation Tabs
    if (activeNav === 'Patients') {
      return <PatientsPage currentRole={role} />;
    }
    if (activeNav === 'Schedules') {
      return <SchedulesPage currentRole={role} />;
    }
    if (activeNav === 'Resources') {
      return <ResourcesPage currentRole={role} />;
    }

    // 3. Check Sidebar Items (for Doctor & Admin or explicit sidebar clicks)
    if (sidebarTab === 'Patients') {
      return <PatientsPage currentRole={role} />;
    }
    if (sidebarTab === 'Schedules') {
      return <SchedulesPage currentRole={role} />;
    }
    if (sidebarTab === 'Resources') {
      return <ResourcesPage currentRole={role} />;
    }
    if (sidebarTab === 'Clinical Review') {
      return <ClinicalReviewPage currentRole={role} />;
    }
    if (sidebarTab === 'Ward Bed Map') {
      return <WardBedMapPage currentRole={role} />;
    }
    if (sidebarTab === 'Team Messaging') {
      return <TeamMessagingPage currentRole={role} />;
    }
    if (sidebarTab === 'Operations Analytics') {
      return <OperationsAnalyticsPage currentRole={role} />;
    }
    if (sidebarTab === 'Safety & Compliance') {
      return <SafetyCompliancePage currentRole={role} />;
    }

    // 4. Default Role-specific Home Dashboard
    switch (role) {
      case 'Patient':
        return <PatientDashboard />;
      case 'Doctor':
        return <DoctorDashboard />;
      case 'Admin':
        return <AdminDashboard />;
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6FA] text-[#0B1F3A] font-sans">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Top Header */}
      <Header
        currentRole={role}
        setRole={(r) => {
          setRole(r);
          setActiveNav('Dashboard');
          setSidebarTab('Home Dashboard');
        }}
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'Dashboard') {
            setSidebarTab('Home Dashboard');
          }
        }}
        onOpenFacilities={() => {
          setActiveNav('Dashboard');
          setSidebarTab('Hospital Facilities & Services');
        }}
        onOpenSupport={() => {
          setActiveNav('Dashboard');
          setSidebarTab('Support & Guidelines');
        }}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={() => {
          setRole('Patient');
          setActiveNav('Dashboard');
          setSidebarTab('Home Dashboard');
        }}
      />

      {/* Main Layout Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Visible for Doctor & Admin, or on mobile toggle) */}
        {role !== 'Patient' && (
          <Sidebar
            activeTab={sidebarTab}
            setActiveTab={(tab) => {
              if (tab === 'Sign Out') {
                setRole('Patient');
                setActiveNav('Dashboard');
                setSidebarTab('Home Dashboard');
              } else {
                setSidebarTab(tab);
                setActiveNav('Dashboard');
              }
            }}
            onNewAdmission={() => setShowAdmissionModal(true)}
          />
        )}

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F3F6FA]">
          {renderContent()}
        </main>
      </div>

      {/* Floating Ask Assistant Pill Widget */}
      <AskAssistantWidget role={role.toLowerCase()} />

      {/* NHS Footer */}
      <Footer />

      {/* Global Application Overlay Modals */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        currentRole={role}
      />

      <NewAdmissionModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
        onAdmissionCreated={() => {
          setShowAdmissionModal(false);
        }}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentRole={role}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentRole={role}
      />
    </div>
  );
}
