/**
 * computeSplits – converts split intent into an array of { userId, shareAmount }
 * that can be directly passed to prisma.expenseSplit.createMany.
 *
 * All amounts are in INR (already converted before this call).
 *
 * splitData shapes:
 *   EQUAL:      { userIds: [1, 2, 3] }
 *   EXACT:      { splits: [{ userId, amount }, ...] }
 *   PERCENTAGE: { splits: [{ userId, percentage }, ...] }   (must sum to 100)
 *   SHARES:     { splits: [{ userId, shares }, ...] }       (ratio-based)
 */
function computeSplits(splitType, totalAmountInr, splitData) {
  const total = Number(totalAmountInr);

  switch (splitType) {
    case 'EQUAL': {
      const { userIds } = splitData;
      if (!userIds?.length) throw new Error('EQUAL split requires userIds array');
      const base      = Math.floor((total / userIds.length) * 100) / 100; // round down to paisa
      const remainder = Math.round((total - base * userIds.length) * 100) / 100;
      // Remainder goes to the first user (the payer). Document this in DECISIONS.md.
      return userIds.map((userId, i) => ({
        userId,
        shareAmount: i === 0 ? base + remainder : base,
      }));
    }

    case 'EXACT': {
      const { splits } = splitData;
      const sum = splits.reduce((s, r) => s + Number(r.amount), 0);
      if (Math.abs(sum - total) > 0.01)
        throw new Error(`EXACT splits sum (${sum}) doesn't match total (${total})`);
      return splits.map(({ userId, amount }) => ({ userId, shareAmount: Number(amount) }));
    }

    case 'PERCENTAGE': {
      const { splits } = splitData;
      const sumPct = splits.reduce((s, r) => s + Number(r.percentage), 0);
      if (Math.abs(sumPct - 100) > 0.01)
        throw new Error(`Percentages must sum to 100, got ${sumPct}`);
      const result = splits.map(({ userId, percentage }) => ({
        userId,
        shareAmount: Math.floor((total * Number(percentage)) / 100 * 100) / 100,
      }));
      // Fix rounding remainder → first person
      const allocated = result.reduce((s, r) => s + r.shareAmount, 0);
      result[0].shareAmount += Math.round((total - allocated) * 100) / 100;
      return result;
    }

    case 'SHARES': {
      const { splits } = splitData;
      const totalShares = splits.reduce((s, r) => s + Number(r.shares), 0);
      const result = splits.map(({ userId, shares }) => ({
        userId,
        shareAmount: Math.floor((total * Number(shares)) / totalShares * 100) / 100,
      }));
      const allocated = result.reduce((s, r) => s + r.shareAmount, 0);
      result[0].shareAmount += Math.round((total - allocated) * 100) / 100;
      return result;
    }

    default:
      throw new Error(`Unknown splitType: ${splitType}`);
  }
}

module.exports = { computeSplits };
