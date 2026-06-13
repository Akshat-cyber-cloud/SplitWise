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

app.use(cors());
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
