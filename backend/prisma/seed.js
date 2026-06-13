/**
 * Seed: creates two users, one group, adds both as members,
 * and inserts a sample expense so you can verify balance queries immediately.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  });

  // Group
  const group = await prisma.group.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Goa Trip 2024' },
  });

  // Memberships
  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: alice.id } },
    update: {},
    create: { groupId: group.id, userId: alice.id, joinedAt: new Date('2024-01-01') },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: bob.id } },
    update: {},
    create: { groupId: group.id, userId: bob.id, joinedAt: new Date('2024-01-01') },
  });

  // Sample expense: Alice pays ₹1000 split equally
  const expense = await prisma.expense.create({
    data: {
      groupId: group.id,
      paidById: alice.id,
      amount: 1000,
      currency: 'INR',
      amountInInr: 1000,
      exchangeRate: 1,
      description: 'Hotel booking',
      date: new Date('2024-01-15'),
      splitType: 'EQUAL',
      splits: {
        create: [
          { userId: alice.id, shareAmount: 500 },
          { userId: bob.id,   shareAmount: 500 },
        ],
      },
    },
  });

  // Reset PostgreSQL sequence for group table to avoid unique constraint errors on id
  await prisma.$executeRawUnsafe(`SELECT setval('groups_id_seq', COALESCE((SELECT MAX(id) FROM groups), 1));`);

  console.log('Seed complete:', { alice, bob, group, expense });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
