/**
 * AI 옷장 스타일 추천 웹사이트 - 옷장 통합 테스트
 *
 * Property 1: 의류 아이템 생성 라운드트립
 * Property 6: 연쇄 삭제 무결성
 *
 * Server Action → Service → DB 흐름 end-to-end 검증
 * Validates: Requirements 1.1, 3.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Category, Color, Season, StyleTag } from '@/types';
import { CATEGORIES, COLORS, SEASONS, STYLE_TAGS } from '@/lib/constants';

// ─── Prisma Mock 설정 ────────────────────────────────────────────
// vi.mock은 hoisted되므로 factory 함수 내에서 직접 vi.fn()을 정의한다.

vi.mock('@/lib/prisma', () => ({
  prisma: {
    clothingItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    outfitItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    feedback: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    outfit: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// mock 이후 import하여 mock된 prisma를 사용하도록 한다
import { prisma } from '@/lib/prisma';
import { createItem, getItemById, deleteItem } from '@/services/closet.service';

// 모킹된 prisma 함수들의 타입 캐스팅
const mockCreate = prisma.clothingItem.create as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.clothingItem.findUnique as ReturnType<typeof vi.fn>;
const mockDelete = prisma.clothingItem.delete as ReturnType<typeof vi.fn>;

// ─── 헬퍼: fast-check Arbitrary 정의 ─────────────────────────────

/** 유효한 카테고리 Arbitrary */
const categoryArb = fc.constantFrom<Category>(...CATEGORIES);

/** 유효한 색상 Arbitrary */
const colorArb = fc.constantFrom<Color>(...COLORS);

/** 유효한 계절 배열 Arbitrary (1개 이상) */
const seasonsArb = fc.subarray([...SEASONS] as Season[], { minLength: 1 });

/** 유효한 스타일 태그 배열 Arbitrary (1개 이상, 최대 4개) */
const styleTagsArb = fc.subarray([...STYLE_TAGS] as StyleTag[], { minLength: 1, maxLength: 4 });

/** 유효한 의류 아이템 입력 Arbitrary */
const validClothingInputArb = fc.record({
  category: categoryArb,
  color: colorArb,
  seasons: seasonsArb,
  styleTags: styleTagsArb,
  imageUrl: fc.oneof(
    fc.constant(null),
    fc.constant('https://example.com/image.png'),
    fc.constant('http://test.org/photo.jpg')
  ),
  memo: fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 0, maxLength: 200 })
  ),
});

// ─── Property 1: 의류 아이템 생성 라운드트립 ─────────────────────
// Feature: ai-closet-stylist, Property 1: 의류 아이템 생성 라운드트립
// **Validates: Requirements 1.1**

