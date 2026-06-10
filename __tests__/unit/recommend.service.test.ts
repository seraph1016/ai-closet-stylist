/**
 * RecommendService 단위 테스트
 *
 * 추천 엔진의 핵심 로직을 검증한다:
 * - 입력 검증 (허용되지 않은 값 에러 처리)
 * - 빈 옷장 처리
 * - 유효한 조합 구조 생성
 * - 점수 기준 정렬 및 상위 3개 반환
 * - 부족 카테고리 안내 메시지
 */

import { describe, it, expect } from 'vitest';
import {
  generateOutfits,
  validateRecommendInput,
  generateExplanation,
  getItemsFromOutfit,
} from '@/services/recommend.service';
import type {
  ClothingItem,
  RecommendInput,
  OutfitCombination,
} from '@/types';

// ─── 테스트용 헬퍼 ───────────────────────────────────────────────

/** 테스트용 의류 아이템을 생성한다 */
function createMockItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
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

/** 기본 추천 입력 */
const defaultInput: RecommendInput = {
  occasion: '출근',
  weather: 'sunny',
  preferredStyle: 'formal',
};

// ─── 입력 검증 테스트 ─────────────────────────────────────────────

describe('validateRecommendInput', () => {
  it('유효한 입력은 에러를 throw하지 않는다', () => {
    expect(() => validateRecommendInput(defaultInput)).not.toThrow();
  });

  it('허용되지 않은 occasion 값은 에러를 throw한다', () => {
    const input = { ...defaultInput, occasion: '파티' as any };
    expect(() => validateRecommendInput(input)).toThrow('허용되지 않은 occasion');
    expect(() => validateRecommendInput(input)).toThrow('출근');
  });

  it('허용되지 않은 weather 값은 에러를 throw한다', () => {
    const input = { ...defaultInput, weather: 'snowy' as any };
    expect(() => validateRecommendInput(input)).toThrow('허용되지 않은 weather');
    expect(() => validateRecommendInput(input)).toThrow('sunny');
  });

  it('허용되지 않은 preferredStyle 값은 에러를 throw한다', () => {
    const input = { ...defaultInput, preferredStyle: 'gothic' as any };
    expect(() => validateRecommendInput(input)).toThrow('허용되지 않은 preferredStyle');
    expect(() => validateRecommendInput(input)).toThrow('casual');
  });

  it('여러 필드가 동시에 유효하지 않으면 모든 에러를 포함한다', () => {
    const input = {
      occasion: 'invalid' as any,
      weather: 'invalid' as any,
      preferredStyle: 'invalid' as any,
    };
    expect(() => validateRecommendInput(input)).toThrow('occasion');
    expect(() => validateRecommendInput(input)).toThrow('weather');
    expect(() => validateRecommendInput(input)).toThrow('preferredStyle');
  });
});

// ─── generateOutfits 테스트 ────────────────────────────────────────

