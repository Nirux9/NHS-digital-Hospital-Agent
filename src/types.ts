export type UserRole = 'Doctor' | 'Admin' | 'Patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  avatarUrl?: string;
}

export interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  reason: string;
  time: string;
  date: string;
  triage: 'Standard' | 'Urgent' | 'Critical' | 'CRITICAL' | 'EMERGENT' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT';
  room?: string;
  department?: string;
  status: 'Confirmed' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'NO_SHOW' | string;
}

export interface TriageAlertItem {
  id: string;
  location: string;
  timeAgo: string;
  message: string;
  severity: 'Standard' | 'Urgent' | 'Critical' | 'CRITICAL' | 'EMERGENT' | 'URGENT';
  status?: string;
  patientId?: string;
  patientName?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface PatientRecord {
  id: string;
  nhsNumber?: string;
  name: string;
  age: number;
  gender: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  department?: string;
  triageLevel?: 'CRITICAL' | 'EMERGENT' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT' | string;
  nextAppointment?: string;
  lastUpdated?: string;
  vitals?: {
    weightKg?: number;
    tempC?: number;
    heartRateBpm?: number;
    spo2?: number;
    systolicBp?: number;
    respiratoryRate?: number;
    painScore?: number;
  };
  labs?: Array<{ id: string; testName: string; result: string; unit?: string; date: string; status: string }>;
  prescriptions?: Array<{ id: string; medication: string; dosage: string; frequency: string; status: string }>;
  history?: Array<{ id: string; date: string; diagnosis: string; notes: string }>;
}

export interface RecentUpdate {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  category?: 'TEST_RESULT' | 'PRESCRIPTION' | 'QUESTIONNAIRE' | 'APPOINTMENT' | 'TRIAGE';
}

export interface AIModelItem {
  id: string;
  name: string;
  version: string;
  accuracy?: string | number;
  dataDrift?: string | number;
  status: string;
  lastUpdated?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
