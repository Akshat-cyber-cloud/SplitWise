const { parse } = require('csv-parse/sync');
const fs = require('fs');

function parseAmount(amountStr) {
  if (!amountStr) return NaN;
  const clean = String(amountStr).replace(/[^0-9.-]/g, '');
  const val = Number(clean);
  return isNaN(val) ? NaN : val;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  const ymdMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const [_, year, month, day] = ymdMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * parseCSV(filePath) → Array of plain objects
 * Expected columns (case-insensitive): date, description, amount, currency, paid_by
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = parse(content, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false, // keep everything as string; controllers handle coercion
  });
  // Normalise column names to lowercase with underscores
  return records.map((r) => {
    const normalised = {};
    for (const [k, v] of Object.entries(r)) {
      normalised[k.toLowerCase().replace(/\s+/g, '_')] = v;
    }
    return normalised;
  });
}

module.exports = { parseCSV, parseAmount, parseDate };
