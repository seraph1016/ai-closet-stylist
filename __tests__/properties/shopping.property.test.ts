/**
 * AI 옷장 스타일 추천 웹사이트 - 쇼핑 분석 프로퍼티 테스트
 *
 * Property 12: 옷장 갭 분석 정확성
 * Property 13: 쇼핑 키워드 출력 완전성
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ClothingItem, Category, Color, WardrobeGap } from '@/types';
import { CATEGORIES, COLORS, SEASONS, STYLE_TAGS } from '@/lib/constants';
import { analyzeWardrobe, generateKeywords, buildSearchUrls } from '@/services/shopping.service';

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

/**
 * WardrobeGap 임의 생성기
 * generateKeywords 테스트를 위해 유효한 gap 객체를 생성한다.
 */
const wardrobeGapArb: fc.Arbitrary<WardrobeGap> = fc.record({
  category: fc.constantFrom(...CATEGORIES),
  color: fc.option(fc.constantFrom(...COLORS), { nil: undefined }),
  style: fc.option(fc.constantFrom(...STYLE_TAGS), { nil: undefined }),
  currentCount: fc.integer({ min: 0, max: 1 }),
});

// ─── Property 12: 옷장 갭 분석 정확성 ──────────────────────────────
// Feature: ai-closet-stylist, Property 12: 옷장 갭 분석 정확성
// **Validates: Requirements 6.1**

