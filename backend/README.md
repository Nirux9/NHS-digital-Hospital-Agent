# 🏥 NHS Digital Hospital Agent — Backend API

Production-ready Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM backend for the NHS Digital Hospital Agent platform.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Authentication:** JWT + bcryptjs
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Validation:** Zod
- **Security:** Helmet, CORS, Express-Rate-Limit

---

## 🚀 Quick Start Instructions

### 1. Prerequisites
- Node.js v18 or higher
- PostgreSQL running locally or remotely

### 2. Installation
Navigate to the `backend/` directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Set your PostgreSQL connection string and Gemini API Key:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/nhs_hospital_agent"
JWT_SECRET="your_secret_jwt_key_here"
AI_API_KEY="AIzaSyDBSreyMZHQpY5tcydCbXxysaOb5l7QtmE"
```

### 4. Database Setup & Seeding
Generate Prisma client, run database migrations, and seed initial demo data:

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npm run db:generate

# Seed realistic NHS demo data
npm run db:seed
```

### 5. Running the Backend Server

```bash
# Development Mode (auto-reload)
npm run dev

# Production Build
npm run build
npm run start
```

The backend server will run at: `http://localhost:5000`

---

## 🔑 Demo User Credentials

The database seed provides ready-to-use accounts for testing:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@nhs.demo` | `Password123!` |
| **Doctor (Cardiology)** | `dr.smith@nhs.demo` | `Password123!` |
| **Doctor (Emergency)** | `dr.patel@nhs.demo` | `Password123!` |
| **Patient** | `patient1@demo.com` | `Password123!` |

---

## 📚 Documentation
- See `BACKEND_API_MAPPING.md` for endpoint to UI component mapping.
- See `API_DOCUMENTATION.md` for complete API request/response specifications.
