/**
 * 색상 조화 점수 계산 모듈
 *
 * 코디 조합 내 의류 아이템들의 색상 쌍(pair)별로 조화 점수를 산출하고,
 * 모든 쌍의 평균을 최종 색상 조화 점수(0-100)로 반환한다.
 *
 * 색상 조화 규칙:
 * - 동일색 (monochrome): 같은 색상 → 70점
 * - 무채색 + 유채색 (neutral_chromatic): black/white/gray + 유채색 → 90점
 * - 유사색 (analogous): 정의된 유사색 쌍 → 85점
 * - 보색 (complementary): 정의된 보색 쌍 → 75점
 * - 부조화 (clash): 정의된 부조화 쌍 → 40점
 * - 기본값 (default): 위 규칙에 해당하지 않는 유채색 조합 → 60점
 */

import type { Color } from '@/types';
import {
  ACHROMATIC_COLORS,
  CHROMATIC_COLORS,
  ANALOGOUS_COLORS,
  COMPLEMENTARY_COLORS,
  CLASH_COLORS,
  COLOR_HARMONY_SCORES,
} from '@/lib/constants';

/** 특별한 관계가 없는 유채색 조합의 기본 점수 */
const DEFAULT_SCORE = 60;

/**
 * 두 색상 간의 조화 점수를 계산한다.
 *
 * @param colorA - 첫 번째 색상
 * @param colorB - 두 번째 색상
 * @returns 0-100 범위의 조화 점수
 */
export function getPairScore(colorA: Color, colorB: Color): number {
  // 동일색: 같은 색상끼리는 70점
  if (colorA === colorB) {
    return COLOR_HARMONY_SCORES.monochrome;
  }

  const aIsAchromatic = (ACHROMATIC_COLORS as readonly string[]).includes(colorA);
  const bIsAchromatic = (ACHROMATIC_COLORS as readonly string[]).includes(colorB);
  const aIsChromatic = (CHROMATIC_COLORS as readonly string[]).includes(colorA);
  const bIsChromatic = (CHROMATIC_COLORS as readonly string[]).includes(colorB);

  // 무채색 + 유채색 조합: 90점
  if ((aIsAchromatic && bIsChromatic) || (bIsAchromatic && aIsChromatic)) {
    return COLOR_HARMONY_SCORES.neutral_chromatic;
  }

  // 유사색 관계 확인: 85점
  const analogousOfA = ANALOGOUS_COLORS[colorA];
  if (analogousOfA && analogousOfA.includes(colorB)) {
    return COLOR_HARMONY_SCORES.analogous;
  }

  // 보색 관계 확인: 75점
  const complementaryOfA = COMPLEMENTARY_COLORS[colorA];
  if (complementaryOfA && complementaryOfA.includes(colorB)) {
    return COLOR_HARMONY_SCORES.complementary;
  }

  // 부조화 관계 확인: 40점
  const clashOfA = CLASH_COLORS[colorA];
  if (clashOfA && clashOfA.includes(colorB)) {
    return COLOR_HARMONY_SCORES.clash;
  }

  // 위 규칙에 해당하지 않는 경우 기본 점수: 60점
  return DEFAULT_SCORE;
}

/**
 * 코디 조합의 색상 조화 점수를 계산한다.
 *
 * 모든 아이템의 색상 쌍(pair)별로 조화 점수를 산출하고,
 * 전체 쌍의 평균을 반환한다.
 *
 * @param colors - 코디 조합에 포함된 아이템들의 색상 배열
 * @returns 0-100 범위의 평균 색상 조화 점수 (아이템이 1개 이하면 100 반환)
 */
export function calculateColorHarmony(colors: Color[]): number {
  // 아이템이 1개 이하면 색상 조합 비교가 불가능하므로 만점 반환
  if (colors.length <= 1) {
    return 100;
  }

  let totalScore = 0;
  let pairCount = 0;

  // 모든 색상 쌍의 조화 점수를 합산
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      totalScore += getPairScore(colors[i], colors[j]);
      pairCount++;
    }
  }

  // 쌍의 평균 점수 반환
  return Math.round(totalScore / pairCount);
}
