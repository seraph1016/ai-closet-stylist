/**
 * AI 옷장 스타일 추천 웹사이트 - 쇼핑 분석 서비스
 *
 * 사용자의 옷장 데이터를 분석하여 부족한 아이템을 식별하고,
 * 쇼핑 검색 키워드를 생성하며 외부 쇼핑 사이트 검색 URL을 제공한다.
 * 실제 결제 기능은 포함하지 않으며, 검색 페이지 링크만 제공한다.
 */

import type {
  ClothingItem,
  WardrobeAnalysis,
  WardrobeGap,
  ShoppingKeyword,
  Category,
  Color,
  StyleTag,
} from '@/types';
import { CATEGORIES, COLORS, STYLE_TAGS } from '@/lib/constants';

// ─── 카테고리별 아이템명 매핑 ────────────────────────────────────

/**
 * 카테고리별 한글 아이템명 매핑
 * 키워드 생성 시 카테고리를 구체적인 아이템명으로 변환한다.
 */
const CATEGORY_ITEM_NAMES: Record<Category, string[]> = {
  top: ['티셔츠', '셔츠'],
  bottom: ['바지', '치마'],
  outer: ['자켓', '코트'],
  shoes: ['운동화', '구두'],
  accessory: ['모자', '가방'],
};

// ─── 색상 한글명 매핑 ────────────────────────────────────────────

/**
 * 영문 색상을 한글 색상명으로 변환하는 매핑
 * 키워드 생성 시 사용자 친화적인 한글 키워드를 만들기 위해 사용한다.
 */
const COLOR_KOREAN_NAMES: Record<Color, string> = {
  black: '블랙',
  white: '화이트',
  gray: '그레이',
  red: '레드',
  blue: '블루',
  green: '그린',
  yellow: '옐로우',
  pink: '핑크',
  brown: '브라운',
  beige: '베이지',
  navy: '네이비',
  purple: '퍼플',
};

// ─── 색상 조화 추천 매핑 ─────────────────────────────────────────

/**
 * 색상별 추천 조합 색상 목록
 * 부족 항목에 대한 추천 이유 생성 시, 보유 아이템과의 색상 조화를 설명한다.
 */
const COLOR_HARMONY_SUGGESTIONS: Partial<Record<Color, Color[]>> = {
  black: ['white', 'gray', 'red', 'blue', 'beige'],
  white: ['black', 'navy', 'blue', 'beige', 'gray'],
  gray: ['black', 'white', 'navy', 'pink', 'blue'],
  red: ['black', 'white', 'navy', 'gray', 'beige'],
  blue: ['white', 'beige', 'gray', 'navy', 'brown'],
  green: ['white', 'beige', 'brown', 'black', 'gray'],
  yellow: ['white', 'navy', 'gray', 'blue', 'black'],
  pink: ['white', 'gray', 'navy', 'black', 'beige'],
  brown: ['white', 'beige', 'green', 'navy', 'black'],
  beige: ['navy', 'brown', 'white', 'black', 'blue'],
  navy: ['white', 'beige', 'gray', 'pink', 'yellow'],
  purple: ['white', 'gray', 'black', 'beige', 'pink'],
};

// ─── ShoppingService 구현 ────────────────────────────────────────

/**
 * 옷장 데이터를 카테고리별, 색상별, 스타일별로 분석한다.
 * 각 카테고리에서 아이템 수가 2개 미만인 경우를 부족 항목(gap)으로 식별한다.
 *
 * @param items - 사용자의 전체 의류 아이템 목록
 * @returns WardrobeAnalysis - 분포 데이터 및 부족 항목 목록
 */
export function analyzeWardrobe(items: ClothingItem[]): WardrobeAnalysis {
  // 카테고리별 분포 집계
  const categoryDistribution = {} as Record<Category, number>;
  for (const cat of CATEGORIES) {
    categoryDistribution[cat] = 0;
  }

  // 색상별 분포 집계
  const colorDistribution = {} as Record<Color, number>;
  for (const color of COLORS) {
    colorDistribution[color] = 0;
  }

  // 스타일별 분포 집계
  const styleDistribution = {} as Record<StyleTag, number>;
  for (const style of STYLE_TAGS) {
    styleDistribution[style] = 0;
  }

  // 아이템 순회하며 각 분포 카운트 증가
  for (const item of items) {
    categoryDistribution[item.category]++;
    colorDistribution[item.color]++;
    for (const tag of item.styleTags) {
      styleDistribution[tag]++;
    }
  }

  // 부족 항목 식별: 카테고리별 2개 미만인 경우를 gap으로 판정
  const gaps: WardrobeGap[] = [];
  for (const cat of CATEGORIES) {
    if (categoryDistribution[cat] < 2) {
      gaps.push({
        category: cat,
        currentCount: categoryDistribution[cat],
      });
    }
  }

  return {
    totalItems: items.length,
    categoryDistribution,
    colorDistribution,
    styleDistribution,
    gaps,
  };
}

/**
 * 부족 항목(gaps)을 기반으로 "[색상] [아이템명]" 형식의 쇼핑 검색 키워드를 생성한다.
 * 각 키워드에는 추천 이유와 기존 보유 아이템과의 연관성이 포함된다.
 * 최대 10개의 키워드를 생성한다.
 *
 * @param gaps - 분석에서 식별된 부족 항목 목록
 * @param items - 사용자의 전체 의류 아이템 목록 (추천 이유 생성용)
 * @returns ShoppingKeyword[] - 생성된 쇼핑 키워드 목록
 */
export function generateKeywords(
  gaps: WardrobeGap[],
  items: ClothingItem[]
): ShoppingKeyword[] {
  const keywords: ShoppingKeyword[] = [];
  const maxKeywords = 10;

  for (const gap of gaps) {
    if (keywords.length >= maxKeywords) break;

    // 기존 보유 아이템에서 가장 많이 사용된 색상 찾기
    const existingColors = items.map((item) => item.color);
    const colorCounts: Partial<Record<Color, number>> = {};
    for (const c of existingColors) {
      colorCounts[c] = (colorCounts[c] || 0) + 1;
    }

    // 부족 카테고리에 추천할 색상 결정
    const suggestedColors = getSuggestedColors(items, gap);
    const itemNames = CATEGORY_ITEM_NAMES[gap.category];

    // 각 추천 색상 + 아이템명 조합으로 키워드 생성
    for (const color of suggestedColors) {
      if (keywords.length >= maxKeywords) break;

      const itemName = itemNames[keywords.length % itemNames.length];
      const koreanColor = COLOR_KOREAN_NAMES[color];
      const keyword = `${koreanColor} ${itemName}`;

      // 추천 이유 생성: 보유 아이템과의 색상 조화 기반
      const relatedItems = getRelatedItems(items, color, gap.category);
      const reason = generateReason(color, relatedItems, gap.category);

      keywords.push({
        keyword,
        reason,
        relatedItems: relatedItems.map((item) => formatItemName(item)),
        urls: buildSearchUrls(keyword),
      });
    }
  }

  return keywords;
}

/**
 * 검색 키워드에 대한 네이버쇼핑 및 구글쇼핑 검색 URL을 생성한다.
 * URL에는 키워드가 인코딩되어 쿼리 파라미터로 포함된다.
 *
 * @param keyword - 검색할 키워드 문자열
 * @returns { naver: string; google: string } - 네이버/구글 검색 URL
 */
export function buildSearchUrls(keyword: string): { naver: string; google: string } {
  const encodedKeyword = encodeURIComponent(keyword);
  return {
    naver: `https://search.shopping.naver.com/search/all?query=${encodedKeyword}`,
    google: `https://www.google.com/search?tbm=shop&q=${encodedKeyword}`,
  };
}

// ─── 메인 함수: 쇼핑 추천 결과 생성 ──────────────────────────────

/**
 * 쇼핑 추천 결과 타입
 * 성공 시 키워드 목록, 실패 시 안내 메시지를 반환한다.
 */
export interface ShoppingRecommendationResult {
  /** 성공 여부 */
  success: boolean;
  /** 안내 메시지 (아이템 부족 또는 균형 상태) */
  message?: string;
  /** 생성된 쇼핑 키워드 목록 */
  keywords?: ShoppingKeyword[];
  /** 옷장 분석 결과 */
  analysis?: WardrobeAnalysis;
}

/**
 * 쇼핑 추천의 메인 진입점.
 * 옷장 데이터를 분석하여 부족 항목을 식별하고 쇼핑 키워드를 생성한다.
 *
 * - 아이템 3개 미만: 분석 불가 안내 메시지 반환
 * - 부족 항목 없음: 균형 상태 안내 메시지 반환
 * - 부족 항목 존재: 쇼핑 키워드 생성 및 반환
 *
 * @param items - 사용자의 전체 의류 아이템 목록
 * @returns ShoppingRecommendationResult - 추천 결과
 */
export function getShoppingRecommendations(
  items: ClothingItem[]
): ShoppingRecommendationResult {
  // 아이템 3개 미만 시 분석 불가 안내
  if (items.length < 3) {
    return {
      success: false,
      message: '충분한 분석을 위해 3개 이상의 아이템을 등록해주세요.',
    };
  }

  // 옷장 분석 수행
  const analysis = analyzeWardrobe(items);

  // 부족 항목이 없으면 균형 메시지 반환
  if (analysis.gaps.length === 0) {
    return {
      success: true,
      message: '옷장 구성이 균형 잡혀 있습니다!',
      analysis,
    };
  }

  // 부족 항목 기반 키워드 생성
  const keywords = generateKeywords(analysis.gaps, items);

  return {
    success: true,
    keywords,
    analysis,
  };
}

