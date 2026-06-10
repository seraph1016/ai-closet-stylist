/**
 * AI 옷장 스타일 추천 웹사이트 - 공통 유효성 검증 유틸리티
 *
 * 의류 아이템 등록/수정 시 사용되는 유효성 검증 함수들을 정의한다.
 * 각 검증 함수는 필드명을 포함한 구체적 오류 메시지를 반환하며,
 * 클라이언트 측과 서버 측 모두에서 재사용 가능하다.
 */

import { CATEGORIES, COLORS, SEASONS, STYLE_TAGS } from '@/lib/constants';

// ─── 검증 결과 타입 ─────────────────────────────────────────────

/** 개별 필드 검증 오류 */
export interface ValidationError {
  /** 오류가 발생한 필드명 */
  field: string;
  /** 구체적인 오류 메시지 (한국어) */
  message: string;
}

/** 전체 검증 결과 */
export interface ValidationResult {
  /** 모든 필드가 유효한지 여부 */
  valid: boolean;
  /** 발견된 오류 목록 */
  errors: ValidationError[];
}

// ─── 개별 필드 검증 함수 ─────────────────────────────────────────

/**
 * 카테고리 필드 검증
 * - 필수 필드: 값이 없으면 오류
 * - 허용 값: top, bottom, outer, shoes, accessory
 *
 * @param value - 검증할 카테고리 값
 * @returns 오류가 있으면 ValidationError, 유효하면 null
 */
export function validateCategory(value: unknown): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return {
      field: 'category',
      message: '카테고리는 필수 입력 항목입니다.',
    };
  }

  if (typeof value !== 'string') {
    return {
      field: 'category',
      message: '카테고리는 문자열이어야 합니다.',
    };
  }

  if (!(CATEGORIES as readonly string[]).includes(value)) {
    return {
      field: 'category',
      message: `카테고리는 ${CATEGORIES.join(', ')} 중 하나여야 합니다.`,
    };
  }

  return null;
}

/**
 * 색상 필드 검증
 * - 필수 필드: 값이 없으면 오류
 * - 허용 값: 사전정의 12색 (black, white, gray, red, blue, green, yellow, pink, brown, beige, navy, purple)
 *
 * @param value - 검증할 색상 값
 * @returns 오류가 있으면 ValidationError, 유효하면 null
 */
export function validateColor(value: unknown): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return {
      field: 'color',
      message: '색상은 필수 입력 항목입니다.',
    };
  }

  if (typeof value !== 'string') {
    return {
      field: 'color',
      message: '색상은 문자열이어야 합니다.',
    };
  }

  if (!(COLORS as readonly string[]).includes(value)) {
    return {
      field: 'color',
      message: `색상은 ${COLORS.join(', ')} 중 하나여야 합니다.`,
    };
  }

  return null;
}

/**
 * 계절 필드 검증
 * - 선택 필드이지만, 값이 제공된 경우 배열이어야 하며 1개 이상이어야 함
 * - 허용 값: spring, summer, fall, winter
 *
 * @param value - 검증할 계절 배열 값
 * @returns 오류가 있으면 ValidationError, 유효하면 null
 */
export function validateSeasons(value: unknown): ValidationError | null {
  // 계절은 선택 필드이므로, 값이 없거나 빈 배열이면 통과
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return {
      field: 'seasons',
      message: '계절은 배열 형태여야 합니다.',
    };
  }

  if (value.length === 0) {
    return null;
  }

  // 각 계절 값이 유효한지 확인
  const invalidSeasons = value.filter(
    (s) => typeof s !== 'string' || !(SEASONS as readonly string[]).includes(s)
  );

  if (invalidSeasons.length > 0) {
    return {
      field: 'seasons',
      message: `계절은 ${SEASONS.join(', ')} 중에서 선택해야 합니다.`,
    };
  }

  return null;
}

/**
 * 스타일 태그 필드 검증
 * - 선택 필드이지만, 값이 제공된 경우 배열이어야 하며 1개 이상 최대 4개
 * - 허용 값: casual, minimal, formal, street
 *
 * @param value - 검증할 스타일 태그 배열 값
 * @returns 오류가 있으면 ValidationError, 유효하면 null
 */
