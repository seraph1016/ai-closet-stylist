import RecommendForm from '@/components/recommend/RecommendForm';

/**
 * 코디 추천 페이지 (/recommend)
 *
 * 사용자가 상황, 날씨, 선호 스타일을 입력하면
 * AI 추천 엔진이 보유 의류 기반 코디 조합을 생성한다.
 */
export default function RecommendPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">코디 추천</h1>
      <p className="text-gray-600 mb-8">
        상황, 날씨, 스타일을 선택하면 AI가 코디를 추천해드려요
      </p>
      <RecommendForm />
    </div>
  );
}
