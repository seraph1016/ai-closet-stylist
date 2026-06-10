/**
 * 점수 계산 모듈 단위 테스트
 *
 * 색상 조화, 계절 적합, 상황 적합, 착용 빈도 보정, 피드백 보정,
 * 가중합산 로직의 정확성을 검증한다.
 */

import { describe, it, expect } from 'vitest';
import { calculateColorHarmony, getPairScore } from '@/services/scoring/color-harmony';
import { calculateSeasonMatch } from '@/services/scoring/season-match';
import { calculateOccasionMatch } from '@/services/scoring/occasion-match';
import {
  calculateWearPenalty,
  calculateFeedbackBonus,
  scoreOutfit,
} from '@/services/scoring/index';
import type { ClothingItem, Color, Season, StyleTag } from '@/types';

// ─── 헬퍼 함수 ─────────────────────────────────────────────────

/** 테스트용 의류 아이템 생성 헬퍼 */
function createMockItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: 'test-id',
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

// ─── 색상 조화 점수 테스트 ────────────────────────────────────────

describe('calculateColorHarmony', () => {
  describe('getPairScore', () => {
    it('동일색은 70점을 반환한다', () => {
      expect(getPairScore('black', 'black')).toBe(70);
      expect(getPairScore('red', 'red')).toBe(70);
    });

    it('무채색 + 유채색은 90점을 반환한다', () => {
      expect(getPairScore('black', 'red')).toBe(90);
      expect(getPairScore('white', 'blue')).toBe(90);
      expect(getPairScore('gray', 'green')).toBe(90);
    });

    it('유사색은 85점을 반환한다', () => {
      expect(getPairScore('blue', 'navy')).toBe(85);
      expect(getPairScore('red', 'brown')).toBe(85);
      expect(getPairScore('brown', 'beige')).toBe(85);
      expect(getPairScore('pink', 'purple')).toBe(85);
    });

    it('보색은 75점을 반환한다', () => {
      expect(getPairScore('blue', 'yellow')).toBe(75);
      expect(getPairScore('red', 'green')).toBe(75);
      expect(getPairScore('purple', 'yellow')).toBe(75);
      expect(getPairScore('navy', 'beige')).toBe(75);
    });

    it('부조화 색상은 40점을 반환한다', () => {
      expect(getPairScore('red', 'pink')).toBe(40);
      expect(getPairScore('red', 'purple')).toBe(40);
      expect(getPairScore('pink', 'yellow')).toBe(40);
      expect(getPairScore('green', 'blue')).toBe(40);
    });

    it('특별한 관계가 없는 유채색은 60점을 반환한다', () => {
      expect(getPairScore('red', 'navy')).toBe(60);
      expect(getPairScore('blue', 'brown')).toBe(60);
    });
  });

  describe('calculateColorHarmony (평균 계산)', () => {
    it('아이템이 1개일 때 100을 반환한다', () => {
      expect(calculateColorHarmony(['red'])).toBe(100);
    });

    it('아이템이 없을 때 100을 반환한다', () => {
      expect(calculateColorHarmony([])).toBe(100);
    });

    it('2개 아이템의 경우 쌍 점수를 그대로 반환한다', () => {
      expect(calculateColorHarmony(['black', 'red'])).toBe(90);
    });

    it('3개 아이템의 경우 모든 쌍의 평균을 반환한다', () => {
      // black+red=90, black+blue=90, red+blue=60 → 평균 = 80
      const score = calculateColorHarmony(['black', 'red', 'blue']);
      expect(score).toBe(80);
    });
  });
});

// ─── 계절 적합 점수 테스트 ────────────────────────────────────────

describe('calculateSeasonMatch', () => {
  it('모든 아이템이 적합한 계절을 가지면 100을 반환한다', () => {
    const itemSeasons: Season[][] = [
      ['spring', 'summer'],
      ['summer'],
      ['spring'],
    ];
    expect(calculateSeasonMatch(itemSeasons, 'sunny')).toBe(100);
  });

  it('아이템 중 일부만 적합하면 비율에 맞는 점수를 반환한다', () => {
    const itemSeasons: Season[][] = [
      ['summer'],    // sunny → spring, summer ✓
      ['winter'],    // sunny → spring, summer ✗
    ];
    expect(calculateSeasonMatch(itemSeasons, 'sunny')).toBe(50);
  });

  it('아이템이 없으면 0을 반환한다', () => {
    expect(calculateSeasonMatch([], 'sunny')).toBe(0);
  });

  it('어떤 아이템도 적합하지 않으면 0을 반환한다', () => {
    const itemSeasons: Season[][] = [
      ['winter'],
      ['fall'],
    ];
    expect(calculateSeasonMatch(itemSeasons, 'hot')).toBe(0);
  });

  it('cold 날씨에 fall/winter 계절 아이템이 매칭된다', () => {
    const itemSeasons: Season[][] = [
      ['fall', 'winter'],
      ['winter'],
      ['spring'],  // cold에 안 맞음
    ];
    // 2/3 = 67%
    expect(calculateSeasonMatch(itemSeasons, 'cold')).toBe(67);
  });
});

// ─── 상황 적합 점수 테스트 ────────────────────────────────────────

