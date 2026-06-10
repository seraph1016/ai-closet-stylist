import type { ShoppingKeyword } from '@/types';

/**
 * 쇼핑 키워드 카드 컴포넌트
 *
 * 쇼핑 분석 결과로 생성된 키워드를 카드 형태로 표시한다.
 * 각 카드에는 키워드, 추천 이유, 보유 아이템 참조, 네이버/구글 쇼핑 링크를 포함한다.
 * 외부 링크는 새 탭으로 열린다 (target="_blank").
 */
interface KeywordCardProps {
  keyword: ShoppingKeyword;
}

export default function KeywordCard({ keyword }: KeywordCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* 키워드 제목 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {keyword.keyword}
      </h3>

      {/* 추천 이유 */}
      <p className="text-sm text-gray-600 mb-3">
        {keyword.reason}
      </p>

      {/* 보유 아이템 참조 */}
      {keyword.relatedItems.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">관련 보유 아이템</p>
          <div className="flex flex-wrap gap-1.5">
            {keyword.relatedItems.map((item, index) => (
              <span
                key={index}
                className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 쇼핑 링크 */}
      <div className="flex gap-3">
        <a
          href={keyword.urls.naver}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          네이버쇼핑
        </a>
        <a
          href={keyword.urls.google}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          구글쇼핑
        </a>
      </div>
    </div>
  );
}
