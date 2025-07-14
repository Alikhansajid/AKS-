import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') 
{
    globalForPrisma.prisma = prisma;
}



//iron session
//reomve login page after login 
//redirect to home page if i logged in earlier 

//increase reuseablilty in code 
