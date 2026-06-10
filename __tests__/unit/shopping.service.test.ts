import { describe, it, expect } from 'vitest';
import {
  analyzeWardrobe,
  generateKeywords,
  buildSearchUrls,
  getShoppingRecommendations,
} from '@/services/shopping.service';
import type { ClothingItem, WardrobeGap } from '@/types';

/**
 * ShoppingService 단위 테스트
 * 쇼핑 분석 서비스의 핵심 로직을 검증한다.
 */

// 테스트용 의류 아이템 헬퍼 함수
function createMockItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    imageUrl: null,
    category: 'top',
    color: 'black',
    seasons: ['spring', 'summer'],
    styleTags: ['casual'],
    memo: null,
    wearCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ShoppingService', () => {
  describe('analyzeWardrobe', () => {
    it('카테고리별 아이템 수를 정확히 집계한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'top', color: 'white' }),
        createMockItem({ category: 'bottom', color: 'blue' }),
        createMockItem({ category: 'shoes', color: 'black' }),
      ];

      const result = analyzeWardrobe(items);

      expect(result.totalItems).toBe(4);
      expect(result.categoryDistribution.top).toBe(2);
      expect(result.categoryDistribution.bottom).toBe(1);
      expect(result.categoryDistribution.shoes).toBe(1);
      expect(result.categoryDistribution.outer).toBe(0);
      expect(result.categoryDistribution.accessory).toBe(0);
    });

    it('색상별 분포를 정확히 집계한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ color: 'black' }),
        createMockItem({ color: 'black' }),
        createMockItem({ color: 'white' }),
      ];

      const result = analyzeWardrobe(items);

      expect(result.colorDistribution.black).toBe(2);
      expect(result.colorDistribution.white).toBe(1);
      expect(result.colorDistribution.red).toBe(0);
    });

    it('스타일별 분포를 정확히 집계한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ styleTags: ['casual', 'minimal'] }),
        createMockItem({ styleTags: ['casual'] }),
        createMockItem({ styleTags: ['formal'] }),
      ];

      const result = analyzeWardrobe(items);

      expect(result.styleDistribution.casual).toBe(2);
      expect(result.styleDistribution.minimal).toBe(1);
      expect(result.styleDistribution.formal).toBe(1);
      expect(result.styleDistribution.street).toBe(0);
    });

    it('2개 미만 카테고리를 부족 항목으로 식별한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'bottom' }),
        // outer, shoes, accessory는 0개
      ];

      const result = analyzeWardrobe(items);

      // bottom(1개), outer(0개), shoes(0개), accessory(0개)가 gap
      expect(result.gaps.length).toBe(4);
      expect(result.gaps.map((g) => g.category)).toContain('bottom');
      expect(result.gaps.map((g) => g.category)).toContain('outer');
      expect(result.gaps.map((g) => g.category)).toContain('shoes');
      expect(result.gaps.map((g) => g.category)).toContain('accessory');
      // top은 2개 이상이므로 gap이 아님
      expect(result.gaps.map((g) => g.category)).not.toContain('top');
    });

    it('모든 카테고리에 2개 이상이면 부족 항목이 없다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'bottom' }),
        createMockItem({ category: 'bottom' }),
        createMockItem({ category: 'outer' }),
        createMockItem({ category: 'outer' }),
        createMockItem({ category: 'shoes' }),
        createMockItem({ category: 'shoes' }),
        createMockItem({ category: 'accessory' }),
        createMockItem({ category: 'accessory' }),
      ];

      const result = analyzeWardrobe(items);

      expect(result.gaps.length).toBe(0);
    });
  });

  describe('generateKeywords', () => {
    it('부족 항목에 대해 키워드를 생성한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'top', color: 'white' }),
        createMockItem({ category: 'bottom', color: 'navy' }),
      ];
      const gaps: WardrobeGap[] = [
        { category: 'outer', currentCount: 0 },
      ];

      const keywords = generateKeywords(gaps, items);

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(10);
    });

    it('키워드가 "[색상] [아이템명]" 형식을 따른다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'bottom', color: 'navy' }),
      ];
      const gaps: WardrobeGap[] = [
        { category: 'shoes', currentCount: 0 },
      ];

      const keywords = generateKeywords(gaps, items);

      for (const kw of keywords) {
        // 키워드는 한글 색상명 + 공백 + 아이템명 형식이어야 한다
        expect(kw.keyword).toMatch(/^.+ .+$/);
      }
    });

    it('각 키워드에 추천 이유가 포함된다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'bottom', color: 'blue' }),
      ];
      const gaps: WardrobeGap[] = [
        { category: 'outer', currentCount: 0 },
      ];

      const keywords = generateKeywords(gaps, items);

      for (const kw of keywords) {
        expect(kw.reason).toBeTruthy();
        expect(kw.reason.length).toBeGreaterThan(0);
      }
    });

    it('각 키워드에 관련 보유 아이템이 포함된다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'bottom', color: 'navy' }),
      ];
      const gaps: WardrobeGap[] = [
        { category: 'shoes', currentCount: 0 },
      ];

      const keywords = generateKeywords(gaps, items);

      for (const kw of keywords) {
        expect(kw.relatedItems.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('최대 10개의 키워드만 생성한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
      ];
      // 많은 gap을 제공하여 10개 제한 테스트
      const gaps: WardrobeGap[] = [
        { category: 'bottom', currentCount: 0 },
        { category: 'outer', currentCount: 0 },
        { category: 'shoes', currentCount: 0 },
        { category: 'accessory', currentCount: 0 },
        { category: 'top', currentCount: 1 },
      ];

      const keywords = generateKeywords(gaps, items);

      expect(keywords.length).toBeLessThanOrEqual(10);
    });
  });

  describe('buildSearchUrls', () => {
    it('네이버 쇼핑 URL을 올바르게 생성한다', () => {
      const urls = buildSearchUrls('블랙 자켓');

      expect(urls.naver).toBe(
        `https://search.shopping.naver.com/search/all?query=${encodeURIComponent('블랙 자켓')}`
      );
    });

    it('구글 쇼핑 URL을 올바르게 생성한다', () => {
      const urls = buildSearchUrls('화이트 셔츠');

      expect(urls.google).toBe(
        `https://www.google.com/search?tbm=shop&q=${encodeURIComponent('화이트 셔츠')}`
      );
    });

    it('키워드를 인코딩하여 URL에 포함한다', () => {
      const keyword = '네이비 바지';
      const urls = buildSearchUrls(keyword);

      expect(urls.naver).toContain(encodeURIComponent(keyword));
      expect(urls.google).toContain(encodeURIComponent(keyword));
    });
  });

  describe('getShoppingRecommendations', () => {
    it('아이템 3개 미만 시 안내 메시지를 반환한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'bottom' }),
      ];

      const result = getShoppingRecommendations(items);

      expect(result.success).toBe(false);
      expect(result.message).toBe('충분한 분석을 위해 3개 이상의 아이템을 등록해주세요.');
    });

    it('아이템 0개일 때 안내 메시지를 반환한다', () => {
      const result = getShoppingRecommendations([]);

      expect(result.success).toBe(false);
      expect(result.message).toBe('충분한 분석을 위해 3개 이상의 아이템을 등록해주세요.');
    });

    it('부족 항목이 없을 시 균형 메시지를 반환한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'bottom' }),
        createMockItem({ category: 'bottom' }),
        createMockItem({ category: 'outer' }),
        createMockItem({ category: 'outer' }),
        createMockItem({ category: 'shoes' }),
        createMockItem({ category: 'shoes' }),
        createMockItem({ category: 'accessory' }),
        createMockItem({ category: 'accessory' }),
      ];

      const result = getShoppingRecommendations(items);

      expect(result.success).toBe(true);
      expect(result.message).toBe('옷장 구성이 균형 잡혀 있습니다!');
    });

    it('부족 항목이 있으면 키워드를 생성한다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'top', color: 'white' }),
        createMockItem({ category: 'bottom', color: 'navy' }),
        // outer, shoes, accessory 부족
      ];

      const result = getShoppingRecommendations(items);

      expect(result.success).toBe(true);
      expect(result.keywords).toBeDefined();
      expect(result.keywords!.length).toBeGreaterThan(0);
      expect(result.analysis).toBeDefined();
    });

    it('생성된 키워드에 유효한 URL이 포함된다', () => {
      const items: ClothingItem[] = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'top', color: 'white' }),
        createMockItem({ category: 'bottom', color: 'blue' }),
      ];

      const result = getShoppingRecommendations(items);

      if (result.keywords) {
        for (const kw of result.keywords) {
          expect(kw.urls.naver).toContain('https://search.shopping.naver.com/search/all?query=');
          expect(kw.urls.google).toContain('https://www.google.com/search?tbm=shop&q=');
        }
      }
    });
  });
});
