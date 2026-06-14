const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');

/**
 * Net balance per person =
 *   SUM(amountInInr where paid_by = userId, expense within membership window)
 * - SUM(share_amount where userId, expense within membership window)
 * - NET(payments sent - payments received)
 *
 * "within membership window" = expense.date >= membership.joined_at
 *   AND (membership.left_at IS NULL OR expense.date < membership.left_at)
 */

// GET /api/balances/groups/:groupId
const groupBalances = asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true } } },
  });

  const balances = await Promise.all(
    memberships.map((m) => _calcBalance(groupId, m.userId, m.joinedAt, m.leftAt))
  );

  res.json(
    memberships.map((m, i) => ({
      user: m.user,
      joinedAt: m.joinedAt,
      leftAt: m.leftAt,
      ...balances[i],
    }))
  );
});

// GET /api/balances/groups/:groupId/members/:userId
const memberBalance = asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const userId  = Number(req.params.userId);

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!membership) return res.status(404).json({ error: 'Membership not found' });

  const balance = await _calcBalance(groupId, userId, membership.joinedAt, membership.leftAt);
  res.json({ user: membership.user, joinedAt: membership.joinedAt, leftAt: membership.leftAt, ...balance });
});

/**
 * Internal: compute balance + traceable rows for one member.
 */
async function _calcBalance(groupId, userId, joinedAt, leftAt) {
  // Build the date window filter for expenses
  const dateFilter = {
    date: {
      gte: joinedAt,
      ...(leftAt ? { lt: leftAt } : {}),
    },
  };

  // Run the 4 database queries in parallel to avoid sequential network RTT overhead
  const [paidRows, splitRows, sentPayments, receivedPayments] = await Promise.all([
    // Amount this user PAID (within window)
    prisma.expense.findMany({
      where: { groupId, paidById: userId, ...dateFilter },
      select: { id: true, description: true, date: true, amountInInr: true },
    }),
    // Amount this user OWES (share, within window)
    prisma.expenseSplit.findMany({
      where: {
        userId,
        expense: { groupId, ...dateFilter },
      },
      include: {
        expense: { select: { id: true, description: true, date: true } },
      },
    }),
    // Payments SENT by this user in the group
    prisma.payment.findMany({
      where: { groupId, fromUserId: userId },
      select: {
        id: true,
        amount: true,
        date: true,
        toUserId: true,
        toUser: { select: { name: true } },
      },
    }),
    // Payments RECEIVED by this user in the group
    prisma.payment.findMany({
      where: { groupId, toUserId: userId },
      select: {
        id: true,
        amount: true,
        date: true,
        fromUserId: true,
        fromUser: { select: { name: true } },
      },
    }),
  ]);

  const totalPaid = paidRows.reduce((s, e) => s + Number(e.amountInInr), 0);
  const totalOwed = splitRows.reduce((s, r) => s + Number(r.shareAmount), 0);
  const totalSent = sentPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalReceived = receivedPayments.reduce((s, p) => s + Number(p.amount), 0);

  // Net = paid - owed + sent - received
  const netBalance = totalPaid - totalOwed + totalSent - totalReceived;

  return {
    netBalance: Math.round(netBalance * 100) / 100,  // round to nearest paisa
    totalPaid,
    totalOwed,
    totalSent,
    totalReceived,
    // Traceable rows (Rohan's requirement)
    breakdown: {
      paidExpenses:   paidRows,
      splitRows:      splitRows,
      sentPayments,
      receivedPayments,
    },
  };
}

// GET /api/balances/dashboard
const dashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find all groups the user belongs to
  const memberships = await prisma.groupMembership.findMany({
    where: { userId, leftAt: null },
    include: {
      group: {
        include: {
          memberships: {
            where: { leftAt: null },
            include: { user: { select: { id: true, name: true, email: true } } }
          }
        }
      }
    }
  });

  const summary = await Promise.all(memberships.map(async (m) => {
    const group = m.group;
    const balance = await _calcBalance(group.id, userId, m.joinedAt, m.leftAt);
    return {
      groupId: group.id,
      groupName: group.name,
      createdAt: group.createdAt,
      memberCount: group.memberships.length,
      members: group.memberships.map(gm => gm.user),
      userBalance: balance.netBalance,
    };
  }));

  // Aggregate totals
  let totalBalance = 0;
  let youAreOwed = 0;
  let youOwe = 0;

  summary.forEach(item => {
    totalBalance += item.userBalance;
    if (item.userBalance > 0) {
      youAreOwed += item.userBalance;
    } else if (item.userBalance < 0) {
      youOwe += Math.abs(item.userBalance);
    }
  });

  res.json({
    totalBalance: Math.round(totalBalance * 100) / 100,
    youAreOwed: Math.round(youAreOwed * 100) / 100,
    youOwe: Math.round(youOwe * 100) / 100,
    groups: summary
  });
});

module.exports = { groupBalances, memberBalance, dashboardSummary };
