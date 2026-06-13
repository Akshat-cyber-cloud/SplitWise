const { parse } = require('csv-parse/sync');
const fs = require('fs');

/**
 * parseCSV(filePath) → Array of plain objects
 * Expected columns (case-insensitive): date, description, amount, currency, paid_by
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = parse(content, {
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

module.exports = { parseCSV };
