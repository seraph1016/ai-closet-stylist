/**
 * FeedbackService 단위 테스트
 *
 * Prisma Client를 모킹하여 피드백 서비스 계층의 비즈니스 로직을 검증한다.
 * - 피드백 저장 (신규 생성 및 덮어쓰기)
 * - 코디 히스토리 조회 (최신순, 최대 50개, 피드백 상태 포함)
 * - 특정 코디 피드백 조회
 * - 피드백 보정값 계산 (scoring 모듈 연동)
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma 모킹
vi.mock('@/lib/prisma', () => ({
  prisma: {
    feedback: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    outfit: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  saveFeedback,
  getOutfitHistory,
  getFeedbackForOutfit,
  getFeedbackBonusForScoring,
} from '@/services/feedback.service';

// 모킹된 prisma 타입 캐스팅
const mockUpsert = prisma.feedback.upsert as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.feedback.findUnique as ReturnType<typeof vi.fn>;
const mockOutfitFindMany = (prisma as any).outfit.findMany as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FeedbackService', () => {
  // ─── saveFeedback 테스트 ───────────────────────────────────

  describe('saveFeedback', () => {
    it('새로운 피드백 → upsert로 생성하고 피드백 레코드를 반환한다', async () => {
      const now = new Date();
      mockUpsert.mockResolvedValue({
        id: 'fb-1',
        outfitId: 'outfit-1',
        type: 'like',
        createdAt: now,
        updatedAt: now,
      });

      const result = await saveFeedback('outfit-1', 'like');

      expect(result.id).toBe('fb-1');
      expect(result.outfitId).toBe('outfit-1');
      expect(result.type).toBe('like');
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { outfitId: 'outfit-1' },
        update: { type: 'like' },
        create: { outfitId: 'outfit-1', type: 'like' },
      });
    });

    it('기존 피드백 덮어쓰기 → upsert로 업데이트하고 새 피드백을 반환한다', async () => {
      const now = new Date();
      mockUpsert.mockResolvedValue({
        id: 'fb-2',
        outfitId: 'outfit-2',
        type: 'dislike',
        createdAt: now,
        updatedAt: now,
      });

      const result = await saveFeedback('outfit-2', 'dislike');

      expect(result.type).toBe('dislike');
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { outfitId: 'outfit-2' },
        update: { type: 'dislike' },
        create: { outfitId: 'outfit-2', type: 'dislike' },
      });
    });
  });

  // ─── getOutfitHistory 테스트 ───────────────────────────────

  describe('getOutfitHistory', () => {
    it('기본 호출 → 최신순 최대 50개 코디 + 피드백 상태를 반환한다', async () => {
      const now = new Date();
      mockOutfitFindMany.mockResolvedValue([
        {
          id: 'outfit-1',
          occasion: '출근',
          weather: 'sunny',
          preferredStyle: 'formal',
          totalScore: 85.5,
          explanation: '깔끔한 출근 코디',
          createdAt: now,
          items: [
            {
              role: 'top',
              clothing: {
                id: 'cloth-1',
                imageUrl: null,
                category: 'top',
                color: 'white',
                seasons: '["spring","summer"]',
                styleTags: '["formal","minimal"]',
                memo: null,
                wearCount: 3,
                createdAt: now,
                updatedAt: now,
              },
            },
          ],
          feedback: { type: 'like' },
        },
      ]);

      const result = await getOutfitHistory();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('outfit-1');
      expect(result[0].occasion).toBe('출근');
      expect(result[0].totalScore).toBe(85.5);
      expect(result[0].items[0].role).toBe('top');
      expect(result[0].items[0].clothing.color).toBe('white');
      expect(result[0].items[0].clothing.seasons).toEqual(['spring', 'summer']);
      expect(result[0].feedback).toEqual({ type: 'like' });

      // Prisma가 올바른 인자로 호출되었는지 확인
      expect(mockOutfitFindMany).toHaveBeenCalledWith({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { clothing: true } },
          feedback: true,
        },
      });
    });

    it('limit 지정 → 지정된 개수만큼만 조회한다', async () => {
      mockOutfitFindMany.mockResolvedValue([]);

      await getOutfitHistory(10);

      expect(mockOutfitFindMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { clothing: true } },
          feedback: true,
        },
      });
    });

    it('피드백 없는 코디 → feedback: null을 반환한다', async () => {
      const now = new Date();
      mockOutfitFindMany.mockResolvedValue([
        {
          id: 'outfit-no-fb',
          occasion: '캐주얼',
          weather: 'hot',
          preferredStyle: 'casual',
          totalScore: 70.0,
          explanation: '편한 외출 코디',
          createdAt: now,
          items: [],
          feedback: null,
        },
      ]);

      const result = await getOutfitHistory();

      expect(result[0].feedback).toBeNull();
    });
  });

  // ─── getFeedbackForOutfit 테스트 ───────────────────────────

  describe('getFeedbackForOutfit', () => {
    it('피드백이 존재하면 → 피드백 레코드를 반환한다', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'fb-exist',
        outfitId: 'outfit-x',
        type: 'dislike',
        createdAt: now,
        updatedAt: now,
      });

      const result = await getFeedbackForOutfit('outfit-x');

      expect(result).not.toBeNull();
      expect(result!.outfitId).toBe('outfit-x');
      expect(result!.type).toBe('dislike');
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { outfitId: 'outfit-x' },
      });
    });

    it('피드백이 없으면 → null을 반환한다', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getFeedbackForOutfit('outfit-none');

      expect(result).toBeNull();
    });
  });

  // ─── getFeedbackBonusForScoring 테스트 ─────────────────────

  describe('getFeedbackBonusForScoring', () => {
    it('like 피드백 → +1 보정값을 반환한다', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'fb-like',
        outfitId: 'outfit-like',
        type: 'like',
        createdAt: now,
        updatedAt: now,
      });

      const result = await getFeedbackBonusForScoring('outfit-like');

      expect(result).toBe(1);
    });

    it('dislike 피드백 → -1 보정값을 반환한다', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'fb-dislike',
        outfitId: 'outfit-dislike',
        type: 'dislike',
        createdAt: now,
        updatedAt: now,
      });

      const result = await getFeedbackBonusForScoring('outfit-dislike');

      expect(result).toBe(-1);
    });

    it('피드백 없음 → 0 보정값을 반환한다', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getFeedbackBonusForScoring('outfit-no-fb');

      expect(result).toBe(0);
    });
  });
});
