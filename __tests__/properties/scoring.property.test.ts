/**
 * 점수 계산 프로퍼티 테스트
 *
 * 추천 엔진의 점수 계산 모듈에 대한 프로퍼티 기반 테스트를 정의한다.
 * 색상 조화, 계절 적합, 상황 적합 점수의 범위와
 * 피드백 보정, 착용 빈도 보정의 정확성을 검증한다.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  scoreOutfit,
  calculateWearPenalty,
  calculateFeedbackBonus,
  type ScoringContext,
} from '@/services/scoring/index';
import { calculateColorHarmony } from '@/services/scoring/color-harmony';
import { calculateSeasonMatch } from '@/services/scoring/season-match';
import { calculateOccasionMatch } from '@/services/scoring/occasion-match';
import { COLORS, SEASONS, STYLE_TAGS, OCCASIONS, WEATHERS } from '@/lib/constants';
import type { ClothingItem, Color, Season, StyleTag, Weather, Occasion } from '@/types';

// ─── 제너레이터 정의 ──────────────────────────────────────────────

/** ClothingItem 제너레이터 */
const clothingItemArb = fc.record({
  id: fc.uuid(),
  imageUrl: fc.constant(null),
  category: fc.constantFrom('top' as const, 'bottom' as const, 'outer' as const, 'shoes' as const, 'accessory' as const),
  color: fc.constantFrom(...COLORS),
  seasons: fc.subarray([...SEASONS], { minLength: 1 }),
  styleTags: fc.subarray([...STYLE_TAGS], { minLength: 1, maxLength: 4 }),
  memo: fc.constant(null),
  wearCount: fc.nat({ max: 100 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<ClothingItem>;

/** ScoringContext 제너레이터 */
const scoringContextArb = fc.record({
  weather: fc.constantFrom(...WEATHERS),
  occasion: fc.constantFrom(...OCCASIONS),
  averageWearCount: fc.nat({ max: 100 }),
  feedbackType: fc.constantFrom('like' as const, 'dislike' as const, null),
});

// ─── Property 9: 부분 점수 범위 경계 ──────────────────────────────────

// Feature: ai-closet-stylist, Property 9: 부분 점수 범위 경계
describe('Property 9: 부분 점수 범위 경계', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any outfit combination and scoring context, each component score
   * (colorHarmony, seasonMatch, occasionMatch) must be a number in the
   * range [0, 100] inclusive.
   */
  it('각 부분 점수(colorHarmony, seasonMatch, occasionMatch)는 [0, 100] 범위 내의 숫자이다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 5 }),
        scoringContextArb,
        (items, context) => {
          const result = scoreOutfit(items, context as ScoringContext);

          // colorHarmony는 [0, 100] 범위
          expect(result.colorHarmony).toBeGreaterThanOrEqual(0);
          expect(result.colorHarmony).toBeLessThanOrEqual(100);
          expect(Number.isFinite(result.colorHarmony)).toBe(true);

          // seasonMatch는 [0, 100] 범위
          expect(result.seasonMatch).toBeGreaterThanOrEqual(0);
          expect(result.seasonMatch).toBeLessThanOrEqual(100);
          expect(Number.isFinite(result.seasonMatch)).toBe(true);

          // occasionMatch는 [0, 100] 범위
          expect(result.occasionMatch).toBeGreaterThanOrEqual(0);
          expect(result.occasionMatch).toBeLessThanOrEqual(100);
          expect(Number.isFinite(result.occasionMatch)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateColorHarmony는 임의의 색상 배열에 대해 [0, 100] 범위를 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...COLORS), { minLength: 1, maxLength: 5 }),
        (colors) => {
          const score = calculateColorHarmony(colors);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          expect(Number.isFinite(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateSeasonMatch는 임의의 계절 배열과 날씨에 대해 [0, 100] 범위를 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(fc.subarray([...SEASONS], { minLength: 1 }), { minLength: 1, maxLength: 5 }),
        fc.constantFrom(...WEATHERS),
        (itemSeasons, weather) => {
          const score = calculateSeasonMatch(itemSeasons, weather);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          expect(Number.isFinite(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateOccasionMatch는 임의의 스타일 배열과 상황에 대해 [0, 100] 범위를 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(fc.subarray([...STYLE_TAGS], { minLength: 1 }), { minLength: 1, maxLength: 5 }),
        fc.constantFrom(...OCCASIONS),
        (itemStyles, occasion) => {
          const score = calculateOccasionMatch(itemStyles, occasion);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          expect(Number.isFinite(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: 피드백 점수 보정 ──────────────────────────────────

// Feature: ai-closet-stylist, Property 15: 피드백 점수 보정
describe('Property 15: 피드백 점수 보정', () => {
  /**
   * **Validates: Requirements 7.2**
   *
   * For any outfit with feedback, the scoring function should add exactly
   * +1 for 'like' feedback and -1 for 'dislike' feedback to the base score.
   * Outfits with no feedback should receive 0 bonus.
   */
  it("'like' 피드백은 +1, 'dislike' 피드백은 -1, 없으면 0 보너스를 부여한다", () => {
    fc.assert(
      fc.property(
        fc.constantFrom('like' as const, 'dislike' as const, null, undefined),
        (feedbackType) => {
          const bonus = calculateFeedbackBonus(feedbackType);

          if (feedbackType === 'like') {
            expect(bonus).toBe(1);
          } else if (feedbackType === 'dislike') {
            expect(bonus).toBe(-1);
          } else {
            expect(bonus).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scoreOutfit의 feedbackBonus는 피드백 유형에 따라 정확히 보정된다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 4 }),
        fc.constantFrom(...WEATHERS),
        fc.constantFrom(...OCCASIONS),
        fc.nat({ max: 50 }),
        fc.constantFrom('like' as const, 'dislike' as const, null),
        (items, weather, occasion, avgWear, feedbackType) => {
          const context: ScoringContext = {
            weather,
            occasion,
            averageWearCount: avgWear,
            feedbackType,
          };

          const result = scoreOutfit(items, context);

          if (feedbackType === 'like') {
            expect(result.feedbackBonus).toBe(1);
          } else if (feedbackType === 'dislike') {
            expect(result.feedbackBonus).toBe(-1);
          } else {
            expect(result.feedbackBonus).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 16: 착용 빈도 패널티 ─────────────────────────────────

// Feature: ai-closet-stylist, Property 16: 착용 빈도 패널티
describe('Property 16: 착용 빈도 패널티', () => {
  /**
   * **Validates: Requirements 7.3**
   *
   * For any set of clothing items, items whose wearCount is greater than or
   * equal to 2 times the average wearCount of all items should receive a -1
   * scoring penalty, and all other items should receive 0 penalty.
   */
  it('wearCount가 평균의 2배 이상인 아이템이 있으면 -1, 아니면 0 패널티를 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 5 }),
        fc.nat({ max: 100 }),
        (items, averageWearCount) => {
          const penalty = calculateWearPenalty(items, averageWearCount);

          if (averageWearCount === 0) {
            // 평균이 0이면 보정 없음
            expect(penalty).toBe(0);
          } else {
            // 아이템 중 하나라도 wearCount >= 2 * average 면 -1
            const hasOverworn = items.some(
              (item) => item.wearCount >= 2 * averageWearCount
            );
            if (hasOverworn) {
              expect(penalty).toBe(-1);
            } else {
              expect(penalty).toBe(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('평균 착용 횟수가 0이면 항상 패널티 없음(0)을 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 5 }),
        (items) => {
          const penalty = calculateWearPenalty(items, 0);
          expect(penalty).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scoreOutfit의 wearPenalty는 착용 빈도 규칙에 따라 정확히 계산된다', () => {
    fc.assert(
      fc.property(
        fc.array(clothingItemArb, { minLength: 1, maxLength: 4 }),
        fc.constantFrom(...WEATHERS),
        fc.constantFrom(...OCCASIONS),
        fc.nat({ max: 50 }),
        fc.constantFrom('like' as const, 'dislike' as const, null),
        (items, weather, occasion, avgWear, feedbackType) => {
          const context: ScoringContext = {
            weather,
            occasion,
            averageWearCount: avgWear,
            feedbackType,
          };

          const result = scoreOutfit(items, context);

          // wearPenalty는 -1 또는 0만 가능
          expect(result.wearPenalty === -1 || result.wearPenalty === 0).toBe(true);

          if (avgWear === 0) {
            expect(result.wearPenalty).toBe(0);
          } else {
            const hasOverworn = items.some(
              (item) => item.wearCount >= 2 * avgWear
            );
            if (hasOverworn) {
              expect(result.wearPenalty).toBe(-1);
            } else {
              expect(result.wearPenalty).toBe(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
