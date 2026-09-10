const API_BASE = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8080/api` : 'http://localhost:8080/api';

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nhs_token') : null;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer demo_token' };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || errJson.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn(`[API Call] Endpoint ${endpoint} warning:`, error);
    throw error;
  }
}

export async function askAIAssistant(message: string, role: string) {
  try {
    const result = await fetchFromApi('/assistant/message', {
      method: 'POST',
      body: JSON.stringify({ message, role }),
    });
    if (result && result.data && result.data.response) return result.data.response;
    if (result && result.response) return result.response;
  } catch (err) {
    // Fallback if unreachable
  }

  return `Thank you for your inquiry regarding: "${message}".

As your NHS AI Assistant, I can provide evidence-based decision support and guidance. For acute clinical emergencies, please escalate immediately or call 999.`;
}

export interface TriageInputPayload {
  age: number;
  heart_rate: number;
  systolic_bp: number;
  respiratory_rate: number;
  spo2: number;
  temperature_c: number;
  consciousness: string;
  pain_score: number;
  chest_pain: boolean;
  breathing_difficulty: boolean;
  active_bleeding: boolean;
  chief_complaint: string;
  symptoms: string;
  duration: string;
}

export async function submitTriageAssessment(payload: TriageInputPayload) {
  return await fetchFromApi('/triage', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTriageAlerts() {
  const result = await fetchFromApi('/triage/alerts', { method: 'GET' });
  return result.data || [];
}

export async function acknowledgeTriageAlert(alertId: string) {
  const result = await fetchFromApi(`/triage/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
  return result.data;
}

export async function getAIModelHealth() {
  const result = await fetchFromApi('/ai/models', { method: 'GET' });
  return result.data;
}

export async function getHealthCheck() {
  try {
    const result = await fetchFromApi('/health', { method: 'GET' });
    const isDbConnected = Boolean(result) && (
      String(result.database).toLowerCase() === 'connected' ||
      result.success === true ||
      result.status === 'ok'
    );
    return {
      success: isDbConnected,
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : (result?.database ? String(result.database).toLowerCase() : 'disconnected'),
      api: result ? 'healthy' : 'unreachable'
    };
  } catch (err) {
    return { success: false, status: 'error', database: 'disconnected', api: 'unreachable' };
  }
}

export async function getPatients(params: { search?: string; page?: number; limit?: number; role?: string } = {}) {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
  
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/patients${queryString}`, { method: 'GET' });
  return result.data;
}

export async function getPatientDetails(id: string, role?: string) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const result = await fetchFromApi(`/patients/${id}${query}`, { method: 'GET' });
  return result.data;
}

export async function getSchedules(params: { date?: string; doctorId?: string; department?: string; status?: string; role?: string; page?: number; limit?: number } = {}) {
  const queryParts: string[] = [];
  if (params.date) queryParts.push(`date=${encodeURIComponent(params.date)}`);
  if (params.doctorId) queryParts.push(`doctorId=${encodeURIComponent(params.doctorId)}`);
  if (params.department) queryParts.push(`department=${encodeURIComponent(params.department)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/schedules${queryString}`, { method: 'GET' });
  return result.data;
}

export async function rescheduleAppointment(id: string, date: string, time: string) {
  const result = await fetchFromApi(`/appointments/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ date, time }),
  });
  return result;
}