describe('Property 12: 옷장 갭 분석 정확성', () => {
  it('카테고리별 아이템 수가 2개 미만인 카테고리만 gap으로 식별해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const analysis = analyzeWardrobe(items);

          // 카테고리별 아이템 수를 직접 계산
          const categoryCounts: Record<string, number> = {};
          for (const cat of CATEGORIES) {
            categoryCounts[cat] = 0;
          }
          for (const item of items) {
            categoryCounts[item.category]++;
          }

          // gap에 포함된 카테고리는 모두 2개 미만이어야 함
          for (const gap of analysis.gaps) {
            expect(categoryCounts[gap.category]).toBeLessThan(2);
          }

          // 2개 미만인 모든 카테고리가 gap에 포함되어야 함
          const gapCategories = new Set(analysis.gaps.map((g) => g.category));
          for (const cat of CATEGORIES) {
            if (categoryCounts[cat] < 2) {
              expect(gapCategories.has(cat)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('카테고리별 아이템 수가 2개 이상인 카테고리는 gap에 포함되지 않아야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const analysis = analyzeWardrobe(items);

          // 카테고리별 아이템 수를 직접 계산
          const categoryCounts: Record<string, number> = {};
          for (const cat of CATEGORIES) {
            categoryCounts[cat] = 0;
          }
          for (const item of items) {
            categoryCounts[item.category]++;
          }

          // gap에 2개 이상인 카테고리가 포함되어서는 안 됨
          const gapCategories = new Set(analysis.gaps.map((g) => g.category));
          for (const cat of CATEGORIES) {
            if (categoryCounts[cat] >= 2) {
              expect(gapCategories.has(cat)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('각 gap의 currentCount는 실제 해당 카테고리의 아이템 수와 일치해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const analysis = analyzeWardrobe(items);

          // 카테고리별 아이템 수를 직접 계산
          const categoryCounts: Record<string, number> = {};
          for (const cat of CATEGORIES) {
            categoryCounts[cat] = 0;
          }
          for (const item of items) {
            categoryCounts[item.category]++;
          }

          // 각 gap의 currentCount가 실제 수와 일치해야 함
          for (const gap of analysis.gaps) {
            expect(gap.currentCount).toBe(categoryCounts[gap.category]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('분석 결과의 totalItems는 입력 아이템 수와 일치해야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const analysis = analyzeWardrobe(items);
          expect(analysis.totalItems).toBe(items.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 13: 쇼핑 키워드 출력 완전성 ───────────────────────────
// Feature: ai-closet-stylist, Property 13: 쇼핑 키워드 출력 완전성
// **Validates: Requirements 6.2, 6.3, 6.4**

describe('Property 13: 쇼핑 키워드 출력 완전성', () => {
  it('생성된 키워드 수는 1개 이상 10개 이하여야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(wardrobeGapArb, { minLength: 1, maxLength: 5 }),
        fc.array(clothingItemArb, { minLength: 1, maxLength: 20 }),
        (gaps, items) => {
          const keywords = generateKeywords(gaps, items);

          expect(keywords.length).toBeGreaterThanOrEqual(1);
          expect(keywords.length).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('각 키워드는 "[색상] [아이템명]" 형식을 따라야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(wardrobeGapArb, { minLength: 1, maxLength: 5 }),
        fc.array(clothingItemArb, { minLength: 1, maxLength: 20 }),
        (gaps, items) => {
          const keywords = generateKeywords(gaps, items);

          // "[색상] [아이템명]" 형식: 공백으로 분리 시 최소 2개 토큰
          for (const kw of keywords) {
            const parts = kw.keyword.split(' ');
            expect(parts.length).toBeGreaterThanOrEqual(2);
            // 첫 번째 부분은 한글 색상명 (비어있지 않아야 함)
            expect(parts[0].length).toBeGreaterThan(0);
            // 두 번째 부분은 아이템명 (비어있지 않아야 함)
            expect(parts[1].length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('각 키워드는 인코딩된 키워드를 포함하는 유효한 네이버/구글 쇼핑 URL을 가져야 한다', () => {
    fc.assert(
      fc.property(
        fc.array(wardrobeGapArb, { minLength: 1, maxLength: 5 }),
        fc.array(clothingItemArb, { minLength: 1, maxLength: 20 }),
        (gaps, items) => {
          const keywords = generateKeywords(gaps, items);

          for (const kw of keywords) {
            const encodedKeyword = encodeURIComponent(kw.keyword);

            // 네이버쇼핑 URL 검증
            expect(kw.urls.naver).toContain('https://search.shopping.naver.com/search/all?query=');
            expect(kw.urls.naver).toContain(encodedKeyword);

            // 구글쇼핑 URL 검증
            expect(kw.urls.google).toContain('https://www.google.com/search?tbm=shop&q=');
            expect(kw.urls.google).toContain(encodedKeyword);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('각 키워드는 최소 1개의 보유 아이템을 참조하고 비어있지 않은 추천 이유를 가져야 한다', () => {
    // gap과 다른 카테고리의 아이템이 존재할 때 relatedItems가 보장되도록
    // 스마트 제너레이터를 사용한다. 구현상 getRelatedItems는 gap과 다른
    // 카테고리의 아이템만 참조하므로, 적절한 조건의 입력을 생성한다.
    const gapWithDifferentCategoryItemsArb = fc
      .constantFrom(...CATEGORIES)
      .chain((gapCategory) => {
        // gap 카테고리와 다른 카테고리 목록
        const otherCategories = CATEGORIES.filter((c) => c !== gapCategory);

        // gap과 다른 카테고리의 아이템을 최소 1개 포함하도록 보장
        const otherCategoryItemArb = fc.record({
          id: fc.uuid(),
          imageUrl: fc.oneof(fc.constant(null), fc.webUrl()),
          category: fc.constantFrom(...otherCategories),
          color: fc.constantFrom(...COLORS),
          seasons: fc.subarray([...SEASONS], { minLength: 1 }),
          styleTags: fc.subarray([...STYLE_TAGS], { minLength: 1, maxLength: 4 }),
          memo: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
          wearCount: fc.nat({ max: 100 }),
          createdAt: fc.date(),
          updatedAt: fc.date(),
        });

        return fc.tuple(
          fc.constant([{ category: gapCategory, currentCount: 0 }] as WardrobeGap[]),
          fc.array(otherCategoryItemArb, { minLength: 1, maxLength: 15 })
        );
      });

    fc.assert(
      fc.property(gapWithDifferentCategoryItemsArb, ([gaps, items]) => {
        const keywords = generateKeywords(gaps, items);

        for (const kw of keywords) {
          // 최소 1개의 보유 아이템 참조
          expect(kw.relatedItems.length).toBeGreaterThanOrEqual(1);

          // 추천 이유가 비어있지 않아야 함
          expect(kw.reason.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('buildSearchUrls는 어떤 키워드든 유효한 URL 쌍을 반환해야 한다', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (keyword) => {
          const urls = buildSearchUrls(keyword);
          const encoded = encodeURIComponent(keyword);

          // 네이버 URL 형식
          expect(urls.naver).toBe(
            `https://search.shopping.naver.com/search/all?query=${encoded}`
          );

          // 구글 URL 형식
          expect(urls.google).toBe(
            `https://www.google.com/search?tbm=shop&q=${encoded}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
