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
  const clean = dateStr.trim();
  
  const monthMap = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  
  const m1 = clean.toLowerCase().match(/^([a-z]{3,9})[-/\s](\d{1,2})$/);
  if (m1) {
    const month = monthMap[m1[1].slice(0, 3)];
    const day = m1[2].padStart(2, '0');
    if (month) {
      return new Date(`2026-${String(month).padStart(2, '0')}-${day}`);
    }
  }

  const m2 = clean.toLowerCase().match(/^(\d{1,2})[-/\s]([a-z]{3,9})$/);
  if (m2) {
    const day = m2[1].padStart(2, '0');
    const month = monthMap[m2[2].slice(0, 3)];
    if (month) {
      return new Date(`2026-${String(month).padStart(2, '0')}-${day}`);
    }
  }

  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const [_, year, month, day] = ymdMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  const d = new Date(clean);
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