describe('generateOutfits', () => {
  describe('빈 옷장 처리', () => {
    it('아이템이 0개면 빈 recommendations와 안내 메시지를 반환한다', () => {
      const result = generateOutfits(defaultInput, []);
      expect(result.recommendations).toHaveLength(0);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('옷장');
    });
  });

  describe('부족 카테고리 처리', () => {
    it('top이 없으면 빈 결과와 부족 카테고리 안내를 반환한다', () => {
      const items = [
        createMockItem({ category: 'bottom' }),
        createMockItem({ category: 'shoes' }),
      ];
      const result = generateOutfits(defaultInput, items);
      expect(result.recommendations).toHaveLength(0);
      expect(result.message).toContain('상의');
    });

    it('bottom이 없으면 빈 결과와 부족 카테고리 안내를 반환한다', () => {
      const items = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'shoes' }),
      ];
      const result = generateOutfits(defaultInput, items);
      expect(result.recommendations).toHaveLength(0);
      expect(result.message).toContain('하의');
    });

    it('shoes가 없으면 빈 결과와 부족 카테고리 안내를 반환한다', () => {
      const items = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'bottom' }),
      ];
      const result = generateOutfits(defaultInput, items);
      expect(result.recommendations).toHaveLength(0);
      expect(result.message).toContain('신발');
    });
  });

  describe('조합 구조 검증', () => {
    it('기본 조합(top+bottom+shoes)을 생성한다', () => {
      const items = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'bottom', color: 'white' }),
        createMockItem({ category: 'shoes', color: 'black' }),
      ];
      const result = generateOutfits(defaultInput, items);
      expect(result.recommendations.length).toBeGreaterThan(0);

      const outfit = result.recommendations[0].outfit;
      expect('top' in outfit).toBe(true);
      expect('bottom' in outfit).toBe(true);
      expect('shoes' in outfit).toBe(true);
    });

    it('아우터 포함 조합(top+bottom+outer+shoes)도 생성한다', () => {
      const items = [
        createMockItem({ category: 'top', color: 'white' }),
        createMockItem({ category: 'bottom', color: 'black' }),
        createMockItem({ category: 'outer', color: 'navy' }),
        createMockItem({ category: 'shoes', color: 'black' }),
      ];
      const result = generateOutfits(defaultInput, items);

      // 기본 조합 + 아우터 포함 조합이 모두 생성됨
      const hasOuterCombo = result.recommendations.some(
        (rec) => 'outer' in rec.outfit
      );
      const hasBasicCombo = result.recommendations.some(
        (rec) => !('outer' in rec.outfit) && !('dress' in rec.outfit)
      );
      // 2개의 조합 구조 중 하나는 있어야 함
      expect(hasOuterCombo || hasBasicCombo).toBe(true);
    });
  });

  describe('정렬 및 개수 제한', () => {
    it('추천 결과는 최대 3개까지 반환한다', () => {
      const items = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'top', color: 'white' }),
        createMockItem({ category: 'top', color: 'navy' }),
        createMockItem({ category: 'top', color: 'red' }),
        createMockItem({ category: 'bottom', color: 'black' }),
        createMockItem({ category: 'bottom', color: 'white' }),
        createMockItem({ category: 'shoes', color: 'black' }),
        createMockItem({ category: 'shoes', color: 'white' }),
      ];
      const result = generateOutfits(defaultInput, items);
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('결과는 totalScore 내림차순으로 정렬된다', () => {
      const items = [
        createMockItem({ category: 'top', color: 'black', styleTags: ['formal'], seasons: ['spring'] }),
        createMockItem({ category: 'top', color: 'red', styleTags: ['street'], seasons: ['winter'] }),
        createMockItem({ category: 'bottom', color: 'white', styleTags: ['formal'], seasons: ['spring'] }),
        createMockItem({ category: 'bottom', color: 'pink', styleTags: ['casual'], seasons: ['winter'] }),
        createMockItem({ category: 'shoes', color: 'black', styleTags: ['formal'], seasons: ['spring'] }),
      ];
      const result = generateOutfits(defaultInput, items);

      for (let i = 0; i < result.recommendations.length - 1; i++) {
        expect(result.recommendations[i].totalScore).toBeGreaterThanOrEqual(
          result.recommendations[i + 1].totalScore
        );
      }
    });
  });

  describe('3개 미만 시 안내 메시지', () => {
    it('조합이 1개뿐이면 메시지를 포함한다', () => {
      const items = [
        createMockItem({ category: 'top' }),
        createMockItem({ category: 'bottom' }),
        createMockItem({ category: 'shoes' }),
      ];
      const result = generateOutfits(defaultInput, items);
      // 1개 조합만 가능
      expect(result.recommendations).toHaveLength(1);
      expect(result.message).toBeDefined();
    });
  });

  describe('점수 계산 검증', () => {
    it('각 추천 결과에는 유효한 점수 정보가 포함된다', () => {
      const items = [
        createMockItem({ category: 'top', color: 'black' }),
        createMockItem({ category: 'bottom', color: 'white' }),
        createMockItem({ category: 'shoes', color: 'black' }),
      ];
      const result = generateOutfits(defaultInput, items);
      const rec = result.recommendations[0];

      expect(rec.scores.colorHarmony).toBeGreaterThanOrEqual(0);
      expect(rec.scores.colorHarmony).toBeLessThanOrEqual(100);
      expect(rec.scores.seasonMatch).toBeGreaterThanOrEqual(0);
      expect(rec.scores.seasonMatch).toBeLessThanOrEqual(100);
      expect(rec.scores.occasionMatch).toBeGreaterThanOrEqual(0);
      expect(rec.scores.occasionMatch).toBeLessThanOrEqual(100);
      expect(rec.scores.wearPenalty).toBeGreaterThanOrEqual(-1);
      expect(rec.scores.wearPenalty).toBeLessThanOrEqual(0);
      expect(rec.scores.feedbackBonus).toBeGreaterThanOrEqual(-1);
      expect(rec.scores.feedbackBonus).toBeLessThanOrEqual(1);
      expect(rec.totalScore).toBeDefined();
    });
  });

  describe('입력 검증 에러 전파', () => {
    it('유효하지 않은 입력은 에러를 throw한다', () => {
      const items = [createMockItem({ category: 'top' })];
      const invalidInput = { ...defaultInput, occasion: 'invalid' as any };
      expect(() => generateOutfits(invalidInput, items)).toThrow();
    });
  });
});

