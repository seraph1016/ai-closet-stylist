import { getItems } from '@/services/closet.service';
import { getShoppingRecommendations } from '@/services/shopping.service';
import KeywordCard from '@/components/shopping/KeywordCard';
import Link from 'next/link';

/**
 * 쇼핑 추천 페이지 (/shopping)
 *
 * 사용자의 옷장 데이터를 분석하여 부족한 아이템을 식별하고,
 * 쇼핑 검색 키워드를 추천한다.
 * - 아이템 3개 미만: 충분한 데이터 필요 안내 메시지 표시
 * - 부족 항목 없음: 옷장 균형 상태 안내 메시지 표시
 * - 부족 항목 존재: 키워드 카드 목록 표시
 */
export default async function ShoppingPage() {
  const items = await getItems();
  const result = getShoppingRecommendations(items);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">쇼핑 추천</h1>
      <p className="text-gray-600 mb-8">
        옷장 분석을 통해 부족한 아이템과 쇼핑 키워드를 추천해드려요
      </p>

      {/* 아이템 3개 미만: 분석 불가 안내 */}
      {!result.success && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 mx-auto text-yellow-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-yellow-800 font-medium text-lg mb-2">
            아이템이 부족합니다
          </p>
          <p className="text-yellow-700 mb-4">
            {result.message}
          </p>
          <Link
            href="/closet/new"
            className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            옷 등록하러 가기
          </Link>
        </div>
      )}

      {/* 부족 항목 없음: 균형 상태 안내 */}
      {result.success && result.message && !result.keywords && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 mx-auto text-green-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-green-800 font-medium text-lg mb-2">
            옷장이 균형 잡혀 있어요!
          </p>
          <p className="text-green-700">
            {result.message}
          </p>
        </div>
      )}

      {/* 키워드 목록 표시 */}
      {result.success && result.keywords && result.keywords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              추천 쇼핑 키워드
            </h2>
            <span className="text-sm text-gray-500">
              ({result.keywords.length}개)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.keywords.map((keyword, index) => (
              <KeywordCard key={index} keyword={keyword} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