describe('calculateOccasionMatch', () => {
  it('모든 아이템이 적합한 스타일을 가지면 100을 반환한다', () => {
    const itemStyles: StyleTag[][] = [
      ['formal', 'minimal'],
      ['formal'],
      ['minimal'],
    ];
    expect(calculateOccasionMatch(itemStyles, '출근')).toBe(100);
  });

  it('아이템 중 일부만 적합하면 비율에 맞는 점수를 반환한다', () => {
    const itemStyles: StyleTag[][] = [
      ['casual'],  // 출근 → formal, minimal ✗
      ['formal'],  // 출근 → formal, minimal ✓
    ];
    expect(calculateOccasionMatch(itemStyles, '출근')).toBe(50);
  });

  it('아이템이 없으면 0을 반환한다', () => {
    expect(calculateOccasionMatch([], '데이트')).toBe(0);
  });

  it('캐주얼 상황은 casual, street, minimal을 허용한다', () => {
    const itemStyles: StyleTag[][] = [
      ['casual'],
      ['street'],
      ['minimal'],
      ['formal'],  // 캐주얼에 안 맞음
    ];
    expect(calculateOccasionMatch(itemStyles, '캐주얼')).toBe(75);
  });
});

// ─── 착용 빈도 보정 테스트 ────────────────────────────────────────

describe('calculateWearPenalty', () => {
  it('아이템 중 하나가 평균의 2배 이상이면 -1을 반환한다', () => {
    const items = [
      createMockItem({ wearCount: 10 }),
      createMockItem({ wearCount: 2 }),
    ];
    // 평균 착용 횟수 5, 10 >= 5*2 → -1
    expect(calculateWearPenalty(items, 5)).toBe(-1);
  });

  it('모든 아이템이 평균의 2배 미만이면 0을 반환한다', () => {
    const items = [
      createMockItem({ wearCount: 3 }),
      createMockItem({ wearCount: 4 }),
    ];
    expect(calculateWearPenalty(items, 5)).toBe(0);
  });

  it('평균이 0이면 0을 반환한다', () => {
    const items = [
      createMockItem({ wearCount: 5 }),
    ];
    expect(calculateWearPenalty(items, 0)).toBe(0);
  });

  it('정확히 2배인 경우 -1을 반환한다 (>=)', () => {
    const items = [
      createMockItem({ wearCount: 10 }),
    ];
    expect(calculateWearPenalty(items, 5)).toBe(-1);
  });
});

// ─── 피드백 보정 테스트 ──────────────────────────────────────────

describe('calculateFeedbackBonus', () => {
  it('like이면 +1을 반환한다', () => {
    expect(calculateFeedbackBonus('like')).toBe(1);
  });

  it('dislike이면 -1을 반환한다', () => {
    expect(calculateFeedbackBonus('dislike')).toBe(-1);
  });

  it('null이면 0을 반환한다', () => {
    expect(calculateFeedbackBonus(null)).toBe(0);
  });

  it('undefined이면 0을 반환한다', () => {
    expect(calculateFeedbackBonus(undefined)).toBe(0);
  });
});

// ─── 가중합산 총점 테스트 ─────────────────────────────────────────

describe('scoreOutfit', () => {
  it('올바른 가중합산 공식으로 총점을 계산한다', () => {
    const items = [
      createMockItem({ color: 'black', seasons: ['spring'], styleTags: ['formal'], wearCount: 1 }),
      createMockItem({ color: 'white', seasons: ['summer'], styleTags: ['minimal'], wearCount: 1 }),
      createMockItem({ color: 'navy', seasons: ['spring', 'summer'], styleTags: ['formal'], wearCount: 1 }),
    ];

    const result = scoreOutfit(items, {
      weather: 'sunny',
      occasion: '출근',
      averageWearCount: 5,
      feedbackType: 'like',
    });

    // 각 부분 점수가 0-100 범위인지 확인
    expect(result.colorHarmony).toBeGreaterThanOrEqual(0);
    expect(result.colorHarmony).toBeLessThanOrEqual(100);
    expect(result.seasonMatch).toBeGreaterThanOrEqual(0);
    expect(result.seasonMatch).toBeLessThanOrEqual(100);
    expect(result.occasionMatch).toBeGreaterThanOrEqual(0);
    expect(result.occasionMatch).toBeLessThanOrEqual(100);

    // 보정값 확인
    expect(result.wearPenalty).toBe(0);
    expect(result.feedbackBonus).toBe(1);

    // 가중합산 공식 검증
    const expectedTotal =
      result.colorHarmony * 0.3 +
      result.seasonMatch * 0.3 +
      result.occasionMatch * 0.3 +
      (result.wearPenalty + result.feedbackBonus) * 10;
    expect(result.totalScore).toBeCloseTo(expectedTotal, 5);
  });

  it('착용 빈도 페널티와 피드백 보정이 총점에 반영된다', () => {
    const items = [
      createMockItem({ color: 'red', seasons: ['summer'], styleTags: ['casual'], wearCount: 20 }),
      createMockItem({ color: 'blue', seasons: ['summer'], styleTags: ['street'], wearCount: 2 }),
    ];

    const result = scoreOutfit(items, {
      weather: 'hot',
      occasion: '데이트',
      averageWearCount: 5,
      feedbackType: 'dislike',
    });

    // wearCount 20 >= 5*2 → penalty = -1
    expect(result.wearPenalty).toBe(-1);
    // dislike → feedbackBonus = -1
    expect(result.feedbackBonus).toBe(-1);

    // 보정 합계: (-1 + -1) * 10 = -20이 총점에 반영됨
    const baseScore =
      result.colorHarmony * 0.3 +
      result.seasonMatch * 0.3 +
      result.occasionMatch * 0.3;
    expect(result.totalScore).toBeCloseTo(baseScore - 20, 5);
  });
});
