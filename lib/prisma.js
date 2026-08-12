import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy(
  {},
  {
    get(target, prop) {
      return getPrismaClient()[prop];
    },
  }
);