/**
 * 추천 엔진 서비스 (RecommendService)
 *
 * 사용자의 보유 의류를 기반으로 상황별 코디 조합을 생성하고,
 * 점수를 계산하여 상위 3개 추천 결과를 반환한다.
 *
 * 주요 기능:
 * - 입력 검증 (occasion, weather, preferredStyle)
 * - 유효한 코디 조합 구조 생성 (top+bottom+shoes, top+bottom+outer+shoes)
 * - 점수 계산 및 정렬
 * - 부족 카테고리 안내
 */

import type {
  ClothingItem,
  RecommendInput,
  OutfitRecommendation,
  OutfitCombination,
  Category,
} from '@/types';
import { OCCASIONS, WEATHERS, STYLE_TAGS } from '@/lib/constants';
import { scoreOutfit, type ScoringContext } from '@/services/scoring/index';

// ─── 결과 타입 정의 ──────────────────────────────────────────────

/** 추천 결과 (추천 목록 + 안내 메시지) */
export interface RecommendResult {
  /** 추천된 코디 조합 목록 (최대 3개) */
  recommendations: OutfitRecommendation[];
  /** 안내 메시지 (부족 카테고리, 빈 옷장 등) */
  message?: string;
}

// ─── 상수 ──────────────────────────────────────────────────────

/** 최대 반환 추천 수 */
const MAX_RECOMMENDATIONS = 3;

/** 조합 폭발 방지 임계값: 이 값 초과 시 랜덤 샘플링 */
const MAX_COMBINATIONS_THRESHOLD = 1000;

/** 랜덤 샘플링 시 추출할 조합 수 */
const SAMPLE_SIZE = 200;

// ─── 입력 검증 ──────────────────────────────────────────────────

/**
 * 추천 입력값의 유효성을 검증한다.
 *
 * occasion, weather, preferredStyle 각각이 허용된 값 목록에 포함되는지 확인하고,
 * 유효하지 않은 값이 있으면 허용 값 목록을 포함한 에러를 throw한다.
 *
 * @param input - 추천 입력 (occasion, weather, preferredStyle)
 * @throws Error - 허용되지 않은 값이 포함된 경우
 */
