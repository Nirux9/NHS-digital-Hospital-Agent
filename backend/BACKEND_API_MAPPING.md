# NHS Digital Hospital Agent — Backend API Mapping

This document maps all user actions across the Patient, Clinical (Doctor), and Operations (Admin) portals to backend REST API endpoints.

---

## 1. Authentication & Session

| Feature / Action | Method | URL | Auth Required | Role Required | Request Body | Response |
|---|---|---|---|---|---|---|
| User Registration | `POST` | `/api/auth/register` | No | None | `{ name, email, password, role, phone }` | `{ user, token }` |
| User Login | `POST` | `/api/auth/login` | No | None | `{ email, password }` | `{ user, token }` |
| User Logout | `POST` | `/api/auth/logout` | Yes | Any | None | `{ success: true }` |
| Get Current Profile | `GET` | `/api/auth/me` | Yes | Any | None | User profile object |

---

## 2. Doctor Dashboard & Clinical Portal

| Feature / Action | Method | URL | Auth Required | Role Required | Request Body | Response |
|---|---|---|---|---|---|---|
| Doctor Dashboard Summary | `GET` | `/api/dashboard/doctor` | Yes | DOCTOR, ADMIN | None | Total patients, pending reviews, occupancy, alerts |
| Live Triage Queue | `GET` | `/api/triage/alerts` | Yes | DOCTOR, ADMIN | None | Array of active triage alerts |
| Triage Alert Detail | `GET` | `/api/triage/alerts/:id` | Yes | DOCTOR, ADMIN | None | Single triage alert with patient details |
| Acknowledge Triage Alert | `PATCH` | `/api/triage/alerts/:id/acknowledge` | Yes | DOCTOR, ADMIN | None | Updated alert status & ack timestamp |
| Doctor Schedule / Appointments | `GET` | `/api/doctors/:id/schedule` | Yes | DOCTOR, ADMIN | None | Today's appointment list |
| Clinical Review List | `GET` | `/api/clinical-reviews` | Yes | DOCTOR, ADMIN | None | Array of clinical review records |
| Create Clinical Review | `POST` | `/api/clinical-reviews` | Yes | DOCTOR | `{ patientId, doctorId, summary, findings, plan }` | Created clinical review |
| Patient Vitals & History | `GET` | `/api/patients/:id` | Yes | DOCTOR, ADMIN | None | Patient vitals, history & relations |

---

## 3. Patient Portal

| Feature / Action | Method | URL | Auth Required | Role Required | Request Body | Response |
|---|---|---|---|---|---|---|
| Patient Dashboard Summary | `GET` | `/api/dashboard/patient` | Yes | PATIENT, ADMIN | None | Next appointment, notifications, updates |
| Book Appointment | `POST` | `/api/appointments` | Yes | PATIENT, ADMIN | `{ patientId, doctorId, date, time, reason }` | Created appointment |
| Reschedule Appointment | `POST` | `/api/appointments/:id/reschedule` | Yes | PATIENT, ADMIN | `{ date, time, reason }` | Updated appointment |
| Cancel Appointment | `PATCH` | `/api/appointments/:id/status` | Yes | PATIENT, ADMIN | `{ status: "CANCELLED" }` | Cancelled appointment |
| Patient Appointments List | `GET` | `/api/patients/:id/appointments` | Yes | Any | None | Array of patient appointments |
| Patient Prescriptions | `GET` | `/api/patients/:id/prescriptions` | Yes | Any | None | Array of patient prescriptions |
| Patient Test Results | `GET` | `/api/patients/:id/test-results` | Yes | Any | None | Array of test results |
| AI Health Assistant Query | `POST` | `/api/assistant/message` | Yes | Any | `{ message, role, history }` | `{ response: string }` |

---

## 4. Hospital Operations & Admin Dashboard

| Feature / Action | Method | URL | Auth Required | Role Required | Request Body | Response |
|---|---|---|---|---|---|---|
| Admin Dashboard Summary | `GET` | `/api/dashboard/admin` | Yes | ADMIN | None | Total count metrics, occupancy, audit logs |
| Ward Occupancy Metrics | `GET` | `/api/wards` | Yes | Any | None | Wards with bed occupancy statistics |
| Bed List & Status | `GET` | `/api/beds` | Yes | Any | None | List of beds by ward |
| Update Bed Status | `PATCH` | `/api/beds/:id/status` | Yes | DOCTOR, ADMIN | `{ status }` | Updated bed |
| Assign Bed to Patient | `POST` | `/api/beds/:id/assign` | Yes | DOCTOR, ADMIN | `{ patientId }` | Occupied bed |
| Release Bed | `POST` | `/api/beds/:id/release` | Yes | DOCTOR, ADMIN | None | Available bed |
| Analytics Overview | `GET` | `/api/analytics/overview` | Yes | DOCTOR, ADMIN | None | No-show rate, wait time, occupancy |
| AI Model Health Metrics | `GET` | `/api/ai/models` | Yes | DOCTOR, ADMIN | None | AI accuracy, drift, status |
| Trigger AI Model Retrain | `POST` | `/api/ai/models/:id/retrain` | Yes | ADMIN | None | Updated model status |
| System Activity / Audit Logs | `GET` | `/api/analytics/system-activity` | Yes | ADMIN | None | System audit logs |

---

## 5. Communications & Search

| Feature / Action | Method | URL | Auth Required | Role Required | Request Body | Response |
|---|---|---|---|---|---|---|
| User Notifications | `GET` | `/api/notifications` | Yes | Any | None | User notification list |
| Mark Notification Read | `PATCH` | `/api/notifications/:id/read` | Yes | Any | None | Updated notification |
| Messages List | `GET` | `/api/messages` | Yes | Any | None | User message list |
| Send Message | `POST` | `/api/messages` | Yes | Any | `{ receiverId, content }` | Created message |
| Search Portal | `GET` | `/api/search?q=query` | Yes | Any | None | Grouped search results |
| Hospital Facilities List | `GET` | `/api/facilities` | Yes | Any | None | Active hospital facilities |
