'use client';

/**
 * 코디 결과 카드 컴포넌트
 *
 * 추천된 코디 조합의 상세 정보를 표시한다:
 * - 조합에 포함된 아이템 목록 (카테고리 + 색상)
 * - 총점(totalScore)
 * - 추천 설명(explanation)
 * - 개별 점수 (색상 조화, 계절 적합, 상황 적합)
 * - 좋아요/싫어요 피드백 버튼
 *
 * Requirements: 4.1, 4.2, 5.1, 5.2, 7.1
 */

import { useState } from 'react';
import { saveFeedbackAction } from '@/actions/feedback';
import type { OutfitRecommendation, OutfitCombination, ClothingItem } from '@/types';

// ─── 한국어 라벨 매핑 ─────────────────────────────────────────

/** 카테고리 한국어 라벨 */
const CATEGORY_LABELS: Record<string, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  shoes: '신발',
  dress: '원피스',
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

// ─── 유틸리티 함수 ──────────────────────────────────────────────

/**
 * 코디 조합에서 (역할, 아이템) 쌍 목록을 추출한다.
 */
function getOutfitEntries(outfit: OutfitCombination): { role: string; item: ClothingItem }[] {
  const entries: { role: string; item: ClothingItem }[] = [];

  if ('dress' in outfit) {
    entries.push({ role: 'dress', item: outfit.dress });
    entries.push({ role: 'outer', item: outfit.outer });
    entries.push({ role: 'shoes', item: outfit.shoes });
  } else if ('outer' in outfit) {
    entries.push({ role: 'top', item: outfit.top });
    entries.push({ role: 'bottom', item: outfit.bottom });
    entries.push({ role: 'outer', item: outfit.outer });
    entries.push({ role: 'shoes', item: outfit.shoes });
  } else {
    entries.push({ role: 'top', item: outfit.top });
    entries.push({ role: 'bottom', item: outfit.bottom });
    entries.push({ role: 'shoes', item: outfit.shoes });
  }

  return entries;
}

// ─── 컴포넌트 Props ────────────────────────────────────────────

interface OutfitCardProps {
  /** 추천 결과 데이터 */
  recommendation: OutfitRecommendation;
  /** 순위 (1, 2, 3) */
  rank: number;
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function OutfitCard({ recommendation, rank }: OutfitCardProps) {
  const { outfit, totalScore, explanation, scores } = recommendation;
  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const outfitEntries = getOutfitEntries(outfit);

  /**
   * 피드백 버튼 클릭 핸들러
   * saveFeedbackAction을 호출하여 좋아요/싫어요를 저장한다.
   * 실패 시 이전 상태로 롤백한다.
   */
  async function handleFeedback(type: 'like' | 'dislike') {
    // 이미 같은 피드백이 선택된 경우 무시
    if (feedbackState === type) return;

    const previousState = feedbackState;
    setFeedbackState(type);
    setFeedbackMessage(null);
    setIsSaving(true);

    try {
      // outfitId는 조합의 첫 번째 아이템 ID를 기반으로 생성 (클라이언트 측 임시 식별자)
      const outfitId = outfitEntries.map(e => e.item.id).join('-');
      const result = await saveFeedbackAction(outfitId, type);

      if (!result.success) {
        // 실패 시 롤백
        setFeedbackState(previousState);
        setFeedbackMessage(result.message);
      }
    } catch {
      // 네트워크 오류 등 예외 시 롤백
      setFeedbackState(previousState);
      setFeedbackMessage('피드백 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* 헤더: 순위 + 총점 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
            {rank}
          </span>
          <h3 className="text-base font-semibold text-gray-900">추천 코디</h3>
        </div>
        <span className="text-sm font-medium text-gray-500">
          총점: <span className="text-blue-600 font-bold">{totalScore.toFixed(1)}</span>
        </span>
      </div>

      {/* 아이템 목록 (카테고리 + 색상) */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {outfitEntries.map(({ role, item }, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full"
            >
              <span className="font-medium">{CATEGORY_LABELS[role] || role}</span>
              <span className="text-gray-400">·</span>
              <span>{COLOR_LABELS[item.color] || item.color}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 추천 설명 */}
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        {explanation}
      </p>

      {/* 개별 점수 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">색상 조화</p>
          <p className="text-sm font-semibold text-gray-900">{scores.colorHarmony}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">계절 적합</p>
          <p className="text-sm font-semibold text-gray-900">{scores.seasonMatch}</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">상황 적합</p>
          <p className="text-sm font-semibold text-gray-900">{scores.occasionMatch}</p>
        </div>
      </div>

      {/* 좋아요/싫어요 버튼 */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => handleFeedback('like')}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            feedbackState === 'like'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="좋아요"
          aria-pressed={feedbackState === 'like'}
        >
          <span>👍</span>
          <span>좋아요</span>
        </button>
        <button
          type="button"
          onClick={() => handleFeedback('dislike')}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            feedbackState === 'dislike'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="싫어요"
          aria-pressed={feedbackState === 'dislike'}
        >
          <span>👎</span>
          <span>싫어요</span>
        </button>

        {/* 피드백 에러 메시지 */}
        {feedbackMessage && (
          <span className="text-xs text-red-600 ml-auto">{feedbackMessage}</span>
        )}
      </div>
    </div>
  );
}
