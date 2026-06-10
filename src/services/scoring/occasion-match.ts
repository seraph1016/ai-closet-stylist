/**
 * 상황 적합 점수 계산 모듈
 *
 * 코디 조합의 각 아이템이 대상 상황(occasion)에 적합한 스타일 태그를 가지고 있는지 확인하여
 * 적합한 아이템의 비율을 점수(0-100)로 반환한다.
 *
 * 상황-스타일 매핑:
 * - 출근 → formal, minimal
 * - 데이트 → casual, street
 * - 여행 → casual, street
 * - 면접 → formal, minimal
 * - 캐주얼 → casual, street, minimal
 */

import type { StyleTag, Occasion } from '@/types';
import { OCCASION_STYLE_MAP } from '@/lib/constants';

/**
 * 코디 조합의 상황 적합 점수를 계산한다.
 *
 * 각 아이템의 스타일 태그와 대상 상황의 적합 스타일을 비교하여,
 * 적합한 아이템의 비율(백분율)을 점수로 반환한다.
 *
 * @param itemStyles - 각 아이템의 스타일 태그 배열 (예: [['casual', 'street'], ['formal']])
 * @param occasion - 대상 상황
 * @returns 0-100 범위의 상황 적합 점수 (아이템이 없으면 0 반환)
 */
export function calculateOccasionMatch(
  itemStyles: StyleTag[][],
  occasion: Occasion
): number {
  // 아이템이 없으면 0점 반환
  if (itemStyles.length === 0) {
    return 0;
  }

  // 해당 상황에 적합한 스타일 목록을 조회
  const applicableStyles = OCCASION_STYLE_MAP[occasion];

  // 각 아이템의 스타일 태그가 적합 스타일과 겹치는지 확인
  let matchCount = 0;
  for (const styles of itemStyles) {
    // 아이템의 스타일 태그 중 하나라도 적합 스타일에 포함되면 매칭
    const hasOverlap = styles.some((style) =>
      applicableStyles.includes(style)
    );
    if (hasOverlap) {
      matchCount++;
    }
  }

  // 적합한 아이템의 비율을 백분율로 변환 (0-100)
  return Math.round((matchCount / itemStyles.length) * 100);
}
