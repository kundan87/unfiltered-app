import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const getPrisma = () => {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
};

// Lazy initialization: Build time par Prisma run nahi hoga
export const prisma = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getPrisma();
      return Reflect.get(client, prop);
    },
  }
);