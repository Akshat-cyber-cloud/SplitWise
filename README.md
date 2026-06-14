# SharedSplit — Shared Expense Tracker

> **Assignment submission** — a full-stack shared expenses app built with Node.js + Express + Prisma + React.

---

## Links

| Resource | URL |
|---|---|
| **Live App** | *(will be added after deployment to Render)* |
| **GitHub Repo** | *(will be added after push)* |
| **AI Used** | Antigravity IDE (Google DeepMind) |

---

## AI Tools Used

- **Antigravity IDE (Google DeepMind)** — used throughout for scaffolding, route stubs, Prisma schema design, balance calculation logic, anomaly detector patterns, UI components (LandingPage, GroupDetail, BalancePage), and doc templates.  
  See [`docs/AI_USAGE.md`](./docs/AI_USAGE.md) for detailed prompts and three cases where the AI was wrong.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database (local install, Render, or Railway)

---

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ExpenseTracker
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Open .env and fill in:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
#   JWT_SECRET="any-long-random-string"
npm install
npx prisma migrate dev --name init
npm run db:seed          # optional — loads Aisha/Rohan/Priya/Meera/Sam sample data
npm run dev              # starts API on http://localhost:4000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev              # starts UI on http://localhost:3000 (proxies /api → :4000)
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment (Render)

1. Push repo to GitHub.
2. **Create PostgreSQL** on Render → copy the **Internal Database URL**.
3. **Create Web Service** for `backend/`:
   - Build command: `npm install && npx prisma migrate deploy`
   - Start command: `node src/server.js`
   - Environment variables: `DATABASE_URL`, `JWT_SECRET`
4. **Create Static Site** for `frontend/`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variable: `VITE_API_URL=https://<your-backend>.onrender.com`

---

## 📁 Project Structure

```
ExpenseTracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         ← full data model (8 tables)
│   │   └── seed.js               ← sample users, groups, expenses
│   └── src/
│       ├── server.js             ← Express app bootstrap
│       ├── config/prisma.js      ← Prisma client singleton
│       ├── middleware/
│       │   └── auth.js           ← JWT bearer token verification
│       ├── routes/               ← one file per resource
│       │   ├── auth.routes.js
│       │   ├── group.routes.js
│       │   ├── expense.routes.js
│       │   ├── balance.routes.js
│       │   ├── import.routes.js
│       │   ├── anomaly.routes.js
│       │   ├── payment.routes.js
│       │   └── membership.routes.js
│       ├── controllers/          ← business logic
│       │   ├── auth.controller.js
│       │   ├── group.controller.js
│       │   ├── expense.controller.js
│       │   ├── balance.controller.js
│       │   ├── import.controller.js
│       │   ├── anomaly.controller.js
│       │   └── payment.controller.js
│       └── services/             ← split, currency, csv parsing, detectors
│           ├── split.service.js
│           ├── currency.service.js
│           ├── csv.service.js
│           └── detectors.js
├── frontend/
│   └── src/
│       ├── api/axios.js          ← Axios instance with base URL + auth header
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Layout.jsx        ← sidebar + main content shell
│       │   └── UserTour.jsx      ← guided onboarding tour
│       └── pages/
│           ├── LandingPage.jsx
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── GroupsPage.jsx
│           ├── GroupDetail.jsx
│           ├── ExpensesPage.jsx
│           ├── BalancePage.jsx
│           ├── ImportPage.jsx
│           ├── AnomalyPage.jsx
│           └── ProfilePage.jsx
└── docs/
    ├── SCOPE.md                  ← anomaly log + DB schema
    ├── DECISIONS.md              ← key architectural decisions
    └── AI_USAGE.md               ← AI tools, prompts, AI errors caught
```

---

## 🗂️ Key Features

| Feature | Where |
|---|---|
| Register / Login (JWT) | `/register`, `/login` |
| Create & manage groups | `/groups`, `/groups/:id` |
| Log expenses (EQUAL / EXACT / PERCENTAGE / SHARES split) | Group Detail page |
| Multi-currency (USD → INR via historical rate API) | Expense form |
| Import CSV with anomaly detection | `/groups/:id/import` |
| Anomaly review (approve / reject) | `/groups/:id/import/:batchId/anomalies` |
| Settle balances + ledger drill-down | `/groups/:id/balances` |
| Per-member balance breakdown with expense trail | Balance page |

---

## 🧪 Running Tests

*(Unit tests not included in MVP — see DECISIONS.md D9 for rationale.)*

---

## 📄 Documentation

- [`docs/SCOPE.md`](./docs/SCOPE.md) — DB schema & anomaly log
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — decision log
- [`docs/AI_USAGE.md`](./docs/AI_USAGE.md) — AI usage + errors caught
