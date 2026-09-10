import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  FileText, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  Pill, 
  Building2, 
  HelpCircle, 
  Tag, 
  Lock,
  Globe
} from 'lucide-react';
import { getResources, getResourceDetails, createResource, updateResource, deleteResource, getHealthCheck } from '../services/api';

interface ResourcesPageProps {
  currentRole: string;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ currentRole }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState<{ isLive: boolean; text: string }>({
    isLive: false,
    text: 'Checking Connection...'
  });

  // Selected Resource Details Modal
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [resourceDetails, setResourceDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Admin Create/Edit Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editResourceId, setEditResourceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Patient Education',
    resourceType: 'Article',
    audience: 'ALL',
    status: 'PUBLISHED',
    content: '',
    url: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Check Backend Health (Requirement 16)
  const checkHealth = async () => {
    const health = await getHealthCheck();
    if (health && (health.status === 'ok' || health.database === 'connected')) {
      setBackendStatus({ isLive: true, text: 'Live Backend Connected' });
    } else {
      setBackendStatus({ isLive: false, text: 'Backend Offline' });
    }
  };

  // Fetch Resources List
  const fetchResourcesList = async (page = 1, searchQuery = search, cat = selectedCategory, type = selectedType) => {
    setLoading(true);
    setError('');
    try {
      const data = await getResources({
        page,
        limit: 9,
        search: searchQuery,
        category: cat,
        resourceType: type,
        role: currentRole.toLowerCase()
      });
      if (data && data.resources) {
        setResources(data.resources);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchResourcesList(1, search, selectedCategory, selectedType);
  }, [currentRole]);

  // Open Details Modal
  const handleOpenDetails = async (id: string) => {
    setSelectedResourceId(id);
    setDetailsLoading(true);
    try {
      const details = await getResourceDetails(id, currentRole.toLowerCase());
      setResourceDetails(details);
    } catch (err: any) {
      console.error('Failed to load resource details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Admin Create/Edit Modal
  const handleOpenAdminModal = (res?: any) => {
    if (res) {
      setEditResourceId(res.id);
      setFormData({
        title: res.title || '',
        description: res.description || '',
        category: res.category || 'Patient Education',
        resourceType: res.resourceType || 'Article',
        audience: res.audience || 'ALL',
        status: res.status || 'PUBLISHED',
        content: res.content || '',
        url: res.url || ''
      });
    } else {
      setEditResourceId(null);
      setFormData({
        title: '',
        description: '',
        category: 'Patient Education',
        resourceType: 'Article',
        audience: 'ALL',
        status: 'PUBLISHED',
        content: '',
        url: ''
      });
    }
    setFormError('');
    setShowAdminModal(true);
  };

  // Admin Save Submit
  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      setFormError('Title, description, and category are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');

    try {
      if (editResourceId) {
        await updateResource(editResourceId, { ...formData, role: currentRole.toLowerCase() });
      } else {
        await createResource({ ...formData, role: currentRole.toLowerCase() });
      }
      setShowAdminModal(false);
      fetchResourcesList(1, search, selectedCategory, selectedType);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save resource.');
    } finally {
      setFormLoading(false);
    }
  };

  // Admin Delete Handler
  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id, currentRole.toLowerCase());
      fetchResourcesList(pagination.page, search, selectedCategory, selectedType);
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource.');
    }
  };

  // Icon Helper by Resource Type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'guideline':
        return <BookOpen className="w-4 h-4 text-[#003087]" />;
      case 'link':
        return <ExternalLink className="w-4 h-4 text-teal-600" />;
      case 'article':
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NHS Knowledge Base & Clinical Resource Center</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            PostgreSQL Database Synchronized · Approved Clinical Guidelines & Patient Material
          </p>
        </div>

        {/* Backend Health Status Badge (Requirement 16) */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-colors ${
              backendStatus.isLive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${backendStatus.isLive ? 'animate-pulse' : ''}`} />
            {backendStatus.text}
          </span>

          {/* Admin Create Resource Button (Requirement 13) */}
          {currentRole === 'Admin' && (
            <button
              onClick={() => handleOpenAdminModal()}
              className="px-3.5 py-1.5 bg-[#003087] hover:bg-[#005eb8] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Resource
            </button>
          )}
        </div>
      </div>

      {/* Controls & Filters Bar (Requirements 7, 8, 9) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Search Field */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              fetchResourcesList(1, val, selectedCategory, selectedType);
            }}
            placeholder="Search by title, description, or topic..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#003087] focus:outline-none"
          />
        </div>

        {/* Category & Type Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCategory(val);
              fetchResourcesList(1, search, val, selectedType);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#003087] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Patient Education">Patient Education</option>
            <option value="Clinical Guidelines">Clinical Guidelines</option>
            <option value="Emergency Guidance">Emergency Guidance</option>
            <option value="Medication Information">Medication Information</option>
            <option value="Hospital Policies">Hospital Policies</option>
            <option value="Appointments & Services">Appointments & Services</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedType(val);
              fetchResourcesList(1, search, selectedCategory, val);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#003087] focus:outline-none"
          >
            <option value="ALL">All Resource Types</option>
            <option value="Article">Article</option>
            <option value="PDF">PDF</option>
            <option value="Guideline">Guideline</option>
            <option value="Link">Link</option>
          </select>

          <button
            onClick={() => fetchResourcesList(selectedCategory === 'ALL' ? 1 : pagination.page, search, selectedCategory, selectedType)}
            disabled={loading}
            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-red-900 text-sm">{error}</h3>
          <button
            onClick={() => fetchResourcesList(1, search, selectedCategory, selectedType)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors"
          >
            Retry Loading Resources
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#003087] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Retrieving resource library from PostgreSQL...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-gray-900 text-base">No resources match your search or filters.</h3>
          <p className="text-xs text-gray-500">Try adjusting your search terms or resetting category filters.</p>
          {(search || selectedCategory !== 'ALL' || selectedType !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSelectedType('ALL');
                fetchResourcesList(1, '', 'ALL', 'ALL');
              }}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <div key={res.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-[#003087] border border-blue-200 text-[10px] font-bold rounded-full">
                      {res.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {res.status === 'DRAFT' && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">
                          DRAFT
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded flex items-center gap-1">
                        {getTypeIcon(res.resourceType)}
                        {res.resourceType}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">{res.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed">{res.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400 font-medium">
                    Audience: <strong>{res.audience}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {currentRole === 'Admin' && (
                      <>
                        <button
                          onClick={() => handleOpenAdminModal(res)}
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                          title="Edit Resource"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleOpenDetails(res.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#003087] border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total resources)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchResourcesList(pagination.page - 1, search, selectedCategory, selectedType)}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => fetchResourcesList(pagination.page + 1, search, selectedCategory, selectedType)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Details Modal (Requirement 11) */}
      {selectedResourceId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#003087] text-[10px] font-bold rounded-full">
                  {resourceDetails?.category || 'Resource'}
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-1">{resourceDetails?.title || 'Resource Document'}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedResourceId(null);
                  setResourceDetails(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#003087] animate-spin mx-auto" />
                <p className="text-xs font-semibold text-gray-500">Retrieving full resource content...</p>
              </div>
            ) : resourceDetails ? (
              <div className="space-y-4 text-xs text-gray-700">
                <p className="text-gray-600 font-medium text-xs leading-relaxed">{resourceDetails.description}</p>

                {/* Content Box */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 whitespace-pre-wrap font-sans text-xs text-gray-800 leading-relaxed">
                  {resourceDetails.content || 'Full document content is available via the link below.'}
                </div>

                {resourceDetails.url && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
                    <span className="font-bold text-blue-900 text-xs">External Reference Link</span>
                    <a
                      href={resourceDetails.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#003087] hover:bg-[#005eb8] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      Open Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="text-[10px] text-gray-400 flex items-center justify-between border-t border-gray-100 pt-2">
                  <span>Author: {resourceDetails.createdBy}</span>
                  <span>Target Audience: {resourceDetails.audience}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">Could not load resource details.</p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setSelectedResourceId(null);
                  setResourceDetails(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Create / Edit Modal (Requirement 13) */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">
                {editResourceId ? 'Edit Resource' : 'Create New Resource'}
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAdminFormSubmit} className="space-y-3 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="font-bold text-gray-900 block mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Managing Fever at Home"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary for resource card..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  >
                    <option value="Patient Education">Patient Education</option>
                    <option value="Clinical Guidelines">Clinical Guidelines</option>
                    <option value="Emergency Guidance">Emergency Guidance</option>
                    <option value="Medication Information">Medication Information</option>
                    <option value="Hospital Policies">Hospital Policies</option>
                    <option value="Appointments & Services">Appointments & Services</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Resource Type</label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  >
                    <option value="Article">Article</option>
                    <option value="PDF">PDF</option>
                    <option value="Guideline">Guideline</option>
                    <option value="Link">Link</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  >
                    <option value="ALL">Public (All Users)</option>
                    <option value="PATIENT">Patients Only</option>
                    <option value="DOCTOR">Clinicians / Doctors</option>
                    <option value="ADMIN">Administrators</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-900 block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">External URL (Optional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.nhs.uk/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-900 block mb-1">Content (Markdown / Text)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detailed guidelines or instructions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003087] focus:outline-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-[#003087] hover:bg-[#005eb8] text-white rounded-xl font-bold text-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editResourceId ? 'Save Changes' : 'Publish Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
