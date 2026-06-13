const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');
const { computeSplits } = require('../services/split.service');
const { getExchangeRate } = require('../services/currency.service');

// POST /api/expenses/groups/:groupId
const createExpense = asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const {
    paidById, amount, currency = 'INR', description, date, splitType, splitData,
  } = req.body;

  // Currency conversion: always store amount_in_inr
  let exchangeRate = 1;
  let amountInInr = Number(amount);
  if (currency !== 'INR') {
    exchangeRate = await getExchangeRate(currency, 'INR', date);
    amountInInr = Number(amount) * exchangeRate;
  }

  // Compute per-person splits and normalise to INR shares
  const splits = computeSplits(splitType, amountInInr, splitData);

  const expense = await prisma.expense.create({
    data: {
      groupId,
      paidById:    Number(paidById),
      amount:      Number(amount),
      currency,
      amountInInr,
      exchangeRate,
      description,
      date:        new Date(date),
      splitType,
      splits: { create: splits },
    },
    include: { splits: true },
  });
  res.status(201).json(expense);
});

// GET /api/expenses/groups/:groupId
const listExpenses = asyncHandler(async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { groupId: Number(req.params.groupId) },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

// GET /api/expenses/:id
const getExpense = asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

// PUT /api/expenses/:id
const updateExpense = asyncHandler(async (req, res) => {
  const { description, date, splitType, splitData, amount, currency, paidById } = req.body;

  const existing = await prisma.expense.findUnique({ where: { id: Number(req.params.id) } });
  if (!existing) return res.status(404).json({ error: 'Expense not found' });

  const newAmount = amount !== undefined ? Number(amount) : Number(existing.amount);
  const newCurrency = currency || existing.currency;
  let exchangeRate = Number(existing.exchangeRate);
  let amountInInr = Number(existing.amountInInr);

  if (amount !== undefined || currency !== undefined) {
    if (newCurrency !== 'INR') {
      exchangeRate = await getExchangeRate(newCurrency, 'INR', date || existing.date);
      amountInInr = newAmount * exchangeRate;
    } else {
      exchangeRate = 1;
      amountInInr = newAmount;
    }
  }

  const splits = splitData ? computeSplits(splitType || existing.splitType, amountInInr, splitData) : null;

  const expense = await prisma.$transaction(async (tx) => {
    if (splits) {
      await tx.expenseSplit.deleteMany({ where: { expenseId: Number(req.params.id) } });
    }
    return tx.expense.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(splitType && { splitType }),
        ...(paidById && { paidById: Number(paidById) }),
        amount: newAmount,
        currency: newCurrency,
        amountInInr,
        exchangeRate,
        ...(splits && { splits: { create: splits } }),
      },
      include: { splits: true },
    });
  });
  res.json(expense);
});

// DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  await prisma.$transaction([
    prisma.expenseSplit.deleteMany({ where: { expenseId: Number(req.params.id) } }),
    prisma.expense.delete({ where: { id: Number(req.params.id) } }),
  ]);
  res.status(204).send();
});

module.exports = { createExpense, listExpenses, getExpense, updateExpense, deleteExpense };
