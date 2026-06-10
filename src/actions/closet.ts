'use server';

/**
 * AI 옷장 스타일 추천 웹사이트 - 옷장 CRUD Server Actions
 *
 * 의류 아이템의 등록, 수정, 삭제를 위한 Server Actions를 정의한다.
 * 각 액션은 서비스 계층(closet.service)을 호출하고,
 * 유효성 검증 오류 또는 서버 오류 발생 시 ActionState 형태로 결과를 반환한다.
 *
 * Next.js App Router의 Server Actions 패턴을 따르며,
 * useFormState 훅과 함께 사용할 수 있도록 prevState 파라미터를 포함한다.
 */

import { createItem, updateItem, deleteItem } from '@/services/closet.service';
import type { Category, Color, Season, StyleTag } from '@/types';

// ─── ActionState 타입 정의 ───────────────────────────────────────

/**
 * Server Action 응답 상태 타입
 * 폼 제출 결과를 클라이언트에 전달하기 위한 표준 형식이다.
 */
export interface ActionState {
  /** 액션 성공 여부 */
  success: boolean;
  /** 사용자에게 표시할 메시지 */
  message: string;
  /** 유효성 검증 오류 목록 (필드별 오류) */
  errors?: { field: string; message: string }[];
  /** 추가 응답 데이터 (생성된 아이템 등) */
  data?: unknown;
}

// ─── Server Actions ──────────────────────────────────────────────

/**
 * 의류 아이템 등록 Server Action
 *
 * FormData에서 필드를 추출하여 서비스 계층의 createItem을 호출한다.
 * - 성공 시: 등록 완료 메시지와 생성된 아이템 데이터 반환
 * - 유효성 검증 오류 시: 각 필드의 오류 메시지 목록 반환
 * - 서버 오류 시: 일반 실패 메시지 반환
 *
 * @param prevState - 이전 상태 (useFormState 훅 호환용)
 * @param formData - 폼에서 제출된 데이터
 * @returns ActionState 응답
 */
export async function createClothingAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // FormData에서 필드 추출
    const category = formData.get('category') as string;
    const color = formData.get('color') as string;
    const seasons = formData.getAll('seasons') as string[];
    const styleTags = formData.getAll('styleTags') as string[];
    const imageUrl = formData.get('imageUrl') as string | null;
    const memo = formData.get('memo') as string | null;

    // 서비스 계층 호출
    const item = await createItem({
      category: category as Category,
      color: color as Color,
      seasons: seasons.length > 0 ? (seasons as Season[]) : undefined,
      styleTags: styleTags.length > 0 ? (styleTags as StyleTag[]) : undefined,
      imageUrl: imageUrl || undefined,
      memo: memo || undefined,
    });

    return {
      success: true,
      message: '의류 아이템이 등록되었습니다.',
      data: item,
    };
  } catch (error: unknown) {
    // 유효성 검증 오류 처리
    if (
      error instanceof Error &&
      'validationErrors' in error
    ) {
      const validationErrors = (error as Error & { validationErrors: { field: string; message: string }[] }).validationErrors;
      return {
        success: false,
        message: '입력값을 확인해주세요.',
        errors: validationErrors,
      };
    }

    // 서버 오류 처리
    return {
      success: false,
      message: '저장에 실패했습니다. 다시 시도해주세요.',
    };
  }
}

/**
 * 의류 아이템 수정 Server Action
 *
 * FormData에서 필드를 추출하여 서비스 계층의 updateItem을 호출한다.
 * - 성공 시: 수정 완료 메시지와 수정된 아이템 데이터 반환
 * - 유효성 검증 오류 시: 각 필드의 오류 메시지 목록 반환
 * - 서버 오류 시: 일반 실패 메시지 반환
 *
 * @param id - 수정할 아이템의 고유 ID
 * @param prevState - 이전 상태 (useFormState 훅 호환용)
 * @param formData - 폼에서 제출된 데이터
 * @returns ActionState 응답
 */
export async function updateClothingAction(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // FormData에서 필드 추출
    const category = formData.get('category') as string;
    const color = formData.get('color') as string;
    const seasons = formData.getAll('seasons') as string[];
    const styleTags = formData.getAll('styleTags') as string[];
    const imageUrl = formData.get('imageUrl') as string | null;
    const memo = formData.get('memo') as string | null;

    // 서비스 계층 호출
    const item = await updateItem(id, {
      category: category as Category,
      color: color as Color,
      seasons: seasons.length > 0 ? (seasons as Season[]) : undefined,
      styleTags: styleTags.length > 0 ? (styleTags as StyleTag[]) : undefined,
      imageUrl: imageUrl || undefined,
      memo: memo || undefined,
    });

    return {
      success: true,
      message: '의류 아이템이 수정되었습니다.',
      data: item,
    };
  } catch (error: unknown) {
    // 유효성 검증 오류 처리
    if (
      error instanceof Error &&
      'validationErrors' in error
    ) {
      const validationErrors = (error as Error & { validationErrors: { field: string; message: string }[] }).validationErrors;
      return {
        success: false,
        message: '입력값을 확인해주세요.',
        errors: validationErrors,
      };
    }

    // 서버 오류 처리
    return {
      success: false,
      message: '저장에 실패했습니다. 다시 시도해주세요.',
    };
  }
}

/**
 * 의류 아이템 삭제 Server Action
 *
 * 서비스 계층의 deleteItem을 호출하여 의류 아이템과 연관 데이터를 삭제한다.
 * - 성공 시: 삭제 완료 메시지 반환
 * - 오류 시: 삭제 실패 메시지 반환
 *
 * @param id - 삭제할 아이템의 고유 ID
 * @returns ActionState 응답
 */
export async function deleteClothingAction(id: string): Promise<ActionState> {
  try {
    await deleteItem(id);

    return {
      success: true,
      message: '의류 아이템이 삭제되었습니다.',
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: '삭제에 실패했습니다.',
    };
  }
}
