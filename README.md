# 🎓 Technula EduFlow — Admin & Teacher Web Portal

Unified Web Application for School Administrators, Principals, Accountants, Teachers, and SuperAdmins.
Built with **React 19**, **Vite**, and **Tailored Design System**.

---

## 🚀 Features

- **Role-Based Portals**:
  - **SuperAdmin Dashboard**: Multi-school tenant onboarding, subscription plans, platform telemetry, feature flag gating.
  - **School Admin & Principal**: Student 360 dossiers, academic risk prediction engine, AI diagnosis remarks, staff management, fee billing.
  - **Teacher PWA**: Fast mobile-responsive attendance marking, exam grade entry, student feedback, and digital diary.
  - **Security Gate Staff**: Gate pass scanner & visitor logging.
- **Production-Ready**: Multi-stage Docker container with Alpine Nginx and HTTP caching.

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Default `VITE_API_BASE=http://localhost:8000`.

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🐳 Production Build & Docker

### Build Static Assets
```bash
npm run build
```
Generates production bundle in `dist/`.

### Docker Container
```bash
docker build -t technula-eduflow-frontend .
docker run -p 80:80 technula-eduflow-frontend
```
Exposes the portal on port 80 with client-side SPA routing pre-configured.
