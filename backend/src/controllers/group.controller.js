const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/asyncHandler');

const createGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const group = await prisma.group.create({ data: { name } });
  // auto-add creator as member
  await prisma.groupMembership.create({
    data: { groupId: group.id, userId: req.user.id, joinedAt: new Date() },
  });
  res.status(201).json(group);
});

const listGroups = asyncHandler(async (req, res) => {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId: req.user.id, leftAt: null },
    include: { group: true },
  });
  res.json(memberships.map((m) => m.group));
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { id: Number(req.params.id) },
    include: { memberships: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

const updateGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const group = await prisma.group.update({
    where: { id: Number(req.params.id) },
    data: { name },
  });
  res.json(group);
});

const deleteGroup = asyncHandler(async (req, res) => {
  await prisma.group.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

module.exports = { createGroup, listGroups, getGroup, updateGroup, deleteGroup };
