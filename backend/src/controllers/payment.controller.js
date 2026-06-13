const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');

// POST /api/payments/groups/:groupId
const recordPayment = asyncHandler(async (req, res) => {
  const { fromUserId, toUserId, amount, date, note } = req.body;
  const payment = await prisma.payment.create({
    data: {
      groupId:    Number(req.params.groupId),
      fromUserId: Number(fromUserId),
      toUserId:   Number(toUserId),
      amount:     Number(amount),
      date:       new Date(date),
      note,
    },
  });
  res.status(201).json(payment);
});

// GET /api/payments/groups/:groupId
const listPayments = asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { groupId: Number(req.params.groupId) },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser:   { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });
  res.json(payments);
});

module.exports = { recordPayment, listPayments };
