const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');
const { computeSplits } = require('../services/split.service');
const { getExchangeRate } = require('../services/currency.service');

// GET /api/anomalies/batches/:batchId
const listAnomalies = asyncHandler(async (req, res) => {
  const anomalies = await prisma.importAnomaly.findMany({
    where: { batchId: Number(req.params.batchId) },
    orderBy: { id: 'asc' },
  });
  res.json(anomalies);
});

// PATCH /api/anomalies/:anomalyId/resolve  { action: "APPROVED" | "REJECTED" }
const resolveAnomaly = asyncHandler(async (req, res) => {
  const { action, groupId } = req.body; // groupId needed if approving

  const anomaly = await prisma.importAnomaly.findUnique({
    where: { id: Number(req.params.anomalyId) },
  });
  if (!anomaly) return res.status(404).json({ error: 'Anomaly not found' });
  if (anomaly.status !== 'PENDING')
    return res.status(409).json({ error: 'Anomaly already resolved' });

  if (action === 'APPROVED' && groupId) {
    // Commit the row now that user approved it
    const row = anomaly.rowData;
    try {
      const currency = (row.currency || 'INR').trim().toUpperCase();
      let exchangeRate = 1;
      let amountInInr = Number(row.amount);
      if (currency !== 'INR') {
        exchangeRate = await getExchangeRate(currency, 'INR', row.date);
        amountInInr = Number(row.amount) * exchangeRate;
      }
      const members = await prisma.groupMembership.findMany({
        where: { groupId: Number(groupId), leftAt: null },
        select: { userId: true },
      });
      const splits = computeSplits('EQUAL', amountInInr, {
        userIds: members.map((m) => m.userId),
      });
      const paidByUser = await prisma.user.findFirst({ where: { name: row.paid_by } });
      if (paidByUser) {
        await prisma.expense.create({
          data: {
            groupId:       Number(groupId),
            paidById:      paidByUser.id,
            amount:        Number(row.amount),
            currency,
            amountInInr,
            exchangeRate,
            description:   row.description,
            date:          new Date(row.date),
            splitType:     'EQUAL',
            importBatchId: anomaly.batchId,
            splits: { create: splits },
          },
        });
      }
    } catch (e) {
      return res.status(500).json({ error: `Failed to commit row: ${e.message}` });
    }
  }

  const updated = await prisma.importAnomaly.update({
    where: { id: Number(req.params.anomalyId) },
    data: { status: action, resolvedAt: new Date() },
  });
  res.json(updated);
});

module.exports = { listAnomalies, resolveAnomaly };
