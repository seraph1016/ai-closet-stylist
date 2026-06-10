/**
 * 이미지 분류 AI 연동 인터페이스
 *
 * ─── 용도 ────────────────────────────────────────────────────────────
 * 현재 시스템은 사용자가 의류 속성(카테고리, 색상, 계절, 스타일)을
 * 직접 입력하지만, 향후 이미지 분류 AI를 연동하면
 * 사진 한 장으로 의류 속성을 자동 분류할 수 있다.
 * 이 인터페이스는 이미지 AI 연동 시 구현해야 할 계약(contract)을 정의한다.
 *
 * ─── 향후 연동 방법 ──────────────────────────────────────────────────
 * 1. 이 인터페이스를 구현하는 클래스를 작성한다.
 *    예: `class AWSRekognitionService implements ImageAIInterface { ... }`
 *
 * 2. 고려 가능한 이미지 분류 AI/모델:
 *    - AWS Rekognition (이미지 라벨링)
 *    - Google Cloud Vision API (물체 감지 및 라벨링)
 *    - OpenAI GPT-4 Vision (멀티모달 분석)
 *    - TensorFlow/PyTorch 기반 커스텀 패션 분류 모델
 *    - Hugging Face의 패션 관련 사전학습 모델
 *      (예: Fashion-MNIST, DeepFashion 기반 모델)
 *
 * 3. 구현 시 이미지 URL을 입력받아 AI 모델에 전달하고,
 *    분류 결과를 ClothingAttributes 형태로 변환하여 반환한다.
 *
 * 4. 의류 등록 폼에서 사진 URL 입력 시 자동 분류 버튼을 추가하여,
 *    사용자가 직접 입력하는 대신 AI 분류 결과를 폼에 자동 채우도록 한다.
 *
 * 5. 환경 변수(예: IMAGE_AI_API_KEY, IMAGE_AI_ENDPOINT)로
 *    API 키와 엔드포인트를 설정한다.
 *
 * ─── 주의사항 ────────────────────────────────────────────────────────
 * - 이 모듈은 독립적으로 존재하며, 제거해도 핵심 빌드에 영향을 주지 않는다.
 * - MVP 단계에서는 이 인터페이스를 구현하지 않으며,
 *   사용자가 직접 카테고리/색상/계절/스타일을 선택한다.
 * - AI 분류 정확도가 100%가 아니므로, 분류 결과를 사용자가 확인·수정할 수
 *   있는 UX를 함께 설계해야 한다.
 */

import type { Category, Color, Season, StyleTag } from '@/types';

/**
 * 이미지 분류 AI가 반환하는 의류 속성 결과
 *
 * 이미지에서 추출한 의류의 카테고리, 색상, 계절감, 스타일 정보를 담는다.
 * 각 필드의 confidence는 AI 모델의 분류 신뢰도(0~1)를 나타낸다.
 */
export interface ClothingAttributes {
  /** 분류된 의류 카테고리 */
  category: Category;
  /** 카테고리 분류 신뢰도 (0~1) */
  categoryConfidence: number;
  /** 분류된 주요 색상 */
  color: Color;
  /** 색상 분류 신뢰도 (0~1) */
  colorConfidence: number;
  /** 적합한 계절 목록 (AI가 판단한 계절감) */
  seasons: Season[];
  /** 스타일 태그 목록 (AI가 판단한 스타일) */
  styleTags: StyleTag[];
}

/**
 * 이미지 분류 AI 인터페이스
 *
 * 의류 이미지 URL을 입력받아 해당 의류의 속성(카테고리, 색상, 계절, 스타일)을
 * 자동으로 분류한다.
 */
export interface ImageAIInterface {
  /**
   * 이미지 URL로부터 의류 속성을 자동 분류한다.
   *
   * @param imageUrl - 분류할 의류 이미지의 URL (http:// 또는 https://)
   * @returns 분류된 의류 속성 (카테고리, 색상, 계절, 스타일 + 신뢰도)
   *
   * @throws 이미지를 불러올 수 없거나 분류에 실패한 경우 에러를 던진다
   *
   * @example
   * // 향후 구현 예시:
   * // const attrs = await imageAIService.classifyImage("https://example.com/coat.jpg");
   * // { category: "outer", categoryConfidence: 0.95, color: "navy", ... }
   */
  classifyImage(imageUrl: string): Promise<ClothingAttributes>;
}
