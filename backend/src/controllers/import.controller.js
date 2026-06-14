const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');
const { parseCSV, parseAmount, parseDate } = require('../services/csv.service');
const { runDetectors } = require('../services/detectors');
const { computeSplits } = require('../services/split.service');
const { getExchangeRate } = require('../services/currency.service');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const ALIAS_MAP = {
  'priya s': 'Priya',
  'priya': 'Priya',
  'rohan': 'Rohan'
};

function normalizeName(name) {
  if (!name) return '';
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (ALIAS_MAP[lower]) {
    return ALIAS_MAP[lower];
  }
  return clean;
}

// POST /api/import/groups/:groupId  (multipart: file = "csv")
const uploadCSV = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
  const groupId = Number(req.params.groupId);

  const rows = await parseCSV(req.file.path);
  fs.unlinkSync(req.file.path); // clean up temp file

  const normalizationsLog = [];

  // 1. Scan rows to identify unique users (normalized) and their earliest/latest dates
  const userDates = {}; // { name: { earliest: Date, latest: Date } }
  
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const date = parseDate(row.date);
    if (!date) return;

    // A. Paid by
    if (row.paid_by && row.paid_by.trim()) {
      const normPayer = normalizeName(row.paid_by);
      
      // Log normalization if name changed
      if (row.paid_by.trim() !== normPayer) {
        normalizationsLog.push(`Row ${rowNum}: '${row.paid_by}' normalized to existing user '${normPayer}'`);
      }

      if (normPayer.toLowerCase() !== "dev's friend kabir") {
        if (!userDates[normPayer]) {
          userDates[normPayer] = { earliest: date, latest: date };
        } else {
          if (date < userDates[normPayer].earliest) userDates[normPayer].earliest = date;
          if (date > userDates[normPayer].latest) userDates[normPayer].latest = date;
        }
      }
    }

    // B. Split with
    if (row.split_with) {
      row.split_with.split(';').forEach((name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const normName = normalizeName(trimmed);

        // Log normalization if name changed
        if (trimmed !== normName) {
          normalizationsLog.push(`Row ${rowNum}: '${trimmed}' normalized to existing user '${normName}'`);
        }

        if (normName.toLowerCase() !== "dev's friend kabir") {
          if (!userDates[normName]) {
            userDates[normName] = { earliest: date, latest: date };
          } else {
            if (date < userDates[normName].earliest) userDates[normName].earliest = date;
            if (date > userDates[normName].latest) userDates[normName].latest = date;
          }
        }
      });
    }
  });

  // 2. Automate user registration and membership timing updates
  for (const normName of Object.keys(userDates)) {
    const dates = userDates[normName];
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: { name: { equals: normName, mode: 'insensitive' } }
    });

    if (!user) {
      const emailBase = normName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${emailBase}@example.com`;
      const emailExists = await prisma.user.findUnique({ where: { email } });
      const finalEmail = emailExists ? `${emailBase}${Date.now()}@example.com` : email;

      const passwordHash = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: { name: normName, email: finalEmail, passwordHash }
      });
    }

    // Determine joinedAt and leftAt
    let joinedAt = new Date(dates.earliest.getTime() - 24 * 60 * 60 * 1000);
    let leftAt = null;

    if (normName.toLowerCase() === 'meera') {
      leftAt = new Date('2026-03-29'); // 1 day after farewell dinner on 2026-03-28
    }

    // Check membership
    const membership = await prisma.groupMembership.findFirst({
      where: { groupId, userId: user.id }
    });

    if (!membership) {
      await prisma.groupMembership.create({
        data: { groupId, userId: user.id, joinedAt, leftAt }
      });
    } else {
      // Overwrite membership dates to reflect import data
      await prisma.groupMembership.update({
        where: { id: membership.id },
        data: { joinedAt, leftAt }
      });
    }
  }

  // 3. Fetch all memberships (active or past) for this group
  const allMemberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: true }
  });

  // Re-fetch all users and build fast lookup map
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true },
  });
  const userMap = new Map();
  for (const u of allUsers) {
    userMap.set(u.name.toLowerCase().trim(), u);
  }

  // Create import batch
  const batch = await prisma.importBatch.create({
    data: { 
      filename: req.file.originalname, 
      createdBy: req.user.id,
      normalizations: normalizationsLog
    },
  });

  const cleanRows = [];
  const anomalyInserts = [];

  rows.forEach((row) => {
    const flags = runDetectors(row, rows);

    // Local validation for unknown payer (should always succeed now for group members)
    if (row.paid_by && row.paid_by.trim() !== '') {
      const normalizedPayer = normalizeName(row.paid_by);
      const paidByUser = userMap.get(normalizedPayer.toLowerCase());
      
      if (!paidByUser) {
        flags.push({
          detector: 'unknown_payer',
          suggestedAction: `Reject or match: user "${row.paid_by}" does not exist in the database.`,
        });
      } else {
        const isMember = allMemberships.some(m => m.userId === paidByUser.id);
        if (!isMember) {
          flags.push({
            detector: 'unknown_payer',
            suggestedAction: `Reject or match: user "${row.paid_by}" is not a member of this group.`,
          });
        }
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
  });

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

      // Determine who is included in the split on this specific date
      let splitUserIds = [];

      if (row.split_with && row.split_with.trim()) {
        const rawSplitNames = row.split_with.split(';').map(n => n.trim());
        const activeIds = [];

        rawSplitNames.forEach(name => {
          if (!name) return;
          const normName = normalizeName(name);
          if (normName.toLowerCase() === "dev's friend kabir") {
            // Option B: Exclude Kabir
            return;
          }

          const u = userMap.get(normName.toLowerCase());
          if (u) {
            // Check if user was an active member on the expense date
            const membership = allMemberships.find(m => m.userId === u.id);
            if (membership) {
              const joined = new Date(membership.joinedAt);
              const left = membership.leftAt ? new Date(membership.leftAt) : null;
              
              if (joined <= parsedDt && (!left || left > parsedDt)) {
                activeIds.push(u.id);
              }
            }
          }
        });
        splitUserIds = activeIds;
      } else {
        // Default: split among all active group members on this date
        splitUserIds = allMemberships
          .filter(m => {
            const joined = new Date(m.joinedAt);
            const left = m.leftAt ? new Date(m.leftAt) : null;
            return joined <= parsedDt && (!left || left > parsedDt);
          })
          .map(m => m.userId);
      }

      if (splitUserIds.length === 0) {
        throw new Error('Group has no active members to split with on this date.');
      }

      const splits = computeSplits('EQUAL', amountInInr, {
        userIds: splitUserIds,
      });

      const normalizedPayer = normalizeName(row.paid_by);
      const paidByUser = userMap.get(normalizedPayer.toLowerCase());
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
    normalizations: normalizationsLog
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
    normalizations: batch.normalizations || []
  });
});

module.exports = { uploadCSV, getImportReport };
