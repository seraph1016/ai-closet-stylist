/**
 * AI 옷장 스타일 추천 웹사이트 - 상수 정의
 *
 * 시스템 전반에서 사용되는 사전정의 상수들을 정의한다.
 * 색상 목록, 카테고리 목록, 계절 목록, 스타일 태그 목록,
 * 상황 목록, 날씨 목록, 색상 조화 매트릭스, 계절-날씨 매핑,
 * 상황-스타일 매핑을 포함한다.
 */

import type { Category, Color, Season, StyleTag, Occasion, Weather } from '@/types';

// ─── 사전정의 목록 ──────────────────────────────────────────────

/** 사전정의 색상 목록 (12색) */
export const COLORS: readonly Color[] = [
  'black',
  'white',
  'gray',
  'red',
  'blue',
  'green',
  'yellow',
  'pink',
  'brown',
  'beige',
  'navy',
  'purple',
] as const;

/** 의류 카테고리 목록 */
export const CATEGORIES: readonly Category[] = [
  'top',
  'bottom',
  'outer',
  'shoes',
  'accessory',
] as const;

/** 계절 목록 */
export const SEASONS: readonly Season[] = [
  'spring',
  'summer',
  'fall',
  'winter',
] as const;

/** 스타일 태그 목록 */
export const STYLE_TAGS: readonly StyleTag[] = [
  'casual',
  'minimal',
  'formal',
  'street',
] as const;

/** 상황 목록 */
export const OCCASIONS: readonly Occasion[] = [
  '출근',
  '데이트',
  '여행',
  '면접',
  '캐주얼',
] as const;

/** 날씨 목록 */
export const WEATHERS: readonly Weather[] = [
  'sunny',
  'rainy',
  'cold',
  'hot',
] as const;

// ─── 무채색/유채색 분류 ─────────────────────────────────────────

/** 무채색 목록 (black, white, gray) */
export const ACHROMATIC_COLORS: readonly Color[] = [
  'black',
  'white',
  'gray',
] as const;

/** 유채색 목록 (무채색을 제외한 나머지) */
export const CHROMATIC_COLORS: readonly Color[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'pink',
  'brown',
  'beige',
  'navy',
  'purple',
] as const;

// ─── 색상 조화 매트릭스 ─────────────────────────────────────────

/**
 * 색상 조화 점수 유형
 * - monochrome: 동일색 조합 (70점)
 * - neutral_chromatic: 무채색 + 유채색 조합 (90점)
 * - analogous: 유사색 조합 (85점)
 * - complementary: 보색 조합 (75점)
 * - clash: 부조화 조합 (40점)
 */
export type ColorHarmonyType =
  | 'monochrome'
  | 'neutral_chromatic'
  | 'analogous'
  | 'complementary'
  | 'clash';

/** 색상 조화 유형별 점수 */
export const COLOR_HARMONY_SCORES: Record<ColorHarmonyType, number> = {
  /** 동일색 (예: black + black) */
  monochrome: 70,
  /** 무채색 + 유채색 (예: black/white/gray + any) */
  neutral_chromatic: 90,
  /** 유사색 (예: blue + navy) */
  analogous: 85,
  /** 보색 (예: blue + yellow) */
  complementary: 75,
  /** 부조화 (예: red + pink) */
  clash: 40,
} as const;

/**
 * 유사색 관계 매핑
 * 각 색상에 대해 유사색으로 간주되는 색상 목록을 정의한다.
 */
export const ANALOGOUS_COLORS: Partial<Record<Color, Color[]>> = {
  blue: ['navy'],
  navy: ['blue'],
  red: ['brown'],
  brown: ['red', 'beige'],
  beige: ['brown'],
  pink: ['purple'],
  purple: ['pink', 'navy'],
  green: ['yellow'],
  yellow: ['green', 'beige'],
} as const;

/**
 * 보색 관계 매핑
 * 각 색상에 대해 보색으로 간주되는 색상 목록을 정의한다.
 */
export const COMPLEMENTARY_COLORS: Partial<Record<Color, Color[]>> = {
  blue: ['yellow'],
  yellow: ['blue', 'purple'],
  red: ['green'],
  green: ['red'],
  purple: ['yellow'],
  navy: ['beige'],
  beige: ['navy'],
} as const;

/**
 * 부조화 색상 관계 매핑
 * 함께 사용하면 어울리지 않는 색상 조합을 정의한다.
 */
export const CLASH_COLORS: Partial<Record<Color, Color[]>> = {
  red: ['pink', 'purple'],
  pink: ['red', 'yellow'],
  purple: ['red'],
  green: ['blue'],
  yellow: ['pink'],
} as const;

// ─── 계절-날씨 매핑 ─────────────────────────────────────────────

/**
 * 날씨별 적합 계절 매핑
 * 추천 엔진에서 날씨 조건에 맞는 계절 태그를 확인할 때 사용한다.
 */
export const WEATHER_SEASON_MAP: Record<Weather, Season[]> = {
  /** 맑음 → 봄, 여름 */
  sunny: ['spring', 'summer'],
  /** 더움 → 여름 */
  hot: ['summer'],
  /** 비 → 봄, 가을 */
  rainy: ['spring', 'fall'],
  /** 추움 → 가을, 겨울 */
  cold: ['fall', 'winter'],
} as const;

// ─── 상황-스타일 매핑 ────────────────────────────────────────────

/**
 * 상황별 적합 스타일 매핑
 * 추천 엔진에서 상황에 맞는 스타일 태그를 확인할 때 사용한다.
 */
export const OCCASION_STYLE_MAP: Record<Occasion, StyleTag[]> = {
  /** 출근 → 포멀, 미니멀 */
  '출근': ['formal', 'minimal'],
  /** 데이트 → 캐주얼, 스트릿 */
  '데이트': ['casual', 'street'],
  /** 여행 → 캐주얼, 스트릿 */
  '여행': ['casual', 'street'],
  /** 면접 → 포멀, 미니멀 */
  '면접': ['formal', 'minimal'],
  /** 캐주얼 → 캐주얼, 스트릿, 미니멀 */
  '캐주얼': ['casual', 'street', 'minimal'],
} as const;
