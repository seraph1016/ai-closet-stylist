/**
 * 점수 합산 모듈 (가중합산 로직)
 *
 * 색상 조화, 계절 적합, 상황 적합 점수를 가중합산하고,
 * 착용 빈도 보정과 피드백 보정을 적용하여 최종 점수를 산출한다.
 *
 * 총점 공식:
 * totalScore = colorHarmony * 0.3 + seasonMatch * 0.3 + occasionMatch * 0.3
 *              + (wearPenalty + feedbackBonus) * 10
 *
 * 착용 빈도 보정:
 * - 어떤 아이템의 wearCount가 전체 평균의 2배 이상이면 → -1
 * - 그 외 → 0
 *
 * 피드백 보정:
 * - 'like' → +1
 * - 'dislike' → -1
 * - null/undefined → 0
 */

import type { Color, Season, StyleTag, Weather, Occasion, ClothingItem } from '@/types';
import { calculateColorHarmony } from './color-harmony';
import { calculateSeasonMatch } from './season-match';
import { calculateOccasionMatch } from './occasion-match';

// ─── 인터페이스 정의 ──────────────────────────────────────────────

/** 점수 계산에 필요한 컨텍스트 정보 */
export interface ScoringContext {
  /** 날씨 조건 */
  weather: Weather;
  /** 상황 */
  occasion: Occasion;
  /** 모든 아이템의 평균 착용 횟수 */
  averageWearCount: number;
  /** 피드백 유형 (좋아요/싫어요/없음) */
  feedbackType?: 'like' | 'dislike' | null;
}

/** 코디 조합의 세부 점수 결과 */
export interface OutfitScore {
  /** 색상 조화 점수 (0-100) */
  colorHarmony: number;
  /** 계절 적합 점수 (0-100) */
  seasonMatch: number;
  /** 상황 적합 점수 (0-100) */
  occasionMatch: number;
  /** 착용 빈도 보정 (-1 | 0) */
  wearPenalty: number;
  /** 피드백 보정 (-1 | 0 | +1) */
  feedbackBonus: number;
  /** 가중합산 총점 */
  totalScore: number;
}

// ─── 보정값 계산 함수 ─────────────────────────────────────────────

/**
 * 착용 빈도 보정값을 계산한다.
 *
 * 코디 조합에 포함된 아이템 중 하나라도 wearCount가
 * 전체 평균의 2배 이상이면 -1 페널티를 부여한다.
 *
 * @param items - 코디 조합에 포함된 의류 아이템 배열
 * @param averageWearCount - 사용자 전체 아이템의 평균 착용 횟수
 * @returns -1 (페널티) 또는 0 (보정 없음)
 */
export function calculateWearPenalty(
  items: ClothingItem[],
  averageWearCount: number
): -1 | 0 {
  // 평균이 0이면 보정 없음 (비교 기준이 없으므로)
  if (averageWearCount === 0) {
    return 0;
  }

  // 아이템 중 하나라도 평균의 2배 이상 착용되었는지 확인
  const hasOverworn = items.some(
    (item) => item.wearCount >= 2 * averageWearCount
  );

  return hasOverworn ? -1 : 0;
}

/**
 * 피드백 보정값을 계산한다.
 *
 * @param feedbackType - 피드백 유형 ('like' | 'dislike' | null | undefined)
 * @returns +1 (좋아요), -1 (싫어요), 또는 0 (피드백 없음)
 */
export function calculateFeedbackBonus(
  feedbackType?: 'like' | 'dislike' | null
): -1 | 0 | 1 {
  if (feedbackType === 'like') return 1;
  if (feedbackType === 'dislike') return -1;
  return 0;
}

// ─── 총점 계산 함수 ──────────────────────────────────────────────

/**
 * 코디 조합의 최종 점수를 계산한다.
 *
 * 색상 조화, 계절 적합, 상황 적합 점수를 각각 0.3 가중치로 합산하고,
 * 착용 빈도 보정(-1|0)과 피드백 보정(-1|0|+1)을 10배로 적용한다.
 *
 * @param items - 코디 조합에 포함된 의류 아이템 배열
 * @param context - 점수 계산 컨텍스트 (날씨, 상황, 평균 착용 횟수, 피드백)
 * @returns 세부 점수와 총점을 포함한 OutfitScore 객체
 */
export function scoreOutfit(
  items: ClothingItem[],
  context: ScoringContext
): OutfitScore {
  // 각 아이템에서 색상, 계절, 스타일 정보 추출
  const colors: Color[] = items.map((item) => item.color);
  const itemSeasons: Season[][] = items.map((item) => item.seasons);
  const itemStyles: StyleTag[][] = items.map((item) => item.styleTags);

  // 각 부분 점수 계산 (0-100)
  const colorHarmony = calculateColorHarmony(colors);
  const seasonMatch = calculateSeasonMatch(itemSeasons, context.weather);
  const occasionMatch = calculateOccasionMatch(itemStyles, context.occasion);

  // 보정값 계산
  const wearPenalty = calculateWearPenalty(items, context.averageWearCount);
  const feedbackBonus = calculateFeedbackBonus(context.feedbackType);

  // 가중합산 총점 계산
  const totalScore =
    colorHarmony * 0.3 +
    seasonMatch * 0.3 +
    occasionMatch * 0.3 +
    (wearPenalty + feedbackBonus) * 10;

  return {
    colorHarmony,
    seasonMatch,
    occasionMatch,
    wearPenalty,
    feedbackBonus,
    totalScore,
  };
}

// 모듈 재내보내기 (개별 함수 직접 접근 가능)
export { calculateColorHarmony } from './color-harmony';
export { calculateSeasonMatch } from './season-match';
export { calculateOccasionMatch } from './occasion-match';
