const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:", users);

  const groups = await prisma.group.findMany();
  console.log("Groups in DB:", groups);

  const memberships = await prisma.groupMembership.findMany({
    include: {
      user: { select: { name: true } },
      group: { select: { name: true } }
    }
  });
  console.log("Memberships in DB:", memberships.map(m => ({
    group: m.group.name,
    user: m.user.name,
    joinedAt: m.joinedAt,
    leftAt: m.leftAt
  })));

  const expenses = await prisma.expense.findMany();
  console.log("Expenses count in DB:", expenses.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
