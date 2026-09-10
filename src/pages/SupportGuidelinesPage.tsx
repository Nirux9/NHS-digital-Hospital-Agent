import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  HelpCircle,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Info,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  X,
  Loader2,
  RefreshCw,
  Building2,
  Lock,
  UserCheck,
  FileText
} from 'lucide-react';
import {
  getSupportOverview,
  getSupportFAQs,
  getSupportGuidelines,
  getSupportContact,
  getHealthCheck,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  FAQItem,
  SupportOverviewData,
  SupportContactInfo
} from '../services/api';

interface SupportGuidelinesPageProps {
  currentRole: UserRole;
  onNavigateToNav?: (nav: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SupportGuidelinesPage: React.FC<SupportGuidelinesPageProps> = ({
  currentRole,
  onNavigateToNav,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<SupportOverviewData | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [contact, setContact] = useState<SupportContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Health state
  const [healthStatus, setHealthStatus] = useState<{
    connected: boolean;
    checking: boolean;
  }>({ connected: false, checking: true });

  // Admin Modal states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<'create' | 'edit'>('create');
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  // Admin Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Appointments',
    roleAudience: 'PATIENT',
    isPublished: true
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Health check
  const checkHealth = async () => {
    setHealthStatus(prev => ({ ...prev, checking: true }));
    try {
      const health = await getHealthCheck();
      const isConnected = health.success && health.database === 'connected';
      setHealthStatus({ connected: isConnected, checking: false });
    } catch {
      setHealthStatus({ connected: false, checking: false });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // 2. Fetch Support Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const userRole = currentRole.toLowerCase();

    try {
      const [ovData, faqRes, guideData, contactData] = await Promise.all([
        getSupportOverview(),
        getSupportFAQs({ search: searchQuery, category: selectedCategory, role: userRole }),
        getSupportGuidelines(userRole, selectedCategory),
        getSupportContact()
      ]);

      setOverview(ovData);
      setFaqs(faqRes?.faqs || []);
      setGuidelines(guideData || []);
      setContact(contactData);
    } catch (err: any) {
      console.error('Failed to load support content:', err);
      setError('Unable to load Support & Guidelines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedCategory, currentRole]);

  // Admin FAQ Actions
  const openAdminFaqModal = (mode: 'create' | 'edit', item?: FAQItem) => {
    setAdminModalMode(mode);
    setEditingFaq(item || null);
    setFormError(null);

    if (mode === 'edit' && item) {
      setFormData({
        question: item.question || '',
        answer: item.answer || '',
        category: item.category || 'Appointments',
        roleAudience: item.roleAudience || 'PATIENT',
        isPublished: item.isPublished !== false
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'Appointments',
        roleAudience: 'PATIENT',
        isPublished: true
      });
    }
    setShowAdminModal(true);
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!formData.question.trim() || !formData.answer.trim()) {
      setFormError('Question and answer are required.');
      setFormSubmitting(false);
      return;
    }

    try {
      if (adminModalMode === 'create') {
        await createFAQ(formData, 'admin');
      } else if (editingFaq) {
        await updateFAQ(editingFaq.id, formData, 'admin');
      }
      setShowAdminModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Action failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ item?')) return;
    try {
      await deleteFAQ(id, 'admin');
      fetchData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Helper navigation handlers
  const handleGoToSchedules = () => {
    if (onNavigateToNav) onNavigateToNav('Schedules');
  };

  const handleGoToResources = () => {
    if (onNavigateToNav) onNavigateToNav('Resources');
  };

  const handleGoToFacilities = () => {
    if (onNavigateToTab) onNavigateToTab('Hospital Facilities & Services');
  };

  const handleGoToClinicalReview = () => {
    if (onNavigateToTab) onNavigateToTab('Clinical Review');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Support & Guidelines
            </h1>
            {currentRole.toLowerCase() === 'admin' && (
              <span className="px-2.5 py-0.5 bg-blue-100 text-[#003087] text-xs font-bold rounded-md uppercase">
                Admin Manager
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Central Knowledge Base, FAQs, Application Help & Clinical Protocol Guidance
          </p>
        </div>

        {/* Dynamic Backend Health Indicator (Requirement 18) */}
        <div className="flex items-center gap-3">
          {healthStatus.checking ? (
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Health...
            </span>
          ) : healthStatus.connected ? (
            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
              <Activity className="w-3.5 h-3.5" /> Live Backend Connected
            </span>
          ) : (
            <button
              onClick={checkHealth}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Backend Disconnected • Retry
            </button>
          )}

          {currentRole.toLowerCase() === 'admin' && (
            <button
              onClick={() => openAdminFaqModal('create')}
              className="px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          )}
        </div>
      </div>

      {/* Hero Search Section (Requirement 4 & 15) */}
      <div className="bg-gradient-to-r from-[#003087] to-[#002060] rounded-3xl p-8 text-white shadow-lg space-y-5 relative overflow-hidden">
        <div className="max-w-2xl space-y-2 relative z-10">
          <h2 className="text-2xl font-bold tracking-tight">How can we help you today?</h2>
          <p className="text-xs text-blue-100 leading-relaxed font-normal">
            Search our backend FAQs, system usage guides, emergency recommendations, and clinical protocols for NHS patients and medical staff.
          </p>
        </div>

        {/* Global Support Search Bar */}
        <div className="relative max-w-xl z-10">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs, guidelines, appointments, triage, security..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 rounded-2xl text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Support Categories Pills (Requirement 5) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
          <Filter className="w-4 h-4 text-[#003087]" /> Filter Knowledge Base by Topic:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Topics
          </button>
          {[
            'Appointments',
            'Triage & Symptoms',
            'Using the Portal',
            'Prescriptions & Results',
            'Hospital Services',
            'Account & Security',
            'Emergency Guidance',
            'Clinical Workflows'
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-[#003087] text-white font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Guidance Alert (Requirement 9) */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6 flex items-start gap-4 shadow-xs">
        <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-red-950 text-sm">Emergency Medical Notice</h3>
          <p className="text-red-900 leading-relaxed font-normal">
            For acute, severe, or life-threatening symptoms (chest pain, shortness of breath, facial drooping, sudden loss of consciousness), <strong>seek immediate emergency care</strong>. Call <strong>999</strong> immediately or attend the nearest <strong>NHS Emergency Department (A&E)</strong>. For non-emergency health advice, call <strong>NHS 111</strong>.
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid (Requirements 10 & 17) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleGoToSchedules}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-[#003087] hover:shadow-md transition-all text-left space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#003087] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-xs">Book or Manage Appointment</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Schedule specialist consultations, reschedule, or cancel existing appointments.
          </p>
        </button>

        <button
          onClick={handleGoToFacilities}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-[#003087] hover:shadow-md transition-all text-left space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-xs">Hospital Facilities & Services</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Find ward locations, pharmacy hours, lab services, and accessibility information.
          </p>
        </button>

        <button
          onClick={handleGoToResources}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-[#003087] hover:shadow-md transition-all text-left space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 text-xs">Clinical Resources & PDFs</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Browse published medical articles, clinical guidelines, and educational PDFs.
          </p>
        </button>

        {currentRole !== 'Patient' ? (
          <button
            onClick={handleGoToClinicalReview}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-[#003087] hover:shadow-md transition-all text-left space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 text-xs">Acute Clinical Review</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Review patient EPR files, LightGBM triage outputs, and lab result logs.
            </p>
          </button>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs text-left space-y-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 text-xs">Ask AI Assistant</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Use the floating widget to ask questions or instruct direct appointment booking.
            </p>
          </div>
        )}
      </div>

      {/* Main FAQ & Guidelines Section */}
      {loading ? (
        /* Loading Skeleton (Requirement 19) */
        <div className="space-y-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
              <div className="h-3 bg-gray-100 rounded-md w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State (Requirement 21) */
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-base">{error}</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Unable to communicate with the Express API server. Please check your backend connection.
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Action
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Accordion Column (2/3 width) (Requirement 6) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#003087]" /> Frequently Asked Questions ({faqs.length})
              </h3>
              <span className="text-xs text-gray-400 font-medium">
                Audience: <strong className="text-gray-700 uppercase">{currentRole}</strong>
              </span>
            </div>

            {faqs.length === 0 ? (
              /* Empty State (Requirement 20) */
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
                <Info className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="font-bold text-gray-800 text-sm">No support content is currently available.</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  No FAQs match your search query "{searchQuery}" or selected topic "{selectedCategory}".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        className="w-full p-5 text-left flex items-start justify-between gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-[#003087] font-semibold text-[10px] rounded-md uppercase">
                              {faq.category}
                            </span>
                            {faq.roleAudience !== 'ALL' && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-semibold text-[10px] rounded-md">
                                {faq.roleAudience}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                            {faq.question}
                          </h4>
                        </div>
                        <div className="p-1 rounded-full text-gray-400 shrink-0 mt-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-gray-100 text-xs text-gray-700 leading-relaxed bg-gray-50/30 space-y-3 animate-in fade-in duration-150">
                          <p className="whitespace-pre-line">{faq.answer}</p>

                          {currentRole.toLowerCase() === 'admin' && (
                            <div className="pt-2 flex items-center gap-2 justify-end border-t border-gray-200/50">
                              <button
                                onClick={() => openAdminFaqModal('edit', faq)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" /> Edit FAQ
                              </button>
                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Guidelines, AI Info & Technical Support (1/3 width) */}
          <div className="space-y-6">
            {/* Approved Guidelines Card (Requirement 8) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#003087]" /> Clinical Guidelines & Help Guides
              </h3>
              <div className="space-y-3 text-xs">
                {guidelines.slice(0, 4).map((g) => (
                  <div key={g.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
                        {g.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{g.resourceType}</span>
                    </div>
                    <h5 className="font-bold text-gray-900 leading-snug">{g.title}</h5>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{g.description}</p>
                    {g.url && (
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#003087] font-bold text-[11px] hover:underline inline-flex items-center gap-1 pt-1"
                      >
                        Open Official Guide <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Synthetic Triage Data Disclosure Card (Requirement 11 & 24) */}
            <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-5 space-y-2.5 text-xs text-blue-950 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <ShieldCheck className="w-4 h-4 text-[#003087]" /> AI Decision Support Disclosure
              </div>
              <p className="text-[11px] text-blue-900 leading-relaxed font-normal">
                The embedded emergency severity triage predictor uses a machine learning model trained on synthetic data for educational demonstration.
              </p>
              <div className="bg-white/80 p-3 rounded-xl border border-blue-200/60 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Training Dataset:</span>
                  <span className="font-bold text-gray-900 font-mono">synthetic_triage_data_250k.csv</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purpose:</span>
                  <span className="font-semibold text-gray-800">Development / Demo Only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Clinical Validation:</span>
                  <span className="font-semibold text-rose-700">Not Clinically Validated</span>
                </div>
              </div>
            </div>

            {/* Technical Support Contact (Requirement 14) */}
            {contact && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3 text-xs">
                <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#003087]" /> Technical Support
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Experiencing issues with your clinical portal account or data synchronization?
                </p>
                <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-800">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-semibold">{contact.supportEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-semibold">{contact.supportPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{contact.operatingHours}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin FAQ Modal (Requirement 22 & 23) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {adminModalMode === 'create' ? 'Add New Knowledge Base FAQ' : 'Edit FAQ Record'}
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAdminFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">FAQ Question *</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. How do I request a prescription refill?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    <option value="Appointments">Appointments</option>
                    <option value="Triage & Symptoms">Triage & Symptoms</option>
                    <option value="Using the Portal">Using the Portal</option>
                    <option value="Prescriptions & Results">Prescriptions & Results</option>
                    <option value="Hospital Services">Hospital Services</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="Clinical Workflows">Clinical Workflows</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Role Audience *</label>
                  <select
                    value={formData.roleAudience}
                    onChange={(e) => setFormData({ ...formData, roleAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    <option value="PATIENT">PATIENT (All users)</option>
                    <option value="DOCTOR">DOCTOR (Clinicians & Staff)</option>
                    <option value="ADMIN">ADMIN (Administrators only)</option>
                    <option value="ALL">ALL ROLES</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Answer / Guidance *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide step-by-step guidance..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003087]/20"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-[#003087] rounded border-gray-300 focus:ring-[#003087]"
                />
                <label htmlFor="isPublished" className="font-semibold text-gray-700 cursor-pointer">
                  Publish FAQ Item Immediately to Knowledge Base
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {adminModalMode === 'create' ? 'Create FAQ Item' : 'Update FAQ Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
