/**
 * LLM (Large Language Model) 연동 인터페이스
 *
 * ─── 용도 ────────────────────────────────────────────────────────────
 * 현재 시스템은 템플릿 기반으로 코디 추천 설명을 생성하지만,
 * 향후 LLM API를 연동하면 더 자연스럽고 맥락에 맞는 설명을 생성할 수 있다.
 * 이 인터페이스는 LLM 연동 시 구현해야 할 계약(contract)을 정의한다.
 *
 * ─── 향후 연동 방법 ──────────────────────────────────────────────────
 * 1. 이 인터페이스를 구현하는 클래스를 작성한다.
 *    예: `class OpenAILLMService implements LLMInterface { ... }`
 *
 * 2. 고려 가능한 LLM API:
 *    - OpenAI GPT-4 / GPT-3.5-turbo (https://platform.openai.com/)
 *    - AWS Bedrock (Claude, Titan 등)
 *    - Google Gemini API
 *    - Anthropic Claude API
 *
 * 3. 구현 시 프롬프트에 코디 조합 정보(아이템 색상, 카테고리, 계절)와
 *    사용자 상황 정보(occasion, weather, preferredStyle)를 포함하여
 *    맞춤형 설명을 생성하도록 한다.
 *
 * 4. RecommendService의 generateExplanation 메서드에서
 *    템플릿 로직 대신 이 인터페이스의 구현체를 호출하도록 교체한다.
 *
 * 5. 환경 변수(예: LLM_API_KEY, LLM_MODEL)로 API 키와 모델을 설정하고,
 *    API 호출 실패 시 기존 템플릿 로직을 fallback으로 사용할 수 있다.
 *
 * ─── 주의사항 ────────────────────────────────────────────────────────
 * - 이 모듈은 독립적으로 존재하며, 제거해도 핵심 빌드에 영향을 주지 않는다.
 * - MVP 단계에서는 이 인터페이스를 구현하지 않으며,
 *   RecommendService 내 템플릿 기반 로직이 설명 생성을 담당한다.
 */

import type { OutfitCombination, RecommendInput } from '@/types';

/**
 * LLM 기반 추천 설명 생성 인터페이스
 *
 * 코디 조합과 사용자 입력 상황을 기반으로
 * 자연어 추천 설명 문자열을 생성한다.
 */
export interface LLMInterface {
  /**
   * 코디 추천 설명을 생성한다.
   *
   * @param outfit - 추천된 코디 조합 (의류 아이템들의 구조)
   * @param context - 사용자가 입력한 상황 정보 (occasion, weather, preferredStyle)
   * @returns 자연어로 된 추천 설명 문자열 (최대 200자 권장)
   *
   * @example
   * // 향후 구현 예시:
   * // const explanation = await llmService.generateExplanation(outfit, context);
   * // "네이비 코트와 베이지 팬츠의 조합은 면접 상황에서 깔끔하고 신뢰감 있는 인상을 줍니다."
   */
  generateExplanation(outfit: OutfitCombination, context: RecommendInput): Promise<string>;
}