export function validateStyleTags(value: unknown): ValidationError | null {
  // 스타일 태그는 선택 필드이므로, 값이 없거나 빈 배열이면 통과
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return {
      field: 'styleTags',
      message: '스타일 태그는 배열 형태여야 합니다.',
    };
  }

  if (value.length === 0) {
    return null;
  }

  // 최대 4개 제한 확인
  if (value.length > 4) {
    return {
      field: 'styleTags',
      message: '스타일 태그는 최대 4개까지 선택할 수 있습니다.',
    };
  }

  // 각 스타일 태그 값이 유효한지 확인
  const invalidTags = value.filter(
    (tag) => typeof tag !== 'string' || !(STYLE_TAGS as readonly string[]).includes(tag)
  );

  if (invalidTags.length > 0) {
    return {
      field: 'styleTags',
      message: `스타일 태그는 ${STYLE_TAGS.join(', ')} 중에서 선택해야 합니다.`,
    };
  }

  return null;
}

/**
 * 사진 URL 필드 검증
 * - 선택 필드: 값이 없으면 통과
 * - 값이 제공된 경우 http:// 또는 https://로 시작해야 함
 *
 * @param value - 검증할 URL 값
 * @returns 오류가 있으면 ValidationError, 유효하면 null
 */
export function validateImageUrl(value: unknown): ValidationError | null {
  // 선택 필드이므로 값이 없으면 통과
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return {
      field: 'imageUrl',
      message: '사진 URL은 문자열이어야 합니다.',
    };
  }

  // http:// 또는 https://로 시작하는지 검증
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return {
      field: 'imageUrl',
      message: '사진 URL은 http:// 또는 https://로 시작해야 합니다.',
    };
  }

  return null;
}

/**
 * 메모 필드 검증
 * - 선택 필드: 값이 없으면 통과
 * - 값이 제공된 경우 최대 200자
 *
 * @param value - 검증할 메모 값
 * @returns 오류가 있으면 ValidationError, 유효하면 null
 */
export function validateMemo(value: unknown): ValidationError | null {
  // 선택 필드이므로 값이 없으면 통과
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return {
      field: 'memo',
      message: '메모는 문자열이어야 합니다.',
    };
  }

  if (value.length > 200) {
    return {
      field: 'memo',
      message: `메모는 최대 200자까지 입력할 수 있습니다. (현재 ${value.length}자)`,
    };
  }

  return null;
}

// ─── 통합 검증 함수 ─────────────────────────────────────────────

/**
 * 의류 아이템 전체 필드 유효성 검증
 *
 * 모든 필드(카테고리, 색상, 계절, 스타일 태그, 사진 URL, 메모)를 검증하고
 * 발견된 모든 오류를 한 번에 반환한다.
 *
 * @param data - 검증할 의류 아이템 데이터 (unknown 타입으로 안전한 검증)
 * @returns 검증 결과 (valid: 유효 여부, errors: 오류 목록)
 */
export function validateClothingItem(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // data가 객체인지 기본 검증
  if (data === null || data === undefined || typeof data !== 'object') {
    return {
      valid: false,
      errors: [
        { field: 'category', message: '카테고리는 필수 입력 항목입니다.' },
        { field: 'color', message: '색상은 필수 입력 항목입니다.' },
      ],
    };
  }

  const item = data as Record<string, unknown>;

  // 필수 필드 및 열거형 검증
  const categoryError = validateCategory(item.category);
  if (categoryError) errors.push(categoryError);

  const colorError = validateColor(item.color);
  if (colorError) errors.push(colorError);

  // 선택 필드 검증
  const seasonsError = validateSeasons(item.seasons);
  if (seasonsError) errors.push(seasonsError);

  const styleTagsError = validateStyleTags(item.styleTags);
  if (styleTagsError) errors.push(styleTagsError);

  const imageUrlError = validateImageUrl(item.imageUrl);
  if (imageUrlError) errors.push(imageUrlError);

  const memoError = validateMemo(item.memo);
  if (memoError) errors.push(memoError);

  return {
    valid: errors.length === 0,
    errors,
  };
}