export async function cancelAppointment(id: string) {
  const result = await fetchFromApi(`/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
  return result;
}

export async function getResources(params: { search?: string; category?: string; resourceType?: string; status?: string; role?: string; page?: number; limit?: number } = {}) {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.resourceType) queryParts.push(`resourceType=${encodeURIComponent(params.resourceType)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/resources${queryString}`, { method: 'GET' });
  return result.data;
}

export async function getResourceDetails(id: string, role?: string) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const result = await fetchFromApi(`/resources/${id}${query}`, { method: 'GET' });
  return result.data;
}

export async function createResource(payload: any) {
  const result = await fetchFromApi('/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function updateResource(id: string, payload: any) {
  const result = await fetchFromApi(`/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function deleteResource(id: string, role = 'admin') {
  const result = await fetchFromApi(`/resources/${id}?role=${encodeURIComponent(role)}`, {
    method: 'DELETE',
  });
  return result;
}

export async function getPatientClinicalSummary(patientId: string, role?: string) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const result = await fetchFromApi(`/patients/${patientId}/clinical-summary${query}`, { method: 'GET' });
  return result.data;
}

export async function getClinicalReviews(params: { patientId?: string; doctorId?: string; status?: string; role?: string } = {}) {
  const queryParts: string[] = [];
  if (params.patientId) queryParts.push(`patientId=${encodeURIComponent(params.patientId)}`);
  if (params.doctorId) queryParts.push(`doctorId=${encodeURIComponent(params.doctorId)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/clinical-reviews${queryString}`, { method: 'GET' });
  return result.data;
}

export async function createClinicalReview(payload: any) {
  const role = payload?.role || 'doctor';
  const result = await fetchFromApi(`/clinical-reviews?role=${encodeURIComponent(role)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function updateClinicalReview(id: string, payload: any) {
  const role = payload?.role || 'doctor';
  const result = await fetchFromApi(`/clinical-reviews/${id}?role=${encodeURIComponent(role)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function updateClinicalReviewStatus(id: string, status: string, role = 'doctor') {
  const result = await fetchFromApi(`/clinical-reviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, role }),
  });
  return result;
}

export async function getAdmissions() {
  const result = await fetchFromApi('/admissions', { method: 'GET' });
  return result.data || [];
}

export async function createAdmission(payload: any) {
  const result = await fetchFromApi('/admissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function getHospitalBedOccupancy() {
  const result = await fetchFromApi('/analytics/bed-occupancy', { method: 'GET' });
  return result.data;
}

export async function getWardsSummary() {
  const result = await fetchFromApi('/wards', { method: 'GET' });
  return result.data || [];
}

export async function getBedsMap(params: { wardId?: string; status?: string; search?: string; role?: string } = {}) {
  const queryParts: string[] = [];
  if (params.wardId) queryParts.push(`wardId=${encodeURIComponent(params.wardId)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/beds${queryString}`, { method: 'GET' });
  return result.data || [];
}

export async function getBedDetails(id: string) {
  const result = await fetchFromApi(`/beds/${id}`, { method: 'GET' });
  return result.data;
}

export async function assignPatientToBed(bedId: string, patientId: string, role = 'doctor') {
  const result = await fetchFromApi(`/beds/${bedId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ patientId, role }),
  });
  return result;
}

export async function releaseBed(bedId: string, role = 'doctor') {
  const result = await fetchFromApi(`/beds/${bedId}/release`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
  return result;
}

export async function updateBedStatus(bedId: string, status: string, role = 'doctor') {
  const result = await fetchFromApi(`/beds/${bedId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, role }),
  });
  return result;
}

export async function getStaffDirectory(search?: string, role?: string) {
  const queryParts: string[] = [];
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  if (role) queryParts.push(`role=${encodeURIComponent(role)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/messages/users${queryString}`, { method: 'GET' });
  return result.data || [];
}

export async function getConversations(search?: string, role?: string) {
  const queryParts: string[] = [];
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  if (role) queryParts.push(`role=${encodeURIComponent(role)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/messages/conversations${queryString}`, { method: 'GET' });
  return result.data || [];
}

export async function getConversationDetails(id: string, role?: string) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const result = await fetchFromApi(`/messages/conversations/${id}${query}`, { method: 'GET' });
  return result.data;
}

export async function startNewConversation(payload: any) {
  const result = await fetchFromApi('/messages/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

export async function sendMessageInConversation(conversationId: string, body: string, role = 'doctor') {
  const result = await fetchFromApi(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, role }),
  });
  return result;
}

export async function markConversationRead(conversationId: string, role = 'doctor') {
  const result = await fetchFromApi(`/messages/conversations/${conversationId}/read`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return result;
}

export async function getAnalyticsOverview(role = 'doctor') {
  const result = await fetchFromApi(`/analytics/overview?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function getNoShowRateAnalytics() {
  const result = await fetchFromApi('/analytics/no-show-rate', { method: 'GET' });
  return result.data;
}

export async function getWaitTimeAnalytics() {
  const result = await fetchFromApi('/analytics/wait-time', { method: 'GET' });
  return result.data;
}

export async function getAppointmentAnalytics(range = '7days') {
  const result = await fetchFromApi(`/analytics/appointments?range=${encodeURIComponent(range)}`, { method: 'GET' });
  return result.data;
}

export async function getTriageAnalytics() {
  const result = await fetchFromApi('/analytics/triage', { method: 'GET' });
  return result.data;
}

export async function getAIModelHealthAnalytics() {
  const result = await fetchFromApi('/analytics/ai-model-health', { method: 'GET' });
  return result.data;
}

export async function getSystemActivityAnalytics() {
  const result = await fetchFromApi('/analytics/system-activity', { method: 'GET' });
  return result.data || [];
}

export async function getFeatureImportance(modelId = 'triage_lightgbm') {
  const result = await fetchFromApi(`/ai/models/${modelId}/feature-importance`, { method: 'GET' });
  return result.data || [];
}

export async function getComplianceOverview(role = 'doctor') {
  const result = await fetchFromApi(`/compliance/overview?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function getAuditLogs(params: { page?: number; limit?: number; search?: string; category?: string; role?: string } = {}) {
  const queryParts: string[] = [];
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/compliance/audit-logs${queryString}`, { method: 'GET' });
  return result.data;
}

export async function getSecurityEvents(role = 'doctor') {
  const result = await fetchFromApi(`/compliance/security-events?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data || [];
}

export async function acknowledgeSecurityEvent(id: string, role = 'admin') {
  const result = await fetchFromApi(`/compliance/events/${id}/acknowledge`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return result;
}

export async function getSystemHealthSubsystems() {
  const result = await fetchFromApi('/compliance/system-health', { method: 'GET' });
  return result.data;
}

export async function getDataQualityChecks() {
  const result = await fetchFromApi('/compliance/data-quality', { method: 'GET' });
  return result.data;
}

export async function getMLGovernanceStatus() {
  const result = await fetchFromApi('/compliance/ml-governance', { method: 'GET' });
  return result.data;
}

export async function globalSearch(query: string, role = 'doctor') {
  const result = await fetchFromApi(`/search?q=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function getNotifications(role = 'doctor') {
  const result = await fetchFromApi(`/notifications?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function markNotificationRead(id: string) {
  const result = await fetchFromApi(`/notifications/${id}/read`, { method: 'PATCH' });
  return result.data;
}

export async function markAllNotificationsRead() {
  const result = await fetchFromApi('/notifications/read-all', { method: 'PATCH' });
  return result.data;
}

export async function getAuthUser(role = 'doctor') {
  const result = await fetchFromApi(`/auth/me?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function logoutUser() {
  const result = await fetchFromApi('/auth/logout', { method: 'POST' });
  return result;
}

export async function getUserSettings(role = 'doctor') {
  const result = await fetchFromApi(`/settings?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function updateUserSettings(settings: any, role = 'doctor') {
  const result = await fetchFromApi('/settings', {
    method: 'PATCH',
    body: JSON.stringify({ settings, role })
  });
  return result.data;
}

export async function getDoctors() {
  const result = await fetchFromApi('/doctors', { method: 'GET' });
  return result.data || [];
}

export async function getAppointments(patientId?: string) {
  const query = patientId ? `?patientId=${patientId}` : '';
  const result = await fetchFromApi(`/appointments${query}`, { method: 'GET' });
  return result.data || [];
}

export interface CreateAppointmentPayload {
  patientId?: string;
  doctorId?: string;
  date: string;
  time: string;
  reason: string;
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  return await fetchFromApi('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Facilities & Services Module API Client
// ────────────────────────────────────────────────────────────────────────────

export interface Facility {
  id: number;
  name: string;
  type?: string;
  category: string;
  description?: string;
  location: string;
  floor?: string;
  contactPhone?: string;
  email?: string;
  openingHours: string;
  status: 'OPEN' | 'CLOSED' | 'TEMPORARILY_UNAVAILABLE' | 'APPOINTMENT_ONLY' | '24_7' | string;
  accessibilityInfo?: string;
  isStaffOnly?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  departmentId?: number;
  facilityId?: number;
  facilityName?: string;
  location?: string;
  openingHours: string;
  status: 'OPEN' | 'CLOSED' | 'TEMPORARILY_UNAVAILABLE' | 'APPOINTMENT_ONLY' | '24_7' | string;
  contactPhone?: string;
  isStaffOnly?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacilitiesFetchParams {
  search?: string;
  category?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export async function getFacilities(params: FacilitiesFetchParams = {}) {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/facilities${queryString}`, { method: 'GET' });
  return result.data;
}

export async function getFacilityById(id: number, role = 'patient') {
  const result = await fetchFromApi(`/facilities/${id}?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function createFacility(data: Partial<Facility>, role = 'admin') {
  const result = await fetchFromApi('/facilities', {
    method: 'POST',
    body: JSON.stringify({ ...data, role }),
  });
  return result.data;
}

export async function updateFacility(id: number, data: Partial<Facility>, role = 'admin') {
  const result = await fetchFromApi(`/facilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, role }),
  });
  return result.data;
}

export async function updateFacilityStatus(id: number, status: string, role = 'admin') {
  const result = await fetchFromApi(`/facilities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, role }),
  });
  return result.data;
}

export async function deleteFacility(id: number, role = 'admin') {
  const result = await fetchFromApi(`/facilities/${id}?role=${encodeURIComponent(role)}`, {
    method: 'DELETE',
  });
  return result;
}

export interface ServicesFetchParams {
  search?: string;
  category?: string;
  status?: string;
  facilityId?: number;
  role?: string;
  page?: number;
  limit?: number;
}

export async function getServices(params: ServicesFetchParams = {}) {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.facilityId) queryParts.push(`facilityId=${params.facilityId}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/services${queryString}`, { method: 'GET' });
  return result.data;
}

export async function getServiceById(id: number, role = 'patient') {
  const result = await fetchFromApi(`/services/${id}?role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data;
}

export async function createService(data: Partial<ServiceItem>, role = 'admin') {
  const result = await fetchFromApi('/services', {
    method: 'POST',
    body: JSON.stringify({ ...data, role }),
  });
  return result.data;
}

export async function updateService(id: number, data: Partial<ServiceItem>, role = 'admin') {
  const result = await fetchFromApi(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, role }),
  });
  return result.data;
}

export async function updateServiceStatus(id: number, status: string, role = 'admin') {
  const result = await fetchFromApi(`/services/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, role }),
  });
  return result.data;
}

export async function deleteService(id: number, role = 'admin') {
  const result = await fetchFromApi(`/services/${id}?role=${encodeURIComponent(role)}`, {
    method: 'DELETE',
  });
  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Support & Guidelines Module API Client
// ────────────────────────────────────────────────────────────────────────────

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  roleAudience: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'ALL' | string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportContactInfo {
  supportEmail: string;
  supportPhone: string;
  operatingHours: string;
  emergencyAdvice: string;
}

export interface SupportOverviewData {
  headline: string;
  subheadline: string;
  categories: string[];
  contact: SupportContactInfo;
  syntheticDataDisclosure: {
    dataset: string;
    purpose: string;
    clinicalValidation: string;
  };
}

export async function getSupportOverview() {
  const result = await fetchFromApi('/support/overview', { method: 'GET' });
  return result.data as SupportOverviewData;
}

export interface SupportFetchParams {
  search?: string;
  category?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export async function getSupportFAQs(params: SupportFetchParams = {}) {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.role) queryParts.push(`role=${encodeURIComponent(params.role)}`);
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);

  const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
  const result = await fetchFromApi(`/support/faqs${queryString}`, { method: 'GET' });
  return result.data;
}

export async function createFAQ(data: Partial<FAQItem>, role = 'admin') {
  const result = await fetchFromApi('/support/faqs', {
    method: 'POST',
    body: JSON.stringify({ ...data, role }),
  });
  return result.data;
}

export async function updateFAQ(id: string, data: Partial<FAQItem>, role = 'admin') {
  const result = await fetchFromApi(`/support/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, role }),
  });
  return result.data;
}

export async function deleteFAQ(id: string, role = 'admin') {
  const result = await fetchFromApi(`/support/faqs/${id}?role=${encodeURIComponent(role)}`, {
    method: 'DELETE',
  });
  return result;
}

export async function getSupportGuidelines(role = 'patient', category?: string) {
  const queryParts: string[] = [`role=${encodeURIComponent(role)}`];
  if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
  const result = await fetchFromApi(`/support/guidelines?${queryParts.join('&')}`, { method: 'GET' });
  return result.data || [];
}

export async function searchSupport(query: string, role = 'patient') {
  const result = await fetchFromApi(`/support/search?q=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}`, { method: 'GET' });
  return result.data || { faqs: [], guidelines: [] };
}

export async function getSupportContact() {
  const result = await fetchFromApi('/support/contact', { method: 'GET' });
  return result.data as SupportContactInfo;
}

// ────────────────────────────────────────────────────────────────────────────
// Critical Emergency Escalation API Client
// ────────────────────────────────────────────────────────────────────────────

export interface NearestHospitalResult {
  hospital: {
    id: string;
    name: string;
    emergencyDepartment: boolean;
    address: string;
    phone: string;
    category?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  distanceKm: number | null;
  message?: string;
}

export async function getEmergencyConfig() {
  const result = await fetchFromApi('/emergency/config', { method: 'GET' });
  return result.data;
}

export async function getNearestHospital(latitude?: number, longitude?: number) {
  const result = await fetchFromApi('/emergency/nearest-hospital', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
  return result.data as NearestHospitalResult;
}

export async function shareEmergencyInformation(triageAssessmentId: string, hospitalId: string, consent: boolean, role = 'patient') {
  const result = await fetchFromApi('/emergency/share', {
    method: 'POST',
    body: JSON.stringify({ triageAssessmentId, hospitalId, consent, role }),
  });
  return result;
}

export async function logEmergencyAction(action: string, triageAssessmentId?: string, details?: string, role = 'patient') {
  const result = await fetchFromApi('/emergency/log-action', {
    method: 'POST',
    body: JSON.stringify({ action, triageAssessmentId, details, role }),
  });
  return result.data;
}



