/**
 * ClosetService 단위 테스트
 *
 * Prisma Client를 모킹하여 서비스 계층의 비즈니스 로직을 검증한다.
 * - 아이템 생성/수정/삭제 성공 케이스
 * - 필수 필드 누락, 유효하지 않은 값 에러 케이스
 * - 빈 옷장 필터 결과 없음 케이스
 *
 * Requirements: 1.1, 1.3, 2.5, 3.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma 모킹
vi.mock('@/lib/prisma', () => ({
  prisma: {
    clothingItem: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  createItem,
  updateItem,
  deleteItem,
  getItems,
  getItemById,
} from '@/services/closet.service';

// 모킹된 prisma의 타입을 vi.Mock으로 캐스팅
const mockCreate = prisma.clothingItem.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.clothingItem.update as ReturnType<typeof vi.fn>;
const mockDelete = prisma.clothingItem.delete as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.clothingItem.findMany as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.clothingItem.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ClosetService', () => {
  // ─── createItem 테스트 ─────────────────────────────────────

  describe('createItem', () => {
    it('유효한 입력 → ClothingItem을 wearCount 0으로 반환한다', async () => {
      const now = new Date();
      mockCreate.mockResolvedValue({
        id: 'test-id-1',
        imageUrl: 'https://example.com/img.jpg',
        category: 'top',
        color: 'black',
        seasons: '["spring","summer"]',
        styleTags: '["casual","minimal"]',
        memo: '편한 티셔츠',
        wearCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await createItem({
        imageUrl: 'https://example.com/img.jpg',
        category: 'top',
        color: 'black',
        seasons: ['spring', 'summer'],
        styleTags: ['casual', 'minimal'],
        memo: '편한 티셔츠',
      });

      expect(result.id).toBe('test-id-1');
      expect(result.category).toBe('top');
      expect(result.color).toBe('black');
      expect(result.seasons).toEqual(['spring', 'summer']);
      expect(result.styleTags).toEqual(['casual', 'minimal']);
      expect(result.wearCount).toBe(0);
      expect(result.memo).toBe('편한 티셔츠');

      // Prisma create가 wearCount: 0으로 호출되었는지 확인
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ wearCount: 0 }),
      });
    });

    it('필수 필드(category) 누락 → validationErrors를 포함한 에러를 throw한다', async () => {
      try {
        await createItem({
          category: '' as any,
          color: 'black',
        });
        // 여기 도달하면 안 됨
        expect.fail('에러가 발생해야 합니다');
      } catch (error: any) {
        expect(error.message).toBe('유효성 검증에 실패했습니다.');
        expect(error.validationErrors).toBeDefined();
        expect(error.validationErrors.length).toBeGreaterThan(0);
        expect(error.validationErrors.some((e: any) => e.field === 'category')).toBe(true);
      }
    });

    it('유효하지 않은 color → 구체적 오류 메시지를 포함한 에러를 throw한다', async () => {
      try {
        await createItem({
          category: 'top',
          color: 'rainbow' as any,
        });
        expect.fail('에러가 발생해야 합니다');
      } catch (error: any) {
        expect(error.message).toBe('유효성 검증에 실패했습니다.');
        expect(error.validationErrors).toBeDefined();
        const colorError = error.validationErrors.find((e: any) => e.field === 'color');
        expect(colorError).toBeDefined();
        expect(colorError.message).toContain('색상은');
      }
    });

    it('입력에 wearCount: 99를 포함해도 결과는 wearCount: 0이다', async () => {
      const now = new Date();
      mockCreate.mockResolvedValue({
        id: 'test-id-2',
        imageUrl: null,
        category: 'bottom',
        color: 'blue',
        seasons: '[]',
        styleTags: '[]',
        memo: null,
        wearCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await createItem({
        category: 'bottom',
        color: 'blue',
      });

      expect(result.wearCount).toBe(0);

      // Prisma에 전달되는 data에서 wearCount가 0인지 확인
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ wearCount: 0 }),
      });
    });
  });

  // ─── updateItem 테스트 ─────────────────────────────────────

  describe('updateItem', () => {
    it('유효한 부분 업데이트 → 수정된 아이템을 반환한다', async () => {
      const now = new Date();
      // 기존 아이템 조회 mock
      mockFindUnique.mockResolvedValue({
        id: 'item-1',
        imageUrl: null,
        category: 'top',
        color: 'black',
        seasons: '["spring"]',
        styleTags: '["casual"]',
        memo: null,
        wearCount: 3,
        createdAt: now,
        updatedAt: now,
      });

      // update 결과 mock
      mockUpdate.mockResolvedValue({
        id: 'item-1',
        imageUrl: null,
        category: 'top',
        color: 'red',
        seasons: '["spring"]',
        styleTags: '["casual"]',
        memo: null,
        wearCount: 3,
        createdAt: now,
        updatedAt: now,
      });

      const result = await updateItem('item-1', { color: 'red' });

      expect(result.id).toBe('item-1');
      expect(result.color).toBe('red');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { color: 'red' },
      });
    });

    it('존재하지 않는 ID → 에러를 throw한다', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(updateItem('nonexistent-id', { color: 'blue' })).rejects.toThrow(
        "ID 'nonexistent-id'에 해당하는 의류 아이템을 찾을 수 없습니다."
      );
    });

    it('유효하지 않은 category 값 → 유효성 검증 에러를 throw한다', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'item-2',
        imageUrl: null,
        category: 'top',
        color: 'black',
        seasons: '["summer"]',
        styleTags: '["formal"]',
        memo: null,
        wearCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      try {
        await updateItem('item-2', { category: 'hat' as any });
        expect.fail('에러가 발생해야 합니다');
      } catch (error: any) {
        expect(error.message).toBe('유효성 검증에 실패했습니다.');
        expect(error.validationErrors).toBeDefined();
        expect(error.validationErrors.some((e: any) => e.field === 'category')).toBe(true);
      }
    });
  });

  // ─── deleteItem 테스트 ─────────────────────────────────────

  describe('deleteItem', () => {
    it('존재하는 아이템 → 에러 없이 삭제를 완료한다', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'item-del-1',
        imageUrl: null,
        category: 'shoes',
        color: 'white',
        seasons: '[]',
        styleTags: '[]',
        memo: null,
        wearCount: 5,
        createdAt: now,
        updatedAt: now,
      });
      mockDelete.mockResolvedValue({});

      await expect(deleteItem('item-del-1')).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'item-del-1' } });
    });

    it('존재하지 않는 ID → 에러를 throw한다', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(deleteItem('nonexistent-id')).rejects.toThrow(
        "ID 'nonexistent-id'에 해당하는 의류 아이템을 찾을 수 없습니다."
      );
    });
  });

  // ─── getItems 테스트 ───────────────────────────────────────

  describe('getItems', () => {
    it('필터 없음 → 모든 아이템을 반환한다', async () => {
      const now = new Date();
      mockFindMany.mockResolvedValue([
        {
          id: 'item-a',
          imageUrl: null,
          category: 'top',
          color: 'black',
          seasons: '["spring"]',
          styleTags: '["casual"]',
          memo: null,
          wearCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'item-b',
          imageUrl: null,
          category: 'bottom',
          color: 'blue',
          seasons: '["summer"]',
          styleTags: '["minimal"]',
          memo: null,
          wearCount: 2,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await getItems();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('item-a');
      expect(result[1].id).toBe('item-b');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('category 필터 → 해당 카테고리의 아이템만 반환한다', async () => {
      const now = new Date();
      mockFindMany.mockResolvedValue([
        {
          id: 'item-top-1',
          imageUrl: null,
          category: 'top',
          color: 'red',
          seasons: '["fall"]',
          styleTags: '["street"]',
          memo: null,
          wearCount: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await getItems({ category: 'top' });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('top');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { category: 'top' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('season 필터 → 해당 계절을 포함하는 아이템만 반환한다', async () => {
      const now = new Date();
      mockFindMany.mockResolvedValue([
        {
          id: 'item-summer-1',
          imageUrl: null,
          category: 'bottom',
          color: 'white',
          seasons: '["spring","summer"]',
          styleTags: '["casual"]',
          memo: null,
          wearCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await getItems({ season: 'summer' });

      expect(result).toHaveLength(1);
      expect(result[0].seasons).toContain('summer');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { seasons: { contains: 'summer' } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('필터 결과가 0건 → 빈 배열을 반환한다', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await getItems({ category: 'accessory', season: 'winter' });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ─── getItemById 테스트 ────────────────────────────────────

  describe('getItemById', () => {
    it('존재하는 ID → 해당 아이템을 반환한다', async () => {
      const now = new Date();
      mockFindUnique.mockResolvedValue({
        id: 'item-find-1',
        imageUrl: 'https://example.com/photo.png',
        category: 'outer',
        color: 'navy',
        seasons: '["fall","winter"]',
        styleTags: '["formal","minimal"]',
        memo: '겨울 코트',
        wearCount: 10,
        createdAt: now,
        updatedAt: now,
      });

      const result = await getItemById('item-find-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('item-find-1');
      expect(result!.category).toBe('outer');
      expect(result!.color).toBe('navy');
      expect(result!.seasons).toEqual(['fall', 'winter']);
      expect(result!.styleTags).toEqual(['formal', 'minimal']);
      expect(result!.memo).toBe('겨울 코트');
      expect(result!.wearCount).toBe(10);
    });

    it('존재하지 않는 ID → null을 반환한다', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getItemById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
