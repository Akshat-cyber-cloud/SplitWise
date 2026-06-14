const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');
const { parseCSV, parseAmount, parseDate } = require('../services/csv.service');
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

  // Fetch all users once and build a fast lookup map
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });
  const userMap = new Map();
  for (const u of allUsers) {
    userMap.set(u.name.toLowerCase().trim(), u);
  }

  // Fetch group members once
  const members = await prisma.groupMembership.findMany({
    where: { groupId, leftAt: null },
    select: { userId: true },
  });
  const memberUserIds = members.map((m) => m.userId);

  // Create import batch
  const batch = await prisma.importBatch.create({
    data: { filename: req.file.originalname, createdBy: req.user.id },
  });

  const cleanRows = [];
  const anomalyInserts = [];

  for (const row of rows) {
    const flags = runDetectors(row, rows);

    // Local validation for unknown payer
    if (row.paid_by && row.paid_by.trim() !== '') {
      const paidByUser = userMap.get(row.paid_by.toLowerCase().trim());
      if (!paidByUser) {
        flags.push({
          detector: 'unknown_payer',
          suggestedAction: `Reject or match: user "${row.paid_by}" does not exist in the database.`,
        });
      }
    }

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
      const parsedAmt = parseAmount(row.amount);
      let amountInInr = parsedAmt;
      const parsedDt = parseDate(row.date);

      if (currency !== 'INR') {
        exchangeRate = await getExchangeRate(currency, 'INR', parsedDt);
        amountInInr = parsedAmt * exchangeRate;
      }

      // Default: EQUAL split among current members
      if (memberUserIds.length === 0) {
        throw new Error('Group has no active members to split with.');
      }
      const splits = computeSplits('EQUAL', amountInInr, {
        userIds: memberUserIds,
      });

      const paidByUser = userMap.get(row.paid_by.toLowerCase().trim());
      if (!paidByUser) continue; // skip if payer not found

      await prisma.expense.create({
        data: {
          groupId,
          paidById:      paidByUser.id,
          amount:        parsedAmt,
          currency,
          amountInInr,
          exchangeRate,
          description:   row.description,
          date:          parsedDt,
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
