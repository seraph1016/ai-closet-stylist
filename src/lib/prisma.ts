/**
 * Prisma Client 싱글톤 인스턴스
 *
 * Next.js 개발 환경에서 Hot Reload 시 Prisma Client가 중복 생성되는 것을 방지한다.
 * 프로덕션 환경에서는 매 요청마다 새 인스턴스를 생성하지 않고 전역 인스턴스를 재사용한다.
 *
 * 향후 Supabase 전환 시 이 파일의 datasource 설정만 변경하면 된다.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
