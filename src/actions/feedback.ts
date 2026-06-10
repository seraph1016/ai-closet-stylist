'use server';

/**
 * AI 옷장 스타일 추천 웹사이트 - 피드백 Server Action
 *
 * 추천된 코디 조합에 대한 사용자 피드백(좋아요/싫어요)을 저장하는 Server Action을 정의한다.
 * 동일 코디에 대해 기존 피드백이 있으면 새로운 선택으로 덮어쓴다.
 *
 * 서비스 계층(feedback.service)을 호출하며,
 * 실패 시 사용자에게 오류 메시지를 반환한다.
 *
 * Requirements: 7.1, 7.5
 */

import { saveFeedback } from '@/services/feedback.service';

// ─── FeedbackActionState 타입 정의 ──────────────────────────────

/**
 * 피드백 Server Action 응답 상태 타입
 * 피드백 저장 결과를 클라이언트에 전달하기 위한 표준 형식이다.
 */
export interface FeedbackActionState {
  /** 액션 성공 여부 */
  success: boolean;
  /** 사용자에게 표시할 메시지 */
  message: string;
}

// ─── Server Action ────────────────────────────────────────────────

/**
 * 피드백 저장 Server Action
 *
 * 사용자가 추천된 코디 조합에 좋아요 또는 싫어요를 선택했을 때 호출된다.
 * 동일 코디에 대해 기존 피드백이 존재할 경우 새로운 선택으로 덮어쓴다.
 *
 * - 성공 시: 저장 완료 메시지 반환
 * - 실패 시: 오류 메시지 반환 (피드백 버튼 상태 롤백에 활용)
 *
 * @param outfitId - 코디 조합 식별자
 * @param type - 피드백 유형 ('like' 또는 'dislike')
 * @returns FeedbackActionState 응답
 */
export async function saveFeedbackAction(
  outfitId: string,
  type: 'like' | 'dislike'
): Promise<FeedbackActionState> {
  try {
    await saveFeedback(outfitId, type);
    return {
      success: true,
      message: '피드백이 저장되었습니다.',
    };
  } catch (error: unknown) {
    // 피드백 저장 실패 시 오류 메시지 반환
    // 클라이언트에서 이 응답을 받아 피드백 버튼 상태를 변경 전으로 롤백한다
    return {
      success: false,
      message: '피드백 저장에 실패했습니다. 다시 시도해주세요.',
    };
  }
}
