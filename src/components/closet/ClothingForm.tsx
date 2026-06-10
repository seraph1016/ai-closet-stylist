'use client';

/**
 * AI 옷장 스타일 추천 웹사이트 - 의류 등록/수정 공용 폼 컴포넌트
 *
 * 옷 등록(/closet/new)과 수정(/closet/[id]/edit) 페이지에서 공유하는 폼 컴포넌트이다.
 * 카테고리, 색상, 계절, 스타일 태그, 사진 URL, 메모 입력 필드를 제공하며,
 * 클라이언트 측 유효성 검증과 인라인 오류 메시지를 포함한다.
 *
 * React 19의 useActionState를 사용하여 Server Action과 연동한다.
 */

import { useActionState, useState, useEffect } from 'react';
import { CATEGORIES, COLORS, SEASONS, STYLE_TAGS } from '@/lib/constants';
import type { ClothingItem } from '@/types';
import type { ActionState } from '@/actions/closet';

// ─── 한국어 라벨 매핑 ─────────────────────────────────────────

/** 카테고리 한국어 라벨 */
const CATEGORY_LABELS: Record<string, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
  accessory: '액세서리',
};

/** 색상 한국어 라벨 */
const COLOR_LABELS: Record<string, string> = {
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

/** 계절 한국어 라벨 */
const SEASON_LABELS: Record<string, string> = {
  spring: '봄',
  summer: '여름',
  fall: '가을',
  winter: '겨울',
};

/** 스타일 태그 한국어 라벨 */
const STYLE_TAG_LABELS: Record<string, string> = {
  casual: '캐주얼',
  minimal: '미니멀',
  formal: '포멀',
  street: '스트릿',
};

// ─── 컴포넌트 Props ────────────────────────────────────────────

interface ClothingFormProps {
  /** 폼 모드: 'create' (등록) 또는 'edit' (수정) */
  mode: 'create' | 'edit';
  /** 수정 모드 시 기존 데이터 (선택적) */
  initialData?: ClothingItem;
  /** Server Action 함수 */
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}

// ─── 클라이언트 유효성 검증 ────────────────────────────────────

interface ClientErrors {
  category?: string;
  color?: string;
  imageUrl?: string;
  memo?: string;
  styleTags?: string;
}

/** URL 형식 검증 (http:// 또는 https://로 시작하는지 확인) */
function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/.test(url);
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function ClothingForm({ mode, initialData, action }: ClothingFormProps) {
  // Server Action 상태 관리 (React 19 useActionState)
  const initialState: ActionState = { success: false, message: '' };
  const [state, formAction, isPending] = useActionState(action, initialState);

  // 클라이언트 측 검증 오류 상태
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});

  // 메모 글자 수 카운터
  const [memoLength, setMemoLength] = useState(initialData?.memo?.length ?? 0);

  // 스타일 태그 선택 상태 (최대 4개 제한)
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>(
    initialData?.styleTags ?? []
  );

  // 성공 시 리다이렉트
  useEffect(() => {
    if (state.success) {
      window.location.href = '/closet';
    }
  }, [state.success]);

  /**
   * 클라이언트 측 유효성 검증
   * 필수 필드(카테고리, 색상) 검증, URL 형식 검증을 수행한다.
   */
  function validateForm(formData: FormData): boolean {
    const errors: ClientErrors = {};
    let isValid = true;

    // 필수 필드: 카테고리
    const category = formData.get('category') as string;
    if (!category) {
      errors.category = '카테고리를 선택해주세요';
      isValid = false;
    }

    // 필수 필드: 색상
    const color = formData.get('color') as string;
    if (!color) {
      errors.color = '색상을 선택해주세요';
      isValid = false;
    }

    // URL 형식 검증 (입력된 경우에만)
    const imageUrl = formData.get('imageUrl') as string;
    if (imageUrl && !isValidUrl(imageUrl)) {
      errors.imageUrl = 'http:// 또는 https://로 시작해야 합니다';
      isValid = false;
    }

    // 메모 길이 검증
    const memo = formData.get('memo') as string;
    if (memo && memo.length > 200) {
      errors.memo = '메모는 최대 200자까지 입력할 수 있습니다';
      isValid = false;
    }

    setClientErrors(errors);
    return isValid;
  }

  /**
   * 스타일 태그 체크박스 변경 핸들러
   * 최대 4개까지만 선택 가능하도록 제한한다.
   */
  function handleStyleTagChange(tag: string, checked: boolean) {
    if (checked) {
      if (selectedStyleTags.length >= 4) {
        setClientErrors(prev => ({
          ...prev,
          styleTags: '스타일 태그는 최대 4개까지 선택 가능합니다.',
        }));
        return;
      }
      setSelectedStyleTags(prev => [...prev, tag]);
    } else {
      setSelectedStyleTags(prev => prev.filter(t => t !== tag));
    }
    // 에러 클리어
    setClientErrors(prev => ({ ...prev, styleTags: undefined }));
  }

  /**
   * 메모 입력 핸들러
   * 200자 초과 시 입력을 차단하고 카운터를 업데이트한다.
   */
  function handleMemoChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (value.length <= 200) {
      setMemoLength(value.length);
      setClientErrors(prev => ({ ...prev, memo: undefined }));
    } else {
      // 200자 초과 시 입력 차단
      e.target.value = value.slice(0, 200);
      setMemoLength(200);
    }
  }

  /**
   * 폼 제출 핸들러
   * 클라이언트 측 유효성 검증 후 Server Action을 호출한다.
   */
  function handleSubmit(formData: FormData) {
    if (!validateForm(formData)) {
      return;
    }
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      {/* 서버 응답 오류 메시지 */}
      {state.message && !state.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {state.message}
        </div>
      )}

      {/* 서버 측 필드별 오류 표시 */}
      {state.errors && state.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <ul className="list-disc list-inside">
            {state.errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 카테고리 셀렉트 (필수) */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          defaultValue={initialData?.category ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-describedby="category-error"
        >
          <option value="">선택해주세요</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        {clientErrors.category && (
          <p id="category-error" className="mt-1 text-sm text-red-600" role="alert">
            {clientErrors.category}
          </p>
        )}
      </div>

      {/* 색상 셀렉트 (필수) */}
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
          색상 <span className="text-red-500">*</span>
        </label>
        <select
          id="color"
          name="color"
          defaultValue={initialData?.color ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-describedby="color-error"
        >
          <option value="">선택해주세요</option>
          {COLORS.map(color => (
            <option key={color} value={color}>
              {COLOR_LABELS[color]}
            </option>
          ))}
        </select>
        {clientErrors.color && (
          <p id="color-error" className="mt-1 text-sm text-red-600" role="alert">
            {clientErrors.color}
          </p>
        )}
      </div>

      {/* 계절 체크박스 (복수 선택 가능) */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          계절
        </legend>
        <div className="flex flex-wrap gap-4">
          {SEASONS.map(season => (
            <label key={season} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="seasons"
                value={season}
                defaultChecked={initialData?.seasons?.includes(season)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{SEASON_LABELS[season]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 스타일 태그 체크박스 (복수 선택, 최대 4개) */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          스타일 태그 <span className="text-gray-500 text-xs">(최대 4개)</span>
        </legend>
        <div className="flex flex-wrap gap-4">
          {STYLE_TAGS.map(tag => (
            <label key={tag} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="styleTags"
                value={tag}
                checked={selectedStyleTags.includes(tag)}
                onChange={(e) => handleStyleTagChange(tag, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{STYLE_TAG_LABELS[tag]}</span>
            </label>
          ))}
        </div>
        {clientErrors.styleTags && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {clientErrors.styleTags}
          </p>
        )}
      </fieldset>

      {/* 사진 URL 입력 (선택) */}
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
          사진 URL
        </label>
        <input
          type="text"
          id="imageUrl"
          name="imageUrl"
          defaultValue={initialData?.imageUrl ?? ''}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-describedby="imageUrl-error"
        />
        {clientErrors.imageUrl && (
          <p id="imageUrl-error" className="mt-1 text-sm text-red-600" role="alert">
            {clientErrors.imageUrl}
          </p>
        )}
      </div>

      {/* 메모 입력 (선택, 최대 200자) */}
      <div>
        <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
          메모
        </label>
        <textarea
          id="memo"
          name="memo"
          defaultValue={initialData?.memo ?? ''}
          maxLength={200}
          rows={3}
          onChange={handleMemoChange}
          placeholder="메모를 입력해주세요 (최대 200자)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          aria-describedby="memo-counter"
        />
        <p id="memo-counter" className="mt-1 text-sm text-gray-500 text-right">
          {memoLength}/200
        </p>
        {clientErrors.memo && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {clientErrors.memo}
          </p>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending
            ? '저장 중...'
            : mode === 'create'
              ? '등록하기'
              : '수정하기'}
        </button>
        <a
          href="/closet"
          className="flex-1 text-center bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          취소
        </a>
      </div>
    </form>
  );
}