// ─── 내부 헬퍼 함수 ──────────────────────────────────────────────

/**
 * 부족 카테고리에 추천할 색상 목록을 결정한다.
 * 기존 보유 아이템의 색상과 조화를 이루는 색상을 우선 추천한다.
 *
 * @param items - 전체 보유 아이템
 * @param gap - 부족 항목 정보
 * @returns Color[] - 추천 색상 목록 (최대 2개)
 */
function getSuggestedColors(items: ClothingItem[], gap: WardrobeGap): Color[] {
  // 기존 보유 아이템의 색상 빈도 계산
  const colorCounts: Partial<Record<Color, number>> = {};
  for (const item of items) {
    colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
  }

  // 가장 많이 보유한 색상 기준으로 조화 색상 추천
  const sortedColors = (Object.entries(colorCounts) as [Color, number][])
    .sort((a, b) => b[1] - a[1]);

  const suggestedColors: Color[] = [];

  for (const [dominantColor] of sortedColors) {
    const harmonious = COLOR_HARMONY_SUGGESTIONS[dominantColor] || [];
    for (const harmColor of harmonious) {
      if (!suggestedColors.includes(harmColor) && suggestedColors.length < 2) {
        suggestedColors.push(harmColor);
      }
    }
    if (suggestedColors.length >= 2) break;
  }

  // 추천 색상이 부족하면 기본 색상 추가
  if (suggestedColors.length === 0) {
    suggestedColors.push('black', 'white');
  } else if (suggestedColors.length === 1) {
    suggestedColors.push('black');
  }

  return suggestedColors;
}

/**
 * 특정 색상과 조화를 이루는 기존 보유 아이템을 찾는다.
 * 추천 이유에서 참조할 관련 아이템 목록을 생성한다.
 *
 * @param items - 전체 보유 아이템
 * @param suggestedColor - 추천하려는 색상
 * @param gapCategory - 부족한 카테고리
 * @returns ClothingItem[] - 관련 아이템 목록 (최대 2개)
 */
function getRelatedItems(
  items: ClothingItem[],
  suggestedColor: Color,
  gapCategory: Category
): ClothingItem[] {
  // 추천 색상과 조화를 이루는 색상의 아이템 찾기
  const harmoniousColors = COLOR_HARMONY_SUGGESTIONS[suggestedColor] || [];
  const related = items
    .filter(
      (item) =>
        item.category !== gapCategory &&
        (harmoniousColors.includes(item.color) || item.color === suggestedColor)
    )
    .slice(0, 2);

  // 관련 아이템이 없으면 아무 아이템이나 반환
  if (related.length === 0) {
    return items.filter((item) => item.category !== gapCategory).slice(0, 1);
  }

  return related;
}

/**
 * 추천 이유 문자열을 생성한다.
 * 보유 아이템과의 색상 조화 또는 스타일 매칭 근거를 포함한다.
 *
 * @param suggestedColor - 추천 색상
 * @param relatedItems - 관련 보유 아이템 목록
 * @param gapCategory - 부족한 카테고리
 * @returns string - 추천 이유 설명
 */
function generateReason(
  suggestedColor: Color,
  relatedItems: ClothingItem[],
  gapCategory: Category
): string {
  const koreanColor = COLOR_KOREAN_NAMES[suggestedColor];
  const categoryName = getCategoryKoreanName(gapCategory);

  if (relatedItems.length > 0) {
    const relatedItem = relatedItems[0];
    const relatedColorKorean = COLOR_KOREAN_NAMES[relatedItem.color];
    return `보유한 ${relatedColorKorean} 아이템과 색상 조화를 이루는 ${koreanColor} ${categoryName}을(를) 추천합니다.`;
  }

  return `${categoryName} 카테고리 보충을 위해 ${koreanColor} 아이템을 추천합니다.`;
}

/**
 * 의류 아이템을 사용자 친화적인 이름으로 변환한다.
 * "[색상] [카테고리명]" 형식으로 반환한다.
 *
 * @param item - 의류 아이템
 * @returns string - 아이템 표시명
 */
function formatItemName(item: ClothingItem): string {
  const colorKorean = COLOR_KOREAN_NAMES[item.color];
  const categoryKorean = getCategoryKoreanName(item.category);
  return `${colorKorean} ${categoryKorean}`;
}

/**
 * 카테고리 영문명을 한글명으로 변환한다.
 *
 * @param category - 영문 카테고리명
 * @returns string - 한글 카테고리명
 */
function getCategoryKoreanName(category: Category): string {
  const names: Record<Category, string> = {
    top: '상의',
    bottom: '하의',
    outer: '아우터',
    shoes: '신발',
    accessory: '액세서리',
  };
  return names[category];
}
