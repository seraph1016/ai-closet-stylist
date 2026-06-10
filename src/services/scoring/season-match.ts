/**
 * 계절 적합 점수 계산 모듈
 *
 * 코디 조합의 각 아이템이 대상 날씨에 적합한 계절 태그를 가지고 있는지 확인하여
 * 적합한 아이템의 비율을 점수(0-100)로 반환한다.
 *
 * 날씨-계절 매핑:
 * - sunny → spring, summer
 * - hot → summer
 * - rainy → spring, fall
 * - cold → fall, winter
 */

import type { Season, Weather } from '@/types';
import { WEATHER_SEASON_MAP } from '@/lib/constants';

/**
 * 코디 조합의 계절 적합 점수를 계산한다.
 *
 * 각 아이템의 계절 태그와 대상 날씨의 적합 계절을 비교하여,
 * 적합한 아이템의 비율(백분율)을 점수로 반환한다.
 *
 * @param itemSeasons - 각 아이템의 계절 태그 배열 (예: [['spring', 'summer'], ['fall', 'winter']])
 * @param targetWeather - 대상 날씨 조건
 * @returns 0-100 범위의 계절 적합 점수 (아이템이 없으면 0 반환)
 */
export function calculateSeasonMatch(
  itemSeasons: Season[][],
  targetWeather: Weather
): number {
  // 아이템이 없으면 0점 반환
  if (itemSeasons.length === 0) {
    return 0;
  }

  // 해당 날씨에 적합한 계절 목록을 조회
  const applicableSeasons = WEATHER_SEASON_MAP[targetWeather];

  // 각 아이템의 계절 태그가 적합 계절과 겹치는지 확인
  let matchCount = 0;
  for (const seasons of itemSeasons) {
    // 아이템의 계절 태그 중 하나라도 적합 계절에 포함되면 매칭
    const hasOverlap = seasons.some((season) =>
      applicableSeasons.includes(season)
    );
    if (hasOverlap) {
      matchCount++;
    }
  }

  // 적합한 아이템의 비율을 백분율로 변환 (0-100)
  return Math.round((matchCount / itemSeasons.length) * 100);
}
