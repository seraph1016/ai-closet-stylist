'use server';

/**
 * AI 옷장 스타일 추천 웹사이트 - 추천 Server Action
 *
 * 사용자의 추천 입력(occasion, weather, preferredStyle)을 받아
 * RecommendService를 호출하고 코디 추천 결과를 반환한다.
 *
 * Next.js App Router의 Server Actions 패턴을 따르며,
 * useFormState 훅과 함께 사용할 수 있도록 prevState 파라미터를 포함한다.
 */

import { getItems } from '@/services/closet.service';
import { generateOutfits, type RecommendResult } from '@/services/recommend.service';
import type { Occasion, Weather, StyleTag } from '@/types';

// ─── ActionState 타입 정의 ───────────────────────────────────────

/**
 * 추천 Server Action 응답 상태 타입
 * 추천 요청 결과를 클라이언트에 전달하기 위한 표준 형식이다.
 */
export interface RecommendActionState {
  /** 액션 성공 여부 */
  success: boolean;
  /** 사용자에게 표시할 메시지 (오류 또는 안내) */
  message?: string;
  /** 추천 결과 (추천 목록 + 안내 메시지) */
  result?: RecommendResult;
  /** 오류 메시지 */
  error?: string;
}

// ─── Server Action ───────────────────────────────────────────────

/**
 * 코디 추천 Server Action
 *
 * FormData에서 occasion, weather, preferredStyle 필드를 추출하여
 * ClosetService로 전체 의류 아이템을 조회하고,
 * RecommendService.generateOutfits()를 호출하여 추천 결과를 반환한다.
 *
 * - 성공 시: 추천 결과(최대 3개 코디 조합)를 포함한 응답 반환
 * - 입력 오류 시: 허용된 값 목록을 포함한 에러 메시지 반환
 * - 서버 오류 시: 일반 실패 메시지 반환
 *
 * @param prevState - 이전 상태 (useFormState 훅 호환용)
 * @param formData - 폼에서 제출된 데이터 (occasion, weather, preferredStyle)
 * @returns RecommendActionState 응답
 */
export async function getRecommendationsAction(
  prevState: RecommendActionState,
  formData: FormData
): Promise<RecommendActionState> {
  try {
    // FormData에서 추천 입력 필드 추출
    const occasion = formData.get('occasion') as string;
    const weather = formData.get('weather') as string;
    const preferredStyle = formData.get('preferredStyle') as string;

    // 전체 의류 아이템 조회
    const items = await getItems();

    // 추천 엔진 호출 (입력 검증 + 조합 생성 + 점수 계산)
    const result = generateOutfits(
      {
        occasion: occasion as Occasion,
        weather: weather as Weather,
        preferredStyle: preferredStyle as StyleTag,
      },
      items
    );

    return {
      success: true,
      result,
    };
  } catch (error: unknown) {
    // 입력 검증 오류 또는 기타 서버 오류 처리
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: '추천 생성에 실패했습니다. 다시 시도해주세요.',
    };
  }
}