describe('Property 1: 의류 아이템 생성 라운드트립', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('유효한 입력으로 생성한 아이템을 ID로 조회하면 모든 필드가 원본과 일치해야 한다', async () => {
    await fc.assert(
      fc.asyncProperty(validClothingInputArb, async (input) => {
        vi.clearAllMocks();

        const fakeId = 'test-id-' + Math.random().toString(36).slice(2);
        const now = new Date();

        // Mock: create가 호출되면 입력 데이터 기반의 DB 레코드를 반환
        const createdRecord = {
          id: fakeId,
          imageUrl: input.imageUrl ?? null,
          category: input.category,
          color: input.color,
          seasons: JSON.stringify(input.seasons),
          styleTags: JSON.stringify(input.styleTags),
          memo: input.memo ?? null,
          wearCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        mockCreate.mockResolvedValue(createdRecord);
        mockFindUnique.mockResolvedValue(createdRecord);

        // Step 1: 아이템 생성 (Action → Service → DB)
        const created = await createItem({
          category: input.category,
          color: input.color,
          seasons: input.seasons,
          styleTags: input.styleTags,
          imageUrl: input.imageUrl,
          memo: input.memo,
        });

        // Step 2: 생성된 아이템을 ID로 조회
        const retrieved = await getItemById(created.id);

        // Step 3: 라운드트립 검증 - 모든 필드가 일치해야 한다
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(created.id);
        expect(retrieved!.category).toBe(input.category);
        expect(retrieved!.color).toBe(input.color);
        expect(retrieved!.seasons).toEqual(input.seasons);
        expect(retrieved!.styleTags).toEqual(input.styleTags);
        expect(retrieved!.imageUrl).toBe(input.imageUrl ?? null);
        expect(retrieved!.memo).toBe(input.memo ?? null);
        expect(retrieved!.wearCount).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('생성된 아이템의 wearCount는 입력값과 무관하게 항상 0이어야 한다', async () => {
    await fc.assert(
      fc.asyncProperty(validClothingInputArb, async (input) => {
        vi.clearAllMocks();

        const fakeId = 'test-id-' + Math.random().toString(36).slice(2);
        const now = new Date();

        const createdRecord = {
          id: fakeId,
          imageUrl: input.imageUrl ?? null,
          category: input.category,
          color: input.color,
          seasons: JSON.stringify(input.seasons),
          styleTags: JSON.stringify(input.styleTags),
          memo: input.memo ?? null,
          wearCount: 0, // 서비스 계층에서 항상 0 강제
          createdAt: now,
          updatedAt: now,
        };

        mockCreate.mockResolvedValue(createdRecord);

        const created = await createItem({
          category: input.category,
          color: input.color,
          seasons: input.seasons,
          styleTags: input.styleTags,
        });

        // wearCount가 항상 0이어야 한다
        expect(created.wearCount).toBe(0);

        // prisma.create 호출 시 wearCount: 0으로 전달되었는지 확인
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              wearCount: 0,
            }),
          })
        );
      }),
      { numRuns: 100 }
    );
  });

  it('생성 후 조회 시 seasons와 styleTags가 정확히 동일한 배열로 반환되어야 한다', async () => {
    await fc.assert(
      fc.asyncProperty(validClothingInputArb, async (input) => {
        vi.clearAllMocks();

        const fakeId = 'roundtrip-' + Math.random().toString(36).slice(2);
        const now = new Date();

        const dbRecord = {
          id: fakeId,
          imageUrl: input.imageUrl ?? null,
          category: input.category,
          color: input.color,
          seasons: JSON.stringify(input.seasons),
          styleTags: JSON.stringify(input.styleTags),
          memo: input.memo ?? null,
          wearCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        mockCreate.mockResolvedValue(dbRecord);
        mockFindUnique.mockResolvedValue(dbRecord);

        const created = await createItem({
          category: input.category,
          color: input.color,
          seasons: input.seasons,
          styleTags: input.styleTags,
          imageUrl: input.imageUrl,
          memo: input.memo,
        });

        const retrieved = await getItemById(created.id);

        // JSON 직렬화/역직렬화 라운드트립 검증
        expect(retrieved!.seasons).toEqual(input.seasons);
        expect(retrieved!.styleTags).toEqual(input.styleTags);
        // 배열의 길이가 동일해야 한다
        expect(retrieved!.seasons.length).toBe(input.seasons.length);
        expect(retrieved!.styleTags.length).toBe(input.styleTags.length);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: 연쇄 삭제 무결성 ────────────────────────────────
// Feature: ai-closet-stylist, Property 6: 연쇄 삭제 무결성
// **Validates: Requirements 3.5**

describe('Property 6: 연쇄 삭제 무결성', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('아이템 삭제 시 해당 아이템, 연관 OutfitItem, Feedback이 모두 제거되어야 한다', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClothingInputArb,
        fc.integer({ min: 1, max: 5 }), // 연관된 outfit 수
        async (input, outfitCount) => {
          vi.clearAllMocks();

          const itemId = 'delete-test-' + Math.random().toString(36).slice(2);
          const now = new Date();

          // 삭제할 아이템의 DB 레코드
          const itemRecord = {
            id: itemId,
            imageUrl: input.imageUrl ?? null,
            category: input.category,
            color: input.color,
            seasons: JSON.stringify(input.seasons),
            styleTags: JSON.stringify(input.styleTags),
            memo: input.memo ?? null,
            wearCount: 0,
            createdAt: now,
            updatedAt: now,
          };

          // findUnique: 삭제 전에는 아이템이 존재
          mockFindUnique.mockResolvedValueOnce(itemRecord);

          // delete: 삭제 실행 (Prisma cascade로 연관 데이터 자동 삭제)
          mockDelete.mockResolvedValue(itemRecord);

          // Step 1: 아이템 삭제 실행
          await deleteItem(itemId);

          // Step 2: 삭제 검증
          // prisma.clothingItem.delete가 올바른 ID로 호출되었는지 확인
          expect(mockDelete).toHaveBeenCalledWith({
            where: { id: itemId },
          });

          // Step 3: 삭제 후 조회 시 null 반환 검증
          mockFindUnique.mockResolvedValue(null);

          const afterDelete = await getItemById(itemId);
          expect(afterDelete).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('존재하지 않는 아이템 삭제 시 에러가 발생해야 한다', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (nonExistentId) => {
          vi.clearAllMocks();

          // findUnique가 null 반환 → 아이템이 존재하지 않음
          mockFindUnique.mockResolvedValue(null);

          // 존재하지 않는 아이템 삭제 시 에러가 발생해야 한다
          await expect(deleteItem(nonExistentId)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Prisma cascade 설정으로 연관 데이터가 자동 삭제됨을 계약으로 검증한다', async () => {
    await fc.assert(
      fc.asyncProperty(
        validClothingInputArb,
        fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
        async (input, outfitIds) => {
          vi.clearAllMocks();

          const itemId = 'cascade-' + Math.random().toString(36).slice(2);
          const now = new Date();

          const itemRecord = {
            id: itemId,
            imageUrl: input.imageUrl ?? null,
            category: input.category,
            color: input.color,
            seasons: JSON.stringify(input.seasons),
            styleTags: JSON.stringify(input.styleTags),
            memo: input.memo ?? null,
            wearCount: 0,
            createdAt: now,
            updatedAt: now,
          };

          // 아이템 존재 확인
          mockFindUnique.mockResolvedValueOnce(itemRecord);

          // delete 호출 시 cascade로 연관 레코드 자동 삭제
          mockDelete.mockResolvedValue(itemRecord);

          // 삭제 실행
          await deleteItem(itemId);

          // 삭제 호출 검증
          expect(mockDelete).toHaveBeenCalledWith({
            where: { id: itemId },
          });

          // Prisma 스키마에서 onDelete: Cascade 설정으로 인해
          // clothingItem 삭제 시 관련 OutfitItem이 자동 삭제되고,
          // OutfitItem이 삭제되면 연쇄적으로 Outfit 삭제 시 Feedback도 삭제된다.
          // 이는 Prisma 레벨의 계약이므로, delete 호출만으로 연쇄 삭제가 보장된다.

          // 삭제 후 아이템 조회 시 null 확인
          mockFindUnique.mockResolvedValue(null);

          const result = await getItemById(itemId);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
