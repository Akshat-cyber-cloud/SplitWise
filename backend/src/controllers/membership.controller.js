const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');

// GET /api/memberships/groups/:groupId/members
const listMembers = asyncHandler(async (req, res) => {
  const members = await prisma.groupMembership.findMany({
    where: { groupId: Number(req.params.groupId) },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  res.json(members);
});

// POST /api/memberships/groups/:groupId/members  { userId, joinedAt? }
const addMember = asyncHandler(async (req, res) => {
  const { userId, joinedAt } = req.body;
  const membership = await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: Number(req.params.groupId), userId: Number(userId) } },
    update: { joinedAt: joinedAt ? new Date(joinedAt) : new Date(), leftAt: null },
    create: {
      groupId: Number(req.params.groupId),
      userId:  Number(userId),
      joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
    },
  });
  res.status(201).json(membership);
});

// DELETE /api/memberships/groups/:groupId/members/:userId  { leftAt? }
const removeMember = asyncHandler(async (req, res) => {
  const { leftAt } = req.body;
  const membership = await prisma.groupMembership.update({
    where: {
      groupId_userId: {
        groupId: Number(req.params.groupId),
        userId:  Number(req.params.userId),
      },
    },
    data: { leftAt: leftAt ? new Date(leftAt) : new Date() },
  });
  res.json(membership);
});

module.exports = { listMembers, addMember, removeMember };
