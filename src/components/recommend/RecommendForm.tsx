'use client';

/**
 * 코디 추천 입력 폼 컴포넌트
 *
 * occasion(상황), weather(날씨), preferredStyle(선호 스타일) 3개의 셀렉트 필드를 제공하며,
 * useActionState를 통해 getRecommendationsAction Server Action과 연동한다.
 *
 * - 추천 성공 시: OutfitCard 컴포넌트로 각 추천 결과를 렌더링
 * - 입력 오류 시: 허용 값 목록을 포함한 에러 메시지 표시
 * - 보유 아이템 0개 시: 의류 등록 유도 안내 메시지 표시
 *
 * Requirements: 4.1, 4.2, 4.5, 4.6, 4.7, 5.1, 5.2
 */

import { useActionState } from 'react';
import { getRecommendationsAction, type RecommendActionState } from '@/actions/recommend';
import { OCCASIONS, WEATHERS, STYLE_TAGS } from '@/lib/constants';
import OutfitCard from '@/components/recommend/OutfitCard';
import Link from 'next/link';

// ─── 한국어 라벨 매핑 ─────────────────────────────────────────

/** 상황(occasion) 한국어 라벨 - 이미 한국어이므로 그대로 표시 */
const OCCASION_LABELS: Record<string, string> = {
  '출근': '출근',
  '데이트': '데이트',
  '여행': '여행',
  '면접': '면접',
  '캐주얼': '캐주얼',
};

/** 날씨(weather) 한국어 라벨 */
const WEATHER_LABELS: Record<string, string> = {
  sunny: '맑음',
  rainy: '비',
  cold: '추위',
  hot: '더위',
};

/** 스타일(preferredStyle) 한국어 라벨 */
const STYLE_LABELS: Record<string, string> = {
  casual: '캐주얼',
  minimal: '미니멀',
  formal: '포멀',
  street: '스트릿',
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function RecommendForm() {
  const initialState: RecommendActionState = { success: false };
  const [state, formAction, isPending] = useActionState(getRecommendationsAction, initialState);

  return (
    <div className="space-y-8">
      {/* 추천 입력 폼 */}
      <form action={formAction} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {/* 상황 셀렉트 */}
        <div>
          <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-1">
            상황
          </label>
          <select
            id="occasion"
            name="occasion"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">선택해주세요</option>
            {OCCASIONS.map((occasion) => (
              <option key={occasion} value={occasion}>
                {OCCASION_LABELS[occasion]}
              </option>
            ))}
          </select>
        </div>

        {/* 날씨 셀렉트 */}
        <div>
          <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1">
            날씨
          </label>
          <select
            id="weather"
            name="weather"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">선택해주세요</option>
            {WEATHERS.map((weather) => (
              <option key={weather} value={weather}>
                {WEATHER_LABELS[weather]}
              </option>
            ))}
          </select>
        </div>

        {/* 선호 스타일 셀렉트 */}
        <div>
          <label htmlFor="preferredStyle" className="block text-sm font-medium text-gray-700 mb-1">
            선호 스타일
          </label>
          <select
            id="preferredStyle"
            name="preferredStyle"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">선택해주세요</option>
            {STYLE_TAGS.map((style) => (
              <option key={style} value={style}>
                {STYLE_LABELS[style]}
              </option>
            ))}
          </select>
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? '추천 생성 중...' : '코디 추천받기'}
        </button>
      </form>

      {/* 오류 메시지 표시 (허용 값 목록 안내) */}
      {!state.success && state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium mb-1">입력 오류</p>
          <p className="text-sm whitespace-pre-line">{state.error}</p>
        </div>
      )}

      {/* 안내 메시지 (보유 아이템 0개, 부족 카테고리 등) */}
      {state.success && state.result?.message && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg" role="status">
          <p className="text-sm">{state.result.message}</p>
          {state.result.recommendations.length === 0 && (
            <Link
              href="/closet/new"
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              옷 등록하러 가기 →
            </Link>
          )}
        </div>
      )}

      {/* 추천 결과 카드 목록 */}
      {state.success && state.result && state.result.recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            추천 코디 ({state.result.recommendations.length}개)
          </h2>
          <div className="grid gap-4">
            {state.result.recommendations.map((recommendation, index) => (
              <OutfitCard
                key={index}
                recommendation={recommendation}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
