/**
 * Anomaly detectors for CSV import.
 *
 * Each detector is a function:
 *   (row, allRows) → { detector, suggestedAction } | null
 *
 * runDetectors(row, allRows) → Array of flags (empty = clean row)
 */

// 1. Duplicate detector — same date + amount + description already in this batch
function detectDuplicate(row, allRows) {
  const dupes = allRows.filter(
    (r) =>
      r !== row &&
      r.date === row.date &&
      r.amount === row.amount &&
      r.description?.trim().toLowerCase() === row.description?.trim().toLowerCase()
  );
  if (dupes.length > 0) {
    return {
      detector: 'duplicate',
      suggestedAction: 'Review: identical row found (same date, amount, description). Reject the duplicate.',
    };
  }
  return null;
}

// 2. Negative amount detector
function detectNegativeAmount(row) {
  const amount = Number(row.amount);
  if (!isNaN(amount) && amount < 0) {
    return {
      detector: 'negative_amount',
      suggestedAction:
        'Flag: negative amount. Likely a refund or data entry error. Approve if it cancels a known expense; reject otherwise.',
    };
  }
  return null;
}

// 3. Zero amount detector
function detectZeroAmount(row) {
  const amount = Number(row.amount);
  if (!isNaN(amount) && amount === 0) {
    return {
      detector: 'zero_amount',
      suggestedAction: 'Reject: zero amount expense has no financial effect.',
    };
  }
  return null;
}

// 4. Bad / missing date detector
function detectBadDate(row) {
  if (!row.date) {
    return { detector: 'missing_date', suggestedAction: 'Reject: date column is empty.' };
  }
  const d = new Date(row.date);
  if (isNaN(d.getTime())) {
    return {
      detector: 'bad_date_format',
      suggestedAction: `Reject: "${row.date}" is not a recognisable date. Expected YYYY-MM-DD.`,
    };
  }
  return null;
}

// 5. Unsupported currency detector
const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];
function detectUnsupportedCurrency(row) {
  const currency = (row.currency || 'INR').trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return {
      detector: 'unsupported_currency',
      suggestedAction: `Flag: currency "${currency}" is not in the supported list (${SUPPORTED_CURRENCIES.join(', ')}). Approve to use INR rate of 1, or reject.`,
    };
  }
  return null;
}

// 6. Settlement-disguised-as-expense detector:
//    A 1:1 transfer with a description like "paid back", "settle", "repay" etc.
const SETTLEMENT_KEYWORDS = ['paid back', 'settle', 'repay', 'reimburs', 'transfer', 'returned'];
function detectSettlementAsExpense(row) {
  const desc = (row.description || '').toLowerCase();
  if (SETTLEMENT_KEYWORDS.some((kw) => desc.includes(kw))) {
    return {
      detector: 'settlement_as_expense',
      suggestedAction:
        'Reclassify: description suggests a settlement/reimbursement. Approve to move to payments table.',
    };
  }
  return null;
}

// 7. Missing required fields
function detectMissingFields(row) {
  const required = ['date', 'description', 'amount', 'paid_by'];
  const missing = required.filter((f) => !row[f] || String(row[f]).trim() === '');
  if (missing.length > 0) {
    return {
      detector: 'missing_fields',
      suggestedAction: `Reject: required field(s) missing: ${missing.join(', ')}.`,
    };
  }
  return null;
}

// Registry — order matters (cheap checks first)
const DETECTORS = [
  detectMissingFields,
  detectBadDate,
  detectZeroAmount,
  detectNegativeAmount,
  detectUnsupportedCurrency,
  detectSettlementAsExpense,
  detectDuplicate,
];

function runDetectors(row, allRows) {
  const flags = [];
  for (const detector of DETECTORS) {
    const result = detector(row, allRows);
    if (result) flags.push(result);
  }
  return flags;
}

module.exports = { runDetectors, DETECTORS };
