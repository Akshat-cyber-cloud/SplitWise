require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes       = require('./routes/auth.routes');
const groupRoutes      = require('./routes/group.routes');
const membershipRoutes = require('./routes/membership.routes');
const expenseRoutes    = require('./routes/expense.routes');
const importRoutes     = require('./routes/import.routes');
const anomalyRoutes    = require('./routes/anomaly.routes');
const balanceRoutes    = require('./routes/balance.routes');
const paymentRoutes    = require('./routes/payment.routes');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  // Allow any Vercel deployment URL for this project
  /https:\/\/split-wise.*\.vercel\.app$/,
  /https:\/\/splitwise.*\.vercel\.app$/,
  // Allow custom domain if set via env var
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/groups',      groupRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/expenses',    expenseRoutes);
app.use('/api/import',      importRoutes);
app.use('/api/anomalies',   anomalyRoutes);
app.use('/api/balances',    balanceRoutes);
app.use('/api/payments',    paymentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
