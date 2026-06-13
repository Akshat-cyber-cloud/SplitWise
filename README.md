# README.md – SharedSplit

## AI Tools Used
- Antigravity IDE (Antigravity by Google DeepMind)

## Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database (local or Render/Railway)

### Backend
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed             # optional: load sample data
npm run dev                 # starts on port 4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # starts on port 3000, proxies /api → :4000
```

## Deployment (Render)

1. Push repo to GitHub.
2. Create a **PostgreSQL** database on Render → copy the internal URL.
3. Create a **Web Service** for `backend/` → set `DATABASE_URL` and `JWT_SECRET` env vars → build command: `npm install && npx prisma migrate deploy` → start: `node src/server.js`.
4. Create a **Static Site** for `frontend/` → build: `npm run build` → publish dir: `dist`.

## Project Structure

```
ExpenseTracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      ← full data model
│   │   └── seed.js
│   └── src/
│       ├── server.js
│       ├── config/prisma.js
│       ├── middleware/
│       ├── routes/            ← one file per resource
│       ├── controllers/       ← business logic
│       └── services/          ← split, currency, csv, detectors
├── frontend/
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.jsx
│       ├── components/Layout.jsx
│       └── pages/             ← one file per screen
└── docs/
    ├── SCOPE.md
    ├── DECISIONS.md
    └── AI_USAGE.md
```
