import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import {
  Building2,
  Search,
  Filter,
  Activity,
  Clock,
  MapPin,
  Phone,
  Mail,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  ExternalLink,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Stethoscope
} from 'lucide-react';
import {
  getFacilities,
  getServices,
  getHealthCheck,
  createFacility,
  updateFacility,
  updateFacilityStatus,
  createService,
  updateService,
  updateServiceStatus,
  Facility,
  ServiceItem
} from '../services/api';

interface FacilitiesServicesPageProps {
  currentRole: UserRole;
}

type TabType = 'facilities' | 'services' | 'all';

export const FacilitiesServicesPage: React.FC<FacilitiesServicesPageProps> = ({ currentRole }) => {
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Data state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Health check state
  const [healthStatus, setHealthStatus] = useState<{
    connected: boolean;
    checking: boolean;
    errorText?: string;
  }>({ connected: false, checking: true });

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedDetail, setSelectedDetail] = useState<{
    type: 'facility' | 'service';
    data: Facility | ServiceItem;
  } | null>(null);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<'create' | 'edit'>('create');
  const [adminTargetType, setAdminTargetType] = useState<'facility' | 'service'>('facility');
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Admin Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Emergency',
    type: 'Acute Care',
    description: '',
    location: '',
    floor: 'Ground Floor',
    contactPhone: '',
    email: '',
    openingHours: 'Open 24 hours',
    status: 'OPEN',
    accessibilityInfo: '',
    isStaffOnly: false,
    facilityId: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Verify Backend Health Check (Requirement 16)
  const checkHealth = async () => {
    setHealthStatus(prev => ({ ...prev, checking: true }));
    try {
      const health = await getHealthCheck();
      const isConnected = health.success && health.database === 'connected';
      setHealthStatus({
        connected: isConnected,
        checking: false,
        errorText: isConnected ? undefined : 'PostgreSQL Database Disconnected'
      });
    } catch (err: any) {
      setHealthStatus({
        connected: false,
        checking: false,
        errorText: 'API Server Unreachable'
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // 2. Fetch Facilities & Services Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const userRole = currentRole.toLowerCase();

    try {
      if (activeTab === 'facilities') {
        const res = await getFacilities({
          search: searchQuery,
          category: selectedCategory,
          role: userRole,
          page,
          limit: 12
        });
        if (res) {
          setFacilities(res.facilities || []);
          setCategories(res.categories || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalCount(res.pagination?.total || 0);
        }
      } else if (activeTab === 'services') {
        const res = await getServices({
          search: searchQuery,
          category: selectedCategory,
          role: userRole,
          page,
          limit: 12
        });
        if (res) {
          setServices(res.services || []);
          setCategories(res.categories || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalCount(res.pagination?.total || 0);
        }
      } else {
        // Combined tab
        const [facRes, servRes] = await Promise.all([
          getFacilities({ search: searchQuery, category: selectedCategory, role: userRole, page: 1, limit: 10 }),
          getServices({ search: searchQuery, category: selectedCategory, role: userRole, page: 1, limit: 10 })
        ]);

        const combinedFacs = facRes?.facilities || [];
        const combinedServs = servRes?.services || [];
        setFacilities(combinedFacs);
        setServices(combinedServs);

        const allCatSet = new Set<string>([
          ...(facRes?.categories || []),
          ...(servRes?.categories || [])
        ]);
        setCategories(Array.from(allCatSet));
        setTotalPages(1);
        setTotalCount(combinedFacs.length + combinedServs.length);
      }
    } catch (err: any) {
      console.error('Failed to load facilities/services:', err);
      setError('Unable to load hospital facilities and services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery, selectedCategory, page, currentRole]);

  // Handle Admin Status Toggle
  const handleToggleStatus = async (item: Facility | ServiceItem, type: 'facility' | 'service') => {
    if (currentRole.toLowerCase() !== 'admin') return;

    const nextStatusMap: Record<string, string> = {
      'OPEN': 'CLOSED',
      'CLOSED': 'OPEN',
      'APPOINTMENT_ONLY': 'OPEN',
      'TEMPORARILY_UNAVAILABLE': 'OPEN'
    };
    const nextStatus = nextStatusMap[item.status] || 'OPEN';

    try {
      if (type === 'facility') {
        await updateFacilityStatus(item.id, nextStatus, 'admin');
      } else {
        await updateServiceStatus(item.id, nextStatus, 'admin');
      }
      fetchData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Open Admin Create/Edit Modal
  const openAdminForm = (mode: 'create' | 'edit', targetType: 'facility' | 'service', item?: any) => {
    setAdminModalMode(mode);
    setAdminTargetType(targetType);
    setEditingItem(item || null);
    setFormError(null);

    if (mode === 'edit' && item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'Emergency',
        type: item.type || 'Acute Care',
        description: item.description || '',
        location: item.location || '',
        floor: item.floor || 'Ground Floor',
        contactPhone: item.contactPhone || '',
        email: item.email || '',
        openingHours: item.openingHours || 'Open 24 hours',
        status: item.status || 'OPEN',
        accessibilityInfo: item.accessibilityInfo || '',
        isStaffOnly: Boolean(item.isStaffOnly),
        facilityId: item.facilityId ? String(item.facilityId) : ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Emergency',
        type: 'Acute Care',
        description: '',
        location: '',
        floor: 'Ground Floor',
        contactPhone: '',
        email: '',
        openingHours: 'Open 24 hours',
        status: 'OPEN',
        accessibilityInfo: 'Wheelchair access',
        isStaffOnly: false,
        facilityId: ''
      });
    }
    setShowAdminModal(true);
  };

  // Submit Admin Form
  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!formData.name.trim() || !formData.category.trim()) {
      setFormError('Name and category are required fields.');
      setFormSubmitting(false);
      return;
    }

    try {
      if (adminTargetType === 'facility') {
        if (adminModalMode === 'create') {
          await createFacility(formData, 'admin');
        } else {
          await updateFacility(editingItem.id, formData, 'admin');
        }
      } else {
        if (adminModalMode === 'create') {
          await createService(formData, 'admin');
        } else {
          await updateService(editingItem.id, formData, 'admin');
        }
      }
      setShowAdminModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
      case '24_7':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {status === '24_7' ? 'Open 24 Hours' : 'Open'}
          </span>
        );
      case 'APPOINTMENT_ONLY':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Appointment Only
          </span>
        );
      case 'TEMPORARILY_UNAVAILABLE':
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-full flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            {status === 'CLOSED' ? 'Closed' : 'Unavailable'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Hospital Facilities & Services</h1>
            {currentRole.toLowerCase() === 'admin' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md uppercase">
                Admin Management Mode
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            NHS Digital Hospital Directory & Clinical Services • Live PostgreSQL Synchronization
          </p>
        </div>

        {/* Dynamic Backend Health Indicator (Requirement 16) */}
        <div className="flex items-center gap-3">
          {healthStatus.checking ? (
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Health...
            </span>
          ) : healthStatus.connected ? (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
              <Activity className="w-3.5 h-3.5" /> Live Backend Connected
            </span>
          ) : (
            <button
              onClick={checkHealth}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Backend Disconnected • Retry
            </button>
          )}

          {currentRole.toLowerCase() === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAdminForm('create', 'facility')}
                className="px-3.5 py-1.5 bg-[#003087] hover:bg-[#002060] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Facility
              </button>
              <button
                onClick={() => openAdminForm('create', 'service')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Tab Selection */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => { setActiveTab('facilities'); setPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'facilities'
                  ? 'bg-white text-[#003087] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Facilities
            </button>
            <button
              onClick={() => { setActiveTab('services'); setPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-white text-[#003087] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> Services
            </button>
            <button
              onClick={() => { setActiveTab('all'); setPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-[#003087] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Filter className="w-4 h-4" /> All Combined
            </button>
          </div>

          {/* Search Bar (Requirement 7) */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search facilities, services, locations, departments..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills (Requirement 6 & 8) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-medium whitespace-nowrap flex items-center gap-1 pr-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => { setSelectedCategory('ALL'); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-[#003087] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {['Emergency', 'Clinical', 'Diagnostics', 'Pharmacy', 'Laboratory', 'Imaging', 'Patient Support', 'Administration'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
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

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton (Requirement 17) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded-md w-1/2"></div>
              <div className="h-12 bg-gray-50 rounded-xl"></div>
              <div className="h-8 bg-gray-100 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State (Requirement 19) */
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-bold text-rose-900 text-base">{error}</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Failed to fetch facilities or services from PostgreSQL. Please ensure the backend server is running.
          </p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Action
          </button>
        </div>
      ) : (activeTab === 'facilities' && facilities.length === 0) ||
        (activeTab === 'services' && services.length === 0) ||
        (activeTab === 'all' && facilities.length === 0 && services.length === 0) ? (
        /* Empty State (Requirement 18) */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">No facilities or services available.</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            No database records match your active search filter "{searchQuery}" or selected category "{selectedCategory}".
          </p>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Real Facilities & Services Cards (Requirement 5) */
        <div className="space-y-8">
          {(activeTab === 'facilities' || activeTab === 'all') && facilities.length > 0 && (
            <div className="space-y-4">
              {activeTab === 'all' && (
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#003087]" /> Hospital Facilities ({facilities.length})
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map((fac) => (
                  <div
                    key={`fac-${fac.id}`}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 bg-blue-50 text-[#003087] font-semibold text-[11px] rounded-md uppercase tracking-wider">
                            {fac.category}
                          </span>
                          <h3 className="font-bold text-gray-900 text-base mt-1.5 leading-snug">
                            {fac.name}
                          </h3>
                        </div>
                        {renderStatusBadge(fac.status)}
                      </div>

                      {fac.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {fac.description}
                        </p>
                      )}

                      <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-900">{fac.location}</span>
                          {fac.floor && <span className="text-gray-400">({fac.floor})</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {/* Real Opening Hours (Requirement 9) */}
                          <span className="font-medium text-gray-700">{fac.openingHours}</span>
                        </div>

                        {fac.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{fac.contactPhone}</span>
                          </div>
                        )}

                        {fac.isStaffOnly && (
                          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[11px] font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5" /> Staff Internal Unit Only
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDetail({ type: 'facility', data: fac })}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-[#003087] hover:text-white text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" /> View Details
                      </button>

                      {currentRole.toLowerCase() === 'admin' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAdminForm('edit', 'facility', fac)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            title="Edit Facility"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(fac, 'facility')}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold rounded-lg transition-colors"
                            title="Toggle Status"
                          >
                            Toggle Status
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'services' || activeTab === 'all') && services.length > 0 && (
            <div className="space-y-4">
              {activeTab === 'all' && (
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-700" /> Clinical Services ({services.length})
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((serv) => (
                  <div
                    key={`serv-${serv.id}`}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-semibold text-[11px] rounded-md uppercase tracking-wider">
                            {serv.category}
                          </span>
                          <h3 className="font-bold text-gray-900 text-base mt-1.5 leading-snug">
                            {serv.name}
                          </h3>
                        </div>
                        {renderStatusBadge(serv.status)}
                      </div>

                      {serv.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {serv.description}
                        </p>
                      )}

                      <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        {serv.facilityName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-semibold text-gray-900">{serv.facilityName}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{serv.location || 'Hospital Main Building'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-700">{serv.openingHours}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDetail({ type: 'service', data: serv })}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-emerald-700 hover:text-white text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" /> View Details
                      </button>

                      {currentRole.toLowerCase() === 'admin' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAdminForm('edit', 'service', serv)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            title="Edit Service"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(serv, 'service')}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold rounded-lg transition-colors"
                            title="Toggle Status"
                          >
                            Toggle Status
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination Controls (Requirement 20) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs">
              <span className="text-gray-500">
                Showing Page <span className="font-bold text-gray-900">{page}</span> of{' '}
                <span className="font-bold text-gray-900">{totalPages}</span> ({totalCount} total items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Facility/Service Detail Modal (Requirement 11) */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#003087] font-semibold text-[11px] rounded-md uppercase">
                  {selectedDetail.data.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedDetail.data.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              <div>
                <span className="font-bold text-gray-900 block mb-1">Status</span>
                {renderStatusBadge(selectedDetail.data.status)}
              </div>

              {selectedDetail.data.description && (
                <div>
                  <span className="font-bold text-gray-900 block mb-1">Overview</span>
                  <p className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-600">
                    {selectedDetail.data.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                <div>
                  <span className="font-bold text-gray-900 block mb-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#003087]" /> Location
                  </span>
                  <p className="text-gray-700 font-medium">{selectedDetail.data.location}</p>
                  {'floor' in selectedDetail.data && selectedDetail.data.floor && (
                    <span className="text-gray-500 font-normal">{selectedDetail.data.floor}</span>
                  )}
                </div>

                <div>
                  <span className="font-bold text-gray-900 block mb-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#003087]" /> Operating Hours
                  </span>
                  <p className="text-gray-700 font-medium">{selectedDetail.data.openingHours}</p>
                </div>
              </div>

              {selectedDetail.data.contactPhone && (
                <div>
                  <span className="font-bold text-gray-900 block mb-0.5">Contact Direct Line</span>
                  <p className="text-gray-700">{selectedDetail.data.contactPhone}</p>
                </div>
              )}

              {'accessibilityInfo' in selectedDetail.data && selectedDetail.data.accessibilityInfo && (
                <div>
                  <span className="font-bold text-gray-900 block mb-1">Accessibility Information</span>
                  <p className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-100 font-medium">
                    ♿ {selectedDetail.data.accessibilityInfo}
                  </p>
                </div>
              )}

              {/* Resource Integration (Requirement 21) */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500">Related Clinical Documentation:</span>
                <a
                  href="#resources"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDetail(null);
                    alert(`Direct link to clinical resource guide for: ${selectedDetail.data.name}`);
                  }}
                  className="text-[#003087] font-bold hover:underline inline-flex items-center gap-1"
                >
                  View Related Resource <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create/Edit Modal (Requirement 14 & 15) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {adminModalMode === 'create' ? 'Add New' : 'Edit'}{' '}
                {adminTargetType === 'facility' ? 'Hospital Facility' : 'Clinical Service'}
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
                <label className="font-bold text-gray-700 block mb-1">
                  {adminTargetType === 'facility' ? 'Facility Name' : 'Service Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cardiology Clinic or Outpatient Pharmacy"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003087]/20"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="Clinical">Clinical</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Imaging">Imaging</option>
                    <option value="Patient Support">Patient Support</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003087]/20"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="APPOINTMENT_ONLY">APPOINTMENT_ONLY</option>
                    <option value="TEMPORARILY_UNAVAILABLE">TEMPORARILY_UNAVAILABLE</option>
                    <option value="24_7">24_7</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of clinical or operational capabilities..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003087]/20"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Ground Floor, Block A"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Opening Hours *</label>
                  <input
                    type="text"
                    required
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    placeholder="e.g. Open 24 hours or Mon-Fri 08:00-18:00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+44 20 7946 0000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dept@nhs-hospital.demo"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {adminTargetType === 'facility' && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Accessibility Information</label>
                  <input
                    type="text"
                    value={formData.accessibilityInfo}
                    onChange={(e) => setFormData({ ...formData, accessibilityInfo: e.target.value })}
                    placeholder="e.g. Wheelchair ramp, Braille signage, Hearing loop"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isStaffOnly"
                  checked={formData.isStaffOnly}
                  onChange={(e) => setFormData({ ...formData, isStaffOnly: e.target.checked })}
                  className="w-4 h-4 text-[#003087] rounded border-gray-300 focus:ring-[#003087]"
                />
                <label htmlFor="isStaffOnly" className="font-semibold text-gray-700 cursor-pointer">
                  Restrict to Staff & Admin Users Only (Hide from Patient users)
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
                  {adminModalMode === 'create' ? 'Save New Record' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