export function validateRecommendInput(input: RecommendInput): void {
  const errors: string[] = [];

  if (!(OCCASIONS as readonly string[]).includes(input.occasion)) {
    errors.push(
      `허용되지 않은 occasion 값입니다: "${input.occasion}". 허용된 값: ${OCCASIONS.join(', ')}`
    );
  }

  if (!(WEATHERS as readonly string[]).includes(input.weather)) {
    errors.push(
      `허용되지 않은 weather 값입니다: "${input.weather}". 허용된 값: ${WEATHERS.join(', ')}`
    );
  }

  if (!(STYLE_TAGS as readonly string[]).includes(input.preferredStyle)) {
    errors.push(
      `허용되지 않은 preferredStyle 값입니다: "${input.preferredStyle}". 허용된 값: ${STYLE_TAGS.join(', ')}`
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

// ─── 아이템 그룹핑 ──────────────────────────────────────────────

/** 카테고리별로 그룹핑된 아이템 */
interface GroupedItems {
  top: ClothingItem[];
  bottom: ClothingItem[];
  outer: ClothingItem[];
  shoes: ClothingItem[];
}

/**
 * 아이템을 카테고리별로 그룹핑한다.
 *
 * @param items - 전체 의류 아이템 배열
 * @returns 카테고리별 아이템 그룹
 */
function groupItemsByCategory(items: ClothingItem[]): GroupedItems {
  return {
    top: items.filter((item) => item.category === 'top'),
    bottom: items.filter((item) => item.category === 'bottom'),
    outer: items.filter((item) => item.category === 'outer'),
    shoes: items.filter((item) => item.category === 'shoes'),
  };
}

// ─── 조합 생성 ──────────────────────────────────────────────────

/**
 * 유효한 코디 조합을 생성한다.
 *
 * MVP에서는 다음 두 가지 구조를 생성한다:
 * 1. top + bottom + shoes (기본 3피스)
 * 2. top + bottom + outer + shoes (아우터 포함 4피스)
 *
 * 조합 폭발을 방지하기 위해 총 조합 수가 임계값을 초과하면
 * 랜덤 샘플링을 적용한다.
 *
 * @param grouped - 카테고리별 그룹핑된 아이템
 * @returns 생성된 코디 조합 배열
 */
function generateCombinations(grouped: GroupedItems): OutfitCombination[] {
  const combinations: OutfitCombination[] = [];

  const { top, bottom, outer, shoes } = grouped;

  // 기본 구조(top+bottom+shoes) 조합 수 계산
  const basicCount = top.length * bottom.length * shoes.length;
  // 아우터 포함 구조(top+bottom+outer+shoes) 조합 수 계산
  const outerCount = top.length * bottom.length * outer.length * shoes.length;
  const totalCount = basicCount + outerCount;

  // 조합 폭발 방지: 임계값 초과 시 랜덤 샘플링
  if (totalCount > MAX_COMBINATIONS_THRESHOLD) {
    return generateSampledCombinations(grouped, SAMPLE_SIZE);
  }

  // 기본 조합: top + bottom + shoes
  for (const t of top) {
    for (const b of bottom) {
      for (const s of shoes) {
        combinations.push({ top: t, bottom: b, shoes: s });
      }
    }
  }

  // 아우터 포함 조합: top + bottom + outer + shoes
  if (outer.length > 0) {
    for (const t of top) {
      for (const b of bottom) {
        for (const o of outer) {
          for (const s of shoes) {
            combinations.push({ top: t, bottom: b, outer: o, shoes: s });
          }
        }
      }
    }
  }

  return combinations;
}

/**
 * 랜덤 샘플링으로 조합을 생성한다.
 *
 * 조합 수가 임계값을 초과할 때 사용되며,
 * 지정된 수만큼 랜덤하게 조합을 생성한다.
 *
 * @param grouped - 카테고리별 그룹핑된 아이템
 * @param sampleSize - 생성할 조합 수
 * @returns 랜덤 샘플링된 코디 조합 배열
 */
function generateSampledCombinations(
  grouped: GroupedItems,
  sampleSize: number
): OutfitCombination[] {
  const combinations: OutfitCombination[] = [];
  const { top, bottom, outer, shoes } = grouped;

  // 기본 조합과 아우터 조합을 절반씩 샘플링
  const basicSampleSize = outer.length > 0 ? Math.ceil(sampleSize / 2) : sampleSize;
  const outerSampleSize = outer.length > 0 ? Math.floor(sampleSize / 2) : 0;

  // 기본 조합 샘플링: top + bottom + shoes
  for (let i = 0; i < basicSampleSize; i++) {
    const t = top[Math.floor(Math.random() * top.length)];
    const b = bottom[Math.floor(Math.random() * bottom.length)];
    const s = shoes[Math.floor(Math.random() * shoes.length)];
    combinations.push({ top: t, bottom: b, shoes: s });
  }

  // 아우터 포함 조합 샘플링: top + bottom + outer + shoes
  if (outer.length > 0) {
    for (let i = 0; i < outerSampleSize; i++) {
      const t = top[Math.floor(Math.random() * top.length)];
      const b = bottom[Math.floor(Math.random() * bottom.length)];
      const o = outer[Math.floor(Math.random() * outer.length)];
      const s = shoes[Math.floor(Math.random() * shoes.length)];
      combinations.push({ top: t, bottom: b, outer: o, shoes: s });
    }
  }

  return combinations;
}

// ─── 조합에서 아이템 추출 ─────────────────────────────────────────

/**
 * 코디 조합에서 아이템 배열을 추출한다.
 *
 * @param outfit - 코디 조합
 * @returns 조합에 포함된 의류 아이템 배열
 */
export function getItemsFromOutfit(outfit: OutfitCombination): ClothingItem[] {
  if ('dress' in outfit) {
    return [outfit.dress, outfit.outer, outfit.shoes];
  }
  if ('outer' in outfit) {
    return [outfit.top, outfit.bottom, outfit.outer, outfit.shoes];
  }
  return [outfit.top, outfit.bottom, outfit.shoes];
}

// ─── 부족 카테고리 확인 ─────────────────────────────────────────

/**
 * 필수 카테고리(top, bottom, shoes) 중 아이템이 없는 카테고리를 식별한다.
 *
 * @param grouped - 카테고리별 그룹핑된 아이템
 * @returns 부족한 카테고리명 배열
 */
function getMissingCategories(grouped: GroupedItems): Category[] {
  const missing: Category[] = [];
  if (grouped.top.length === 0) missing.push('top');
  if (grouped.bottom.length === 0) missing.push('bottom');
  if (grouped.shoes.length === 0) missing.push('shoes');
  return missing;
}

/**
 * 카테고리명을 한국어로 변환한다.
 *
 * @param category - 카테고리 영문명
 * @returns 카테고리 한국어명
 */
function categoryToKorean(category: Category): string {
  const map: Record<Category, string> = {
    top: '상의',
    bottom: '하의',
    outer: '아우터',
    shoes: '신발',
    accessory: '액세서리',
  };
  return map[category] || category;
}

// ─── 추천 설명 생성 ──────────────────────────────────────────────

/**
 * 추천 코디 조합에 대한 설명을 생성한다. (템플릿 기반)
 *
 * 색상 조화, 계절 적합성, 상황 적합성 중 존재하는 속성을 기반으로
 * 자연어 설명을 생성한다. 최대 200자 제한.
 *
 * [향후 LLM 교체 가능 지점]
 * 이 함수를 LLM API 호출로 대체하면 더 자연스러운 설명을 생성할 수 있다.
 * src/interfaces/llm.interface.ts의 LLMInterface.generateExplanation() 참조
 *
 * @param outfit - 코디 조합
 * @param context - 추천 입력 (상황, 날씨, 선호 스타일)
 * @returns 최대 200자의 추천 설명 문자열
 */
export function generateExplanation(
  outfit: OutfitCombination,
  context: RecommendInput
): string {
  const items = getItemsFromOutfit(outfit);
  const reasons: string[] = [];

  // 색상 조화 설명
  const colors = items.map((item) => item.color);
  const uniqueColors = [...new Set(colors)];
  if (uniqueColors.length > 0) {
    if (uniqueColors.length === 1) {
      reasons.push(`${uniqueColors[0]} 톤 통일로 깔끔한 룩`);
    } else {
      reasons.push(`${uniqueColors.slice(0, 2).join('과 ')} 색상이 조화로운 조합`);
    }
  }

  // 계절 적합성 설명
  const allSeasons = items.flatMap((item) => item.seasons);
  const uniqueSeasons = [...new Set(allSeasons)];
  if (uniqueSeasons.length > 0) {
    const seasonKorean: Record<string, string> = {
      spring: '봄',
      summer: '여름',
      fall: '가을',
      winter: '겨울',
    };
    const seasonNames = uniqueSeasons
      .slice(0, 2)
      .map((s) => seasonKorean[s] || s);
    reasons.push(`${seasonNames.join('/')}에 적합한 아이템 구성`);
  }

  // 상황 적합성 설명
  const allStyles = items.flatMap((item) => item.styleTags);
  const uniqueStyles = [...new Set(allStyles)];
  if (uniqueStyles.length > 0) {
    reasons.push(`${context.occasion}에 어울리는 ${uniqueStyles[0]} 스타일`);
  }

  // 모든 속성이 부재할 경우 기본 설명 반환
  if (reasons.length === 0) {
    return '다양한 아이템을 활용한 코디 조합입니다.';
  }

  // 최대 200자 제한
  const explanation = reasons.join('. ') + '.';
  if (explanation.length > 200) {
    return explanation.substring(0, 197) + '...';
  }
  return explanation;
}

// ─── 메인 함수: generateOutfits ─────────────────────────────────

/**
 * 상황별 코디 추천을 생성한다.
 *
 * 사용자의 보유 의류를 기반으로 유효한 코디 조합을 생성하고,
 * 점수를 계산하여 상위 3개 결과를 반환한다.
 *
 * @param input - 추천 입력 (occasion, weather, preferredStyle)
 * @param items - 사용자 보유 의류 아이템 배열
 * @returns 추천 결과 (추천 목록 + 안내 메시지)
 * @throws Error - 허용되지 않은 입력값이 포함된 경우
 */
export function generateOutfits(
  input: RecommendInput,
  items: ClothingItem[]
): RecommendResult {
  // 1. 입력 검증
  validateRecommendInput(input);

  // 2. 보유 아이템 0개 시 빈 결과 반환
  if (items.length === 0) {
    return {
      recommendations: [],
      message: '옷장에 옷을 먼저 등록해주세요! 코디 추천을 위해 의류를 등록해보세요.',
    };
  }

  // 3. 아이템을 카테고리별로 그룹핑
  const grouped = groupItemsByCategory(items);

  // 4. 필수 카테고리 확인
  const missingCategories = getMissingCategories(grouped);
  if (missingCategories.length === 3) {
    // top, bottom, shoes 모두 없으면 조합 불가
    const missingKorean = missingCategories.map(categoryToKorean).join(', ');
    return {
      recommendations: [],
      message: `코디 조합을 생성할 수 없습니다. 부족한 카테고리: ${missingKorean}. 해당 카테고리의 아이템을 추가해보세요.`,
    };
  }

  // 필수 카테고리(top, bottom, shoes) 중 하나라도 비어있으면 조합 불가
  if (missingCategories.length > 0) {
    const missingKorean = missingCategories.map(categoryToKorean).join(', ');
    return {
      recommendations: [],
      message: `더 다양한 추천을 위해 ${missingKorean} 아이템을 추가해보세요.`,
    };
  }

  // 5. 유효한 조합 생성
  const combinations = generateCombinations(grouped);

  if (combinations.length === 0) {
    return {
      recommendations: [],
      message: '조건에 맞는 코디 조합을 찾지 못했습니다.',
    };
  }

  // 6. 평균 착용 횟수 계산 (전체 아이템 기준)
  const averageWearCount =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.wearCount, 0) / items.length
      : 0;

  // 7. 점수 계산 컨텍스트 설정
  const scoringContext: ScoringContext = {
    weather: input.weather,
    occasion: input.occasion,
    averageWearCount,
    feedbackType: null,
  };

  // 8. 각 조합에 대해 점수 계산
  const scoredCombinations = combinations.map((outfit) => {
    const outfitItems = getItemsFromOutfit(outfit);
    const score = scoreOutfit(outfitItems, scoringContext);
    const explanation = generateExplanation(outfit, input);

    return {
      outfit,
      totalScore: score.totalScore,
      explanation,
      scores: {
        colorHarmony: score.colorHarmony,
        seasonMatch: score.seasonMatch,
        occasionMatch: score.occasionMatch,
        wearPenalty: score.wearPenalty,
        feedbackBonus: score.feedbackBonus,
      },
    } satisfies OutfitRecommendation;
  });

  // 9. 총점 기준 내림차순 정렬
  scoredCombinations.sort((a, b) => b.totalScore - a.totalScore);

  // 10. 상위 3개 반환
  const recommendations = scoredCombinations.slice(0, MAX_RECOMMENDATIONS);

  // 11. 3개 미만 시 부족 카테고리 안내 메시지 추가
  let message: string | undefined;
  if (recommendations.length < MAX_RECOMMENDATIONS) {
    // outer가 없어서 조합이 적을 수 있음
    const suggestions: string[] = [];
    if (grouped.outer.length === 0) {
      suggestions.push(categoryToKorean('outer'));
    }
    if (suggestions.length > 0) {
      message = `더 다양한 추천을 위해 ${suggestions.join(', ')} 아이템을 추가해보세요.`;
    } else {
      message = '보유 아이템 수가 적어 추천 가능한 조합이 제한됩니다.';
    }
  }

  return {
    recommendations,
    message,
  };
}