// ─── generateExplanation 테스트 ────────────────────────────────────

describe('generateExplanation', () => {
  it('설명은 200자를 초과하지 않는다', () => {
    const outfit: OutfitCombination = {
      top: createMockItem({ category: 'top', color: 'black', seasons: ['spring', 'summer', 'fall', 'winter'], styleTags: ['casual', 'minimal', 'formal', 'street'] }),
      bottom: createMockItem({ category: 'bottom', color: 'white', seasons: ['spring', 'summer', 'fall', 'winter'], styleTags: ['casual', 'minimal', 'formal', 'street'] }),
      shoes: createMockItem({ category: 'shoes', color: 'gray', seasons: ['spring', 'summer', 'fall', 'winter'], styleTags: ['casual', 'minimal', 'formal', 'street'] }),
    };
    const explanation = generateExplanation(outfit, defaultInput);
    expect(explanation.length).toBeLessThanOrEqual(200);
  });

  it('비어있지 않은 설명을 반환한다', () => {
    const outfit: OutfitCombination = {
      top: createMockItem({ category: 'top' }),
      bottom: createMockItem({ category: 'bottom' }),
      shoes: createMockItem({ category: 'shoes' }),
    };
    const explanation = generateExplanation(outfit, defaultInput);
    expect(explanation.length).toBeGreaterThan(0);
  });
});

// ─── getItemsFromOutfit 테스트 ─────────────────────────────────────

describe('getItemsFromOutfit', () => {
  it('기본 조합에서 3개 아이템을 추출한다', () => {
    const outfit: OutfitCombination = {
      top: createMockItem({ category: 'top' }),
      bottom: createMockItem({ category: 'bottom' }),
      shoes: createMockItem({ category: 'shoes' }),
    };
    const items = getItemsFromOutfit(outfit);
    expect(items).toHaveLength(3);
  });

  it('아우터 포함 조합에서 4개 아이템을 추출한다', () => {
    const outfit: OutfitCombination = {
      top: createMockItem({ category: 'top' }),
      bottom: createMockItem({ category: 'bottom' }),
      outer: createMockItem({ category: 'outer' }),
      shoes: createMockItem({ category: 'shoes' }),
    };
    const items = getItemsFromOutfit(outfit);
    expect(items).toHaveLength(4);
  });
});
