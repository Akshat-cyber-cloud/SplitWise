const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');
const { parseCSV } = require('../services/csv.service');
const { runDetectors } = require('../services/detectors');
const { computeSplits } = require('../services/split.service');
const { getExchangeRate } = require('../services/currency.service');
const fs = require('fs');

// POST /api/import/groups/:groupId  (multipart: file = "csv")
const uploadCSV = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  const groupId = Number(req.params.groupId);

  const rows = await parseCSV(req.file.path);
  fs.unlinkSync(req.file.path); // clean up temp file

  // Create import batch
  const batch = await prisma.importBatch.create({
    data: { filename: req.file.originalname, createdBy: req.user.id },
  });

  const cleanRows = [];
  const anomalyInserts = [];

  for (const row of rows) {
    const flags = runDetectors(row, rows);
    if (flags.length === 0) {
      cleanRows.push({ row, batchId: batch.id });
    } else {
      for (const flag of flags) {
        anomalyInserts.push({
          batchId:         batch.id,
          rowData:         row,
          detectorName:    flag.detector,
          suggestedAction: flag.suggestedAction,
          status:          'PENDING',
        });
      }
    }
  }

  // Persist anomalies
  await prisma.importAnomaly.createMany({ data: anomalyInserts });

  // Commit clean rows
  let committed = 0;
  for (const { row, batchId } of cleanRows) {
    try {
      const currency = (row.currency || 'INR').trim().toUpperCase();
      let exchangeRate = 1;
      let amountInInr = Number(row.amount);
      if (currency !== 'INR') {
        exchangeRate = await getExchangeRate(currency, 'INR', row.date);
        amountInInr = Number(row.amount) * exchangeRate;
      }
      // Default: EQUAL split among current members
      const members = await prisma.groupMembership.findMany({
        where: { groupId, leftAt: null },
        select: { userId: true },
      });
      const splits = computeSplits('EQUAL', amountInInr, {
        userIds: members.map((m) => m.userId),
      });

      const paidByUser = await prisma.user.findFirst({ where: { name: row.paid_by } });
      if (!paidByUser) continue; // skip if payer not found

      await prisma.expense.create({
        data: {
          groupId,
          paidById:      paidByUser.id,
          amount:        Number(row.amount),
          currency,
          amountInInr,
          exchangeRate,
          description:   row.description,
          date:          new Date(row.date),
          splitType:     'EQUAL',
          importBatchId: batchId,
          splits: { create: splits },
        },
      });
      committed++;
    } catch (e) {
      console.error('Failed to commit row', row, e.message);
    }
  }

  res.status(201).json({
    batchId:      batch.id,
    totalRows:    rows.length,
    committed,
    anomalyCount: anomalyInserts.length,
  });
});

// GET /api/import/batches/:batchId/report
const getImportReport = asyncHandler(async (req, res) => {
  const batchId = Number(req.params.batchId);
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: {
      anomalies: true,
      expenses:  { select: { id: true, description: true, date: true, amountInInr: true } },
    },
  });
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  res.json({
    batch: { id: batch.id, filename: batch.filename, createdAt: batch.createdAt },
    committed:    batch.expenses.length,
    anomalyCount: batch.anomalies.length,
    anomalies:    batch.anomalies,
    expenses:     batch.expenses,
  });
});

module.exports = { uploadCSV, getImportReport };
