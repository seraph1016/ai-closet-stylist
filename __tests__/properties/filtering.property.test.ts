/**
 * AI 옷장 스타일 추천 웹사이트 - 필터링 프로퍼티 테스트
 *
 * Property 5: 필터링 정확성
 *
 * Validates: Requirements 2.2, 2.3, 2.4
 *
 * ClosetService는 Prisma(DB)를 사용하므로, 필터링 로직만 추출한
 * 순수 함수(filterItems)를 테스트한다. 이 함수는 DB 쿼리가 수행하는
 * 필터링과 동일한 AND 논리를 구현한다.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Category, ClothingFilter, ClothingItem, Color, Season, StyleTag } from '@/types';
import { CATEGORIES, COLORS, SEASONS, STYLE_TAGS } from '@/lib/constants';

// ─── 순수 필터 함수 (DB 쿼리 로직 미러링) ─────────────────────────

/**
 * 의류 아이템 목록을 필터 조건에 따라 필터링하는 순수 함수.
 * ClosetService.getItems()가 DB에서 수행하는 필터링 로직을 순수하게 구현한다.
 *
 * 필터 조건:
 * - category가 지정된 경우: item.category === filter.category
 * - season이 지정된 경우: item.seasons가 filter.season을 포함
 * - 두 조건 모두 지정된 경우: AND 로직 (두 조건 모두 만족해야 함)
 * - 필터가 없거나 빈 필터인 경우: 전체 목록 반환
 *
 * @param items - 의류 아이템 목록
 * @param filter - 필터 조건 (카테고리, 계절 선택적)
 * @returns 필터 조건에 맞는 의류 아이템 배열
 */
function filterItems(items: ClothingItem[], filter?: ClothingFilter): ClothingItem[] {
  if (!filter) {
    return items;
  }

  return items.filter((item) => {
    // 카테고리 필터: 지정된 경우 일치해야 함
    if (filter.category && item.category !== filter.category) {
      return false;
    }

    // 계절 필터: 지정된 경우 아이템의 seasons 배열에 포함되어야 함
    if (filter.season && !item.seasons.includes(filter.season)) {
      return false;
    }

    return true;
  });
}

// ─── fast-check 제너레이터 ───────────────────────────────────────

/** ClothingItem 임의 생성기 */
const clothingItemArb: fc.Arbitrary<ClothingItem> = fc.record({
  id: fc.uuid(),
  imageUrl: fc.oneof(fc.constant(null), fc.webUrl()),
  category: fc.constantFrom(...CATEGORIES),
  color: fc.constantFrom(...COLORS),
  seasons: fc.subarray([...SEASONS], { minLength: 1 }),
  styleTags: fc.subarray([...STYLE_TAGS], { minLength: 1, maxLength: 4 }),
  memo: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
  wearCount: fc.nat({ max: 100 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

/** ClothingFilter 임의 생성기 (카테고리, 계절 각각 선택적) */
const clothingFilterArb: fc.Arbitrary<ClothingFilter> = fc.record({
  category: fc.option(fc.constantFrom(...CATEGORIES), { nil: undefined }),
  season: fc.option(fc.constantFrom(...SEASONS), { nil: undefined }),
});

// ─── Property 5: 필터링 정확성 ──────────────────────────────────
// Feature: ai-closet-stylist, Property 5: 필터링 정확성
// **Validates: Requirements 2.2, 2.3, 2.4**

describe('Property 5: 필터링 정확성', () => {
  it('필터링 결과는 모든 필터 조건을 만족하는 아이템만 포함해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        clothingFilterArb,
        (items, filter) => {
          const result = filterItems(items, filter);

          // 결과의 모든 아이템이 필터 조건을 만족하는지 검증
          for (const item of result) {
            if (filter.category) {
              expect(item.category).toBe(filter.category);
            }
            if (filter.season) {
              expect(item.seasons).toContain(filter.season);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('필터 조건을 만족하지 않는 아이템은 결과에 포함되지 않아야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        clothingFilterArb,
        (items, filter) => {
          const result = filterItems(items, filter);
          const resultIds = new Set(result.map((item) => item.id));

          // 결과에 포함되지 않은 아이템은 최소 하나의 필터 조건을 만족하지 않아야 함
          for (const item of items) {
            if (!resultIds.has(item.id)) {
              const matchesCategory = !filter.category || item.category === filter.category;
              const matchesSeason = !filter.season || item.seasons.includes(filter.season);

              // 제외된 아이템은 적어도 하나의 조건을 불만족해야 한다
              expect(matchesCategory && matchesSeason).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('필터 결과는 조건을 만족하는 모든 아이템을 빠짐없이 포함해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        clothingFilterArb,
        (items, filter) => {
          const result = filterItems(items, filter);
          const resultIds = new Set(result.map((item) => item.id));

          // 모든 조건을 만족하는 원본 아이템은 반드시 결과에 포함되어야 함
          for (const item of items) {
            const matchesCategory = !filter.category || item.category === filter.category;
            const matchesSeason = !filter.season || item.seasons.includes(filter.season);

            if (matchesCategory && matchesSeason) {
              expect(resultIds.has(item.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('필터가 없으면 전체 목록을 반환해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const resultNoFilter = filterItems(items, undefined);
          const resultEmptyFilter = filterItems(items, {});

          // 필터 없이 호출 시 모든 아이템 반환
          expect(resultNoFilter).toHaveLength(items.length);
          // 빈 필터로 호출 시에도 모든 아이템 반환
          expect(resultEmptyFilter).toHaveLength(items.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('카테고리만 필터링 시 해당 카테고리 아이템만 반환해야 한다 (Req 2.2)', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...CATEGORIES),
        (items, category) => {
          const filter: ClothingFilter = { category };
          const result = filterItems(items, filter);

          // 결과의 모든 아이템이 지정된 카테고리여야 함
          for (const item of result) {
            expect(item.category).toBe(category);
          }

          // 해당 카테고리인 원본 아이템 수와 결과 수가 같아야 함
          const expected = items.filter((item) => item.category === category);
          expect(result).toHaveLength(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('계절만 필터링 시 해당 계절 태그가 포함된 아이템만 반환해야 한다 (Req 2.3)', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...SEASONS),
        (items, season) => {
          const filter: ClothingFilter = { season };
          const result = filterItems(items, filter);

          // 결과의 모든 아이템이 지정된 계절 태그를 포함해야 함
          for (const item of result) {
            expect(item.seasons).toContain(season);
          }

          // 해당 계절 태그가 포함된 원본 아이템 수와 결과 수가 같아야 함
          const expected = items.filter((item) => item.seasons.includes(season));
          expect(result).toHaveLength(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('카테고리 + 계절 동시 필터링 시 AND 조건으로 동작해야 한다 (Req 2.4)', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 30 }),
        fc.constantFrom(...CATEGORIES),
        fc.constantFrom(...SEASONS),
        (items, category, season) => {
          const filter: ClothingFilter = { category, season };
          const result = filterItems(items, filter);

          // 결과의 모든 아이템이 두 조건을 동시에 만족해야 함
          for (const item of result) {
            expect(item.category).toBe(category);
            expect(item.seasons).toContain(season);
          }

          // 두 조건을 모두 만족하는 원본 아이템 수와 결과 수가 같아야 함
          const expected = items.filter(
            (item) => item.category === category && item.seasons.includes(season)
          );
          expect(result).toHaveLength(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
