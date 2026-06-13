const { PrismaClient } = require('@prisma/client');

// Re-use a single Prisma instance across the entire app
const prisma = new PrismaClient();

module.exports = prisma;
