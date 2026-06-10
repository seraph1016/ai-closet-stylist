import Link from 'next/link';
import { getOutfitHistory } from '@/services/feedback.service';

export const dynamic = 'force-dynamic';

/**
 * 저장된 코디 목록 페이지 (/outfits)
 *
 * 이전에 추천받은 코디 조합을 최신순으로 최대 50개까지 표시한다.
 * 각 코디의 피드백 상태(좋아요/싫어요/미응답)를 함께 표시한다.
 *
 * Requirements: 7.4
 */

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

/** 날씨 한국어 라벨 */
const WEATHER_LABELS: Record<string, string> = {
  sunny: '맑음',
  rainy: '비',
  cold: '추움',
  hot: '더움',
};

/** 스타일 한국어 라벨 */
const STYLE_LABELS: Record<string, string> = {
  casual: '캐주얼',
  minimal: '미니멀',
  formal: '포멀',
  street: '스트릿',
};

// ─── 유틸리티 함수 ──────────────────────────────────────────────

/**
 * 날짜를 한국어 형식으로 포맷한다.
 * 예: 2025년 1월 15일
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 피드백 상태에 따른 배지를 반환한다.
 */
function getFeedbackBadge(feedback: { type: string } | null): {
  emoji: string;
  label: string;
  className: string;
} {
  if (!feedback) {
    return {
      emoji: '⏸',
      label: '미응답',
      className: 'bg-gray-100 text-gray-600',
    };
  }
  if (feedback.type === 'like') {
    return {
      emoji: '👍',
      label: '좋아요',
      className: 'bg-blue-100 text-blue-700',
    };
  }
  return {
    emoji: '👎',
    label: '싫어요',
    className: 'bg-red-100 text-red-700',
  };
}

// ─── 메인 페이지 컴포넌트 ────────────────────────────────────────

export default async function OutfitsPage() {
  const outfits = await getOutfitHistory();

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">저장된 코디</h1>
        <Link
          href="/recommend"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          새 코디 추천받기
        </Link>
      </div>

      {/* 코디 목록 또는 빈 상태 */}
      {outfits.length > 0 ? (
        <div className="space-y-4">
          {outfits.map((outfit) => {
            const badge = getFeedbackBadge(outfit.feedback);

            return (
              <div
                key={outfit.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                {/* 상단: 날짜 + 피드백 배지 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    {formatDate(outfit.createdAt)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}
                  >
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* 상황 정보 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                    <span>📍</span>
                    <span>{outfit.occasion}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs px-2.5 py-1 rounded-full">
                    <span>🌤</span>
                    <span>{WEATHER_LABELS[outfit.weather] || outfit.weather}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full">
                    <span>✨</span>
                    <span>{STYLE_LABELS[outfit.preferredStyle] || outfit.preferredStyle}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                    <span>📊</span>
                    <span>총점 {outfit.totalScore.toFixed(1)}</span>
                  </span>
                </div>

                {/* 추천 설명 */}
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {outfit.explanation}
                </p>

                {/* 아이템 목록 */}
                <div className="flex flex-wrap gap-2">
                  {outfit.items.map((outfitItem, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full"
                    >
                      <span className="font-medium">
                        {CATEGORY_LABELS[outfitItem.role] || outfitItem.role}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span>
                        {COLOR_LABELS[outfitItem.clothing.color] || outfitItem.clothing.color}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 빈 상태: 추천받은 코디가 없는 경우 */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-2">
            아직 추천받은 코디가 없습니다.
          </p>
          <p className="text-gray-400 text-sm mb-4">
            코디 추천을 받아보세요!
          </p>
          <Link
            href="/recommend"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            코디 추천받기
          </Link>
        </div>
      )}
    </div>
  );
}
