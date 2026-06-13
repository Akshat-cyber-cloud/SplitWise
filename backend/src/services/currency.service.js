const axios = require('axios');

// Simple in-memory cache so we don't hammer the API for the same date
const rateCache = new Map();

/**
 * getExchangeRate(from, to, date) → number
 *
 * Uses exchangerate.host (free, no key needed for historical rates).
 * Falls back to 1 if the API is unreachable (logs a warning).
 *
 * DECISION: We always store the rate at the date of the expense,
 * never re-fetch it later. See DECISIONS.md.
 */
async function getExchangeRate(from, to, date) {
  const dateStr = typeof date === 'string' ? date.slice(0, 10) : new Date(date).toISOString().slice(0, 10);
  const cacheKey = `${from}_${to}_${dateStr}`;
  if (rateCache.has(cacheKey)) return rateCache.get(cacheKey);

  try {
    const url = `https://api.exchangerate.host/${dateStr}?base=${from}&symbols=${to}`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const rate = data?.rates?.[to];
    if (!rate) throw new Error('Rate not found in response');
    rateCache.set(cacheKey, rate);
    return rate;
  } catch (err) {
    console.warn(`[currency] Could not fetch ${from}→${to} for ${dateStr}: ${err.message}. Falling back to 1.`);
    return 1;
  }
}

module.exports = { getExchangeRate };
