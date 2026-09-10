# 🏥 NHS Digital Hospital AI Agent

> An integrated, enterprise-grade AI-powered healthcare platform combining real-time physiological symptom triage (LightGBM 250k model), PostgreSQL-backed clinical records, interactive doctor & admin portals, and Google Gemini AI decision support.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Role-Based Workflows](#-role-based-workflows)
- [LightGBM Triage & Emergency Escalation](#-lightgbm-triage--emergency-escalation)
- [PostgreSQL Database & Prisma Schema](#-postgresql-database--prisma-schema)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Compliance & Audit Logging](#-compliance--audit-logging)
- [Disclaimer](#-disclaimer)

---

## 📌 Overview

The **NHS Digital Hospital AI Agent** is a full-stack clinical assistance and EPR (Electronic Patient Record) demonstration platform designed to streamline patient triage, hospital operations, and appointment scheduling.

It combines a **React + TypeScript + Tailwind CSS** frontend with an **Express.js + Node.js** REST API backend, synchronized with a **PostgreSQL** database via **Prisma ORM**.

---

## ✨ Key Features

- **Real-Time LightGBM Symptom Triage**: Machine learning triage engine trained on a 250,000-patient dataset (`synthetic_triage_data_250k.csv`) evaluating 11 physiological vitals and symptoms (Age, HR, BP, SpO2, Resp Rate, Temp, AVPU consciousness, Pain Score, Chest Pain, Dyspnea, Active Bleeding).
- **Critical Emergency Escalation Workflow**: Automated emergency protocol for ESI Level 1 (CRITICAL) triage predictions:
  - Emergency contact configuration (`EMERGENCY_NUMBER=999`).
  - `Call Emergency Services` button (`tel:999`).
  - Nearest emergency hospital finder using geodesic (Haversine formula) distance calculation from PostgreSQL facility coordinates.
  - Consent-authorized emergency information sharing (`POST /api/emergency/share`).
  - High-priority `CRITICAL TRIAGE ALERT` creation for clinical staff dashboards.
- **Role-Based Access Control (RBAC)**: Dedicated workflows for **Patient**, **Doctor**, and **Admin** roles.
- **Hospital Facilities & Services Directory**: Live PostgreSQL-backed directory with real-time status management (OPEN/CLOSED/APPOINTMENT_ONLY), category filters, search, and staff-only privacy controls.
- **Support & Guidelines Knowledge Base**: Role-filtered FAQs, clinical guidelines, technical support contacts, and global search.
- **Google Gemini 3.6 AI Core**: Floating conversational assistant widget capable of answering clinical questions, retrieving hospital facility information, and executing direct appointment bookings.
- **Immutable Audit Logging & Governance**: Compliance module tracking system actions (`CRITICAL_TRIAGE_ESCALATION`, `EMERGENCY_INFORMATION_SHARED`, `FACILITY_CREATED`, `APPOINTMENT_BOOKED`, `SUPPORT_CONTENT_UPDATED`).

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   NHS Digital Hospital Agent Shell                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                HTTP REST API
                                    │
 ┌──────────────────────────────────┴──────────────────────────────────┐
 │                  Express.js Backend (port 8080)                     │
 ├──────────────────────────────────┬──────────────────────────────────┤
 │  LightGBM Triage Engine (Python) │  Google Gemini 3.6 AI Core        │
 ├──────────────────────────────────┼──────────────────────────────────┤
 │  Prisma ORM Client               │  Immutable Compliance Audit Log  │
 └──────────────────────────────────┴──────────────────────────────────┘
                                    │
                            PostgreSQL Database
                     (Facilities, Services, Patients, Wards)
```

| Layer                | Technology                                                       |
| -------------------- | ---------------------------------------------------------------- |
| **Frontend**         | React 19, TypeScript, Vite, Tailwind CSS, Lucide React           |
| **Backend API**      | Express.js, Node.js (`tsx`), dotenv, `@google/genai`             |
| **Database & ORM**   | PostgreSQL, Prisma ORM (`@prisma/client`)                        |
| **Machine Learning** | LightGBM Decision Tree Classifier (250,000 synthetic patient dataset) |
| **AI Integration**   | Google Gemini 3.6 Flash (`@google/genai` SDK)                    |

---

## 👥 Role-Based Workflows

### 🏥 Patient Portal
- **Dashboard**: Next appointment countdown, quick action cards, and floating Ask Assistant widget.
- **Symptom Triage**: Interactive vital sign input modal generating ESI severity recommendations (Critical, Emergent, Urgent, Less Urgent, Non-Urgent).
- **Appointment Booking**: Select department, clinician, and available date/time slots.
- **Hospital Facilities & Services**: Search and locate departments, pharmacy hours, lab services, and accessibility details.

### 🩺 Doctor Portal
- **Staff Dashboard**: Today's appointments, active triage alerts queue, and pending review counts.
- **Acute Clinical Review**: In-depth EPR patient telemetry, vital sign trends, Troponin T lab values, and clinical note editing.
- **Ward Bed Map**: Interactive ward occupancy map (Cardiology, ICU, General Medicine) with bed assignment management.
- **Team Messaging**: Real-time channel communications for clinical teams (#cardiology-ward, #icu-transfers).

### 🛡️ Admin Portal
- **Executive Dashboard**: High-level trust metrics, bed capacity, and active clinician counts.
- **Safety & Compliance**: System audit log viewer with filtering by category, action, or actor.
- **Facilities & Services Management**: Add, edit, or toggle availability status for hospital facilities and services.
- **Support Content Management**: Add, edit, and archive FAQ knowledge base items.

---

## 🚑 LightGBM Triage & Emergency Escalation

The application incorporates a 5-level Emergency Severity Index (ESI) classification model:

```text
LIGHTGBM MODEL INFERENCE (11 physiological vitals & symptoms)
   │
   ├── CRITICAL (ESI 1) ──────► 🚨 Emergency Escalation Flow
   │                            ├── Call Emergency Services (tel:999)
   │                            ├── Nearest Hospital Search (Haversine distance)
   │                            ├── Consent-based Emergency Information Sharing
   │                            ├── Doctor Triage Alert & Audit Logging
   │                            └── Auto-Book Next Available Appointment
   │
   ├── EMERGENT (ESI 2) ──────► ⚡ Auto-Book Next Available Appointment
   │
   ├── URGENT (ESI 3) ────────► ⚡ Auto-Book Next Available Appointment
   │
   └── LESS_URGENT / NON_URGENT ──► ℹ️ Self-Care & Portal Booking
```

### Critical Escalation Features
- **Configurable Emergency Number**: Set via `EMERGENCY_NUMBER` environment variable (default: `999`).
- **Geodesic Distance Calculation**: Uses the Haversine formula to find nearest emergency-capable facilities:
  $$\text{Distance} = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Consent-Authorized Data Sharing**: Patient explicitly consents before transmitting triage vitals (`POST /api/emergency/share`).

---

## 🗄️ PostgreSQL Database & Prisma Schema

The PostgreSQL database manages admissions, beds, departments, doctors, patients, wards, facilities, and services:

```prisma
model facilities {
  id                 Int        @id @default(autoincrement())
  name               String     @db.VarChar(150)
  type               String?    @db.VarChar(50)
  category           String     @db.VarChar(50)
  description        String?
  location           String     @db.VarChar(150)
  floor              String?    @db.VarChar(50)
  contact_phone      String?    @db.VarChar(50)
  email              String?    @db.VarChar(150)
  opening_hours      String     @db.VarChar(100)
  status             String     @default("OPEN") @db.VarChar(50)
  accessibility_info String?
  is_staff_only      Boolean    @default(false)
  created_at         DateTime?  @default(now()) @db.Timestamp(6)
  updated_at         DateTime?  @default(now()) @updatedAt @db.Timestamp(6)
  services           services[]
}
```

---

## 📂 Project Structure

```text
NHS-Hospital-AI-Agent/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM Database Schema
│   └── package.json
├── src/
│   ├── components/               # Header, Sidebar, Footer, Modals, Assistant
│   ├── pages/                    # Dashboards, Facilities, Support, Clinical Review
│   ├── services/                 # API service layer (fetch helpers)
│   ├── types.ts                  # TypeScript interface definitions
│   ├── App.tsx                   # Main layout and routing state
│   └── main.tsx                  # React entry point
├── .env                          # Environment configuration
├── package.json                  # Root dependencies and scripts
├── server.ts                     # Express REST API Server
└── vite.config.ts                # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: PostgreSQL 14+ instance running locally or remotely

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Likhithaambati8/NHS-Hospital-AI-Agent.git
   cd NHS-Hospital-AI-Agent
   ```

2. **Install root & backend dependencies**:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Configure Environment Variables**:
   Create or edit `.env` in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=8080
   APP_URL=http://localhost:8080
   DATABASE_URL="postgresql://postgres:password@localhost:5433/nhs_hospital_agent"
   EMERGENCY_NUMBER=999
   ```

4. **Initialize Database Tables**:
   ```bash
   npx prisma db push --schema=backend/prisma/schema.prisma
   ```

5. **Start Development Servers**:

   - **Option 1: Concurrent startup (Recommended)**
     ```bash
     # Terminal 1: Backend Express Server
     npm run server:dev

     # Terminal 2: Frontend Vite Server
     npm run dev
     ```

   - Access the application:
     - **Frontend**: [http://localhost:3000](http://localhost:3000)
     - **Backend API**: [http://localhost:8080](http://localhost:8080)
     - **API Health Check**: [http://localhost:8080/api/health](http://localhost:8080/api/health)

---

## 📡 API Reference

| Method | Endpoint                        | Description                                           |
| ------ | ------------------------------- | ----------------------------------------------------- |
| `GET`  | `/api/health`                   | Server and PostgreSQL connection health status        |
| `POST` | `/api/triage`                   | Runs LightGBM triage inference on vitals and symptoms |
| `GET`  | `/api/emergency/config`         | Retrieves configured emergency contact number         |
| `POST` | `/api/emergency/nearest-hospital`| Geodesic search for nearest emergency-capable hospital|
| `POST` | `/api/emergency/share`          | Consent-authorized emergency information transmission |
| `GET`  | `/api/facilities`               | List PostgreSQL facilities with filtering & search    |
| `GET`  | `/api/services`                 | List hospital clinical services                       |
| `GET`  | `/api/support/faqs`             | Searchable, role-filtered knowledge base FAQs         |
| `GET`  | `/api/compliance/audit-logs`    | System audit logs for compliance oversight            |
| `POST` | `/api/chat`                     | Streaming Google Gemini AI Assistant endpoint         |

---

## 🛡️ Compliance & Audit Logging

Every clinical action, emergency escalation, and data mutation creates an entry in the immutable audit log:

- `CRITICAL_TRIAGE_ESCALATION`
- `EMERGENCY_CALL_INITIATED`
- `EMERGENCY_INFORMATION_SHARED`
- `FACILITY_CREATED` / `SERVICE_UPDATED`
- `SUPPORT_CONTENT_CREATED`

Audit records are viewable in the **Admin Portal** under **Safety & Compliance -> Audit Logs**.

---

## ⚠️ Disclaimer

This application is developed for **demonstration, educational, and research purposes**. 

- The LightGBM triage model is trained on a synthetic dataset (`synthetic_triage_data_250k.csv`).
- Clinical validation for standalone medical diagnosis has not been performed.
- Always consult a qualified healthcare professional or dial official emergency services (**999** in the UK) in a medical emergency.

---

## 📄 License

Educational and Demonstration License · NHS Central Trust Demo Platform.
