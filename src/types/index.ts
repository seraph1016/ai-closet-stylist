/**
 * AI 옷장 스타일 추천 웹사이트 - 공유 타입 정의
 *
 * 시스템 전반에서 사용되는 핵심 타입들을 정의한다.
 * 카테고리, 색상, 계절, 스타일 태그, 상황, 날씨 등의 열거형과
 * 추천 엔진, 쇼핑 분석, 옷장 관리에 필요한 인터페이스를 포함한다.
 */

// ─── 열거형 타입 ───────────────────────────────────────────────

/** 의류 카테고리 (상의, 하의, 아우터, 신발, 액세서리) */
export type Category = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory';

/** 사전정의 색상 12색 */
export type Color =
  | 'black'
  | 'white'
  | 'gray'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'pink'
  | 'brown'
  | 'beige'
  | 'navy'
  | 'purple';

/** 계절 (봄, 여름, 가을, 겨울) */
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/** 스타일 태그 (캐주얼, 미니멀, 포멀, 스트릿) */
export type StyleTag = 'casual' | 'minimal' | 'formal' | 'street';

/** 상황 (출근, 데이트, 여행, 면접, 캐주얼) */
export type Occasion = '출근' | '데이트' | '여행' | '면접' | '캐주얼';

/** 날씨 (맑음, 비, 추위, 더위) */
export type Weather = 'sunny' | 'rainy' | 'cold' | 'hot';

// ─── 의류 아이템 ──────────────────────────────────────────────

/** 의류 아이템 (DB 모델 대응) */
export interface ClothingItem {
  id: string;
  imageUrl: string | null;
  category: Category;
  color: Color;
  seasons: Season[];
  styleTags: StyleTag[];
  memo: string | null;
  wearCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── 코디 조합 구조 ──────────────────────────────────────────

/**
 * 코디 조합 구조
 * - top + bottom + shoes (기본 조합)
 * - top + bottom + outer + shoes (아우터 포함 조합)
 * - dress + outer + shoes (원피스 조합)
 */
export type OutfitStructure =
  | { top: ClothingItem; bottom: ClothingItem; shoes: ClothingItem }
  | { top: ClothingItem; bottom: ClothingItem; outer: ClothingItem; shoes: ClothingItem }
  | { dress: ClothingItem; outer: ClothingItem; shoes: ClothingItem };

/** 코디 조합 (OutfitStructure의 별칭) */
export type OutfitCombination = OutfitStructure;

// ─── 추천 엔진 ───────────────────────────────────────────────

/** 추천 입력 (상황, 날씨, 선호 스타일) */
export interface RecommendInput {
  occasion: Occasion;
  weather: Weather;
  preferredStyle: StyleTag;
}

/** 추천 결과 (코디 조합 + 점수 + 설명) */
export interface OutfitRecommendation {
  outfit: OutfitCombination;
  totalScore: number;
  explanation: string;
  scores: {
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
  };
}

// ─── 쇼핑 분석 ───────────────────────────────────────────────

/** 쇼핑 키워드 ("[색상] [아이템명]" 형식 + 검색 URL) */
export interface ShoppingKeyword {
  /** "[색상] [아이템명]" 형식의 검색 키워드 */
  keyword: string;
  /** 추천 이유 (색상 조화 또는 스타일 매칭 근거) */
  reason: string;
  /** 보유 아이템명 참조 목록 */
  relatedItems: string[];
  /** 외부 쇼핑 검색 URL */
  urls: {
    naver: string;
    google: string;
  };
}

// ─── 옷장 필터 및 분석 ────────────────────────────────────────

/** 옷장 필터 (카테고리, 계절 선택적) */
export interface ClothingFilter {
  category?: Category;
  season?: Season;
}

/** 옷장 분석 결과 (카테고리/색상/스타일 분포 + 부족 항목) */
export interface WardrobeAnalysis {
  /** 전체 아이템 수 */
  totalItems: number;
  /** 카테고리별 아이템 수 분포 */
  categoryDistribution: Record<Category, number>;
  /** 색상별 아이템 수 분포 */
  colorDistribution: Record<Color, number>;
  /** 스타일별 아이템 수 분포 */
  styleDistribution: Record<StyleTag, number>;
  /** 부족 항목 목록 */
  gaps: WardrobeGap[];
}

/** 부족 항목 (특정 카테고리/색상/스타일 조합의 아이템 부족) */
export interface WardrobeGap {
  /** 부족한 카테고리 */
  category: Category;
  /** 부족한 색상 (선택적) */
  color?: Color;
  /** 부족한 스타일 (선택적) */
  style?: StyleTag;
  /** 현재 보유 수량 */
  currentCount: number;
}
