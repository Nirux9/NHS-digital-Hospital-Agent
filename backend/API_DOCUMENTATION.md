# 🏥 NHS Digital Hospital Agent — API Documentation

Base URL: `http://localhost:5000/api`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description"
  }
}
```

---

## 1. Authentication Endpoints

### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "PATIENT",
  "phone": "+447700900000"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "PATIENT"
    },
    "token": "eyJhbGciOi..."
  },
  "message": "Registration successful"
}
```

---

### POST `/api/auth/login`
Authenticate user and obtain JWT token.

**Request Body:**
```json
{
  "email": "dr.smith@nhs.demo",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...2",
      "name": "Dr. Amelia Clarke",
      "email": "dr.smith@nhs.demo",
      "role": "DOCTOR"
    },
    "token": "eyJhbGciOi..."
  },
  "message": "Login successful"
}
```

---

### GET `/api/auth/me`
Get current authenticated user profile.
**Header:** `Authorization: Bearer <token>`

---

## 2. Dashboard Endpoints

### GET `/api/dashboard/doctor`
Returns live metrics, appointments, triage alerts, and recent activity for doctor dashboard.
**Header:** `Authorization: Bearer <token>` (Doctor or Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatientsToday": 5,
    "pendingReviews": 2,
    "bedOccupancy": "88%",
    "criticalAlertsCount": 1,
    "todaysAppointments": [],
    "triageAlerts": [],
    "recentActivity": []
  }
}
```

---

### GET `/api/dashboard/patient`
Returns next appointment, recent updates, and notifications count for patient dashboard.
**Header:** `Authorization: Bearer <token>` (Patient or Admin)

---

### GET `/api/dashboard/admin`
Returns total patient count, doctor count, occupancy, no-show rate, and system health.
**Header:** `Authorization: Bearer <token>` (Admin)

---

## 3. Triage Alert Endpoints

### GET `/api/triage/alerts`
Returns list of triage alerts. Filterable by `severity` and `status`.

### PATCH `/api/triage/alerts/:id/acknowledge`
Acknowledge a triage alert.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cm...3",
    "status": "ACKNOWLEDGED",
    "acknowledgedAt": "2026-08-22T19:00:00.000Z",
    "acknowledgedBy": { "name": "Dr. Amelia Clarke" }
  },
  "message": "Triage alert acknowledged"
}
```

---

## 4. Ward & Bed Endpoints

### GET `/api/wards`
Returns all wards with bed occupancy calculations.

### POST `/api/beds/:id/assign`
Assign patient to a bed.

**Request Body:**
```json
{ "patientId": "cm...patient_id" }
```

### POST `/api/beds/:id/release`
Release a bed back to AVAILABLE status.

---

## 5. Analytics Endpoints

### GET `/api/analytics/overview`
Returns hospital-wide operational metrics including no-show rate, bed occupancy, and AI model health.

---

## 6. AI Assistant Endpoint

### POST `/api/assistant/message`
Passes queries securely to Google Gemini AI via the backend.

**Request Body:**
```json
{
  "message": "What are the ESI level 1 triage criteria?",
  "role": "clinical"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "response": "ESI Level 1 indicates immediate, life-saving intervention required..."
  },
  "message": "AI assistant response generated"
}
```
