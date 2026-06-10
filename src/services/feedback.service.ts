/**
 * 피드백 관리 서비스 (FeedbackService)
 *
 * 추천된 코디 조합에 대한 사용자 피드백(좋아요/싫어요)을 관리한다.
 * - 피드백 저장 및 덮어쓰기 (동일 코디에 대해 최신 피드백만 유지)
 * - 코디 히스토리 조회 (최신순, 최대 50개, 피드백 상태 포함)
 * - 특정 코디의 피드백 조회
 * - 피드백 보정값을 점수 계산에 반영하는 로직 (scoring 모듈 연동)
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 9.6
 */

import { prisma } from '@/lib/prisma';
import { calculateFeedbackBonus } from '@/services/scoring';
import type { ClothingItem } from '@/types';

// ─── 타입 정의 ────────────────────────────────────────────────────

/** 피드백 레코드 (DB 모델 대응) */
export interface Feedback {
  id: string;
  outfitId: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 코디 목록 + 피드백 상태를 포함한 결과 타입 */
export interface OutfitWithFeedback {
  id: string;
  occasion: string;
  weather: string;
  preferredStyle: string;
  totalScore: number;
  explanation: string;
  createdAt: Date;
  items: { role: string; clothing: ClothingItem }[];
  feedback: { type: string } | null;
}

// ─── FeedbackService 구현 ─────────────────────────────────────────

/**
 * 피드백을 저장한다 (기존 피드백이 있으면 덮어쓰기)
 *
 * Prisma upsert를 사용하여 동일 outfitId에 대해
 * 피드백이 존재하면 업데이트, 없으면 새로 생성한다.
 *
 * @param outfitId - 코디 조합 식별자
 * @param type - 피드백 유형 ('like' 또는 'dislike')
 * @returns 저장된 피드백 레코드
 */
export async function saveFeedback(
  outfitId: string,
  type: 'like' | 'dislike'
): Promise<Feedback> {
  // upsert: outfitId가 @unique이므로 기존 피드백이 있으면 덮어쓴다
  const feedback = await prisma.feedback.upsert({
    where: { outfitId },
    update: { type },
    create: { outfitId, type },
  });

  return feedback;
}

/**
 * 코디 히스토리를 조회한다 (최신순, 피드백 상태 포함)
 *
 * 생성일(createdAt) 기준 내림차순으로 정렬하며,
 * 기본 최대 50개까지 반환한다.
 * 각 코디에 포함된 의류 아이템과 피드백 상태를 함께 조회한다.
 *
 * @param limit - 조회할 최대 개수 (기본값: 50)
 * @returns 코디 목록 + 피드백 상태 배열
 */
export async function getOutfitHistory(
  limit: number = 50
): Promise<OutfitWithFeedback[]> {
  // 최신순 정렬, 최대 limit개 조회
  const outfits = await prisma.outfit.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          clothing: true,
        },
      },
      feedback: true,
    },
  });

  // DB 결과를 OutfitWithFeedback 형태로 매핑
  return outfits.map((outfit) => ({
    id: outfit.id,
    occasion: outfit.occasion,
    weather: outfit.weather,
    preferredStyle: outfit.preferredStyle,
    totalScore: outfit.totalScore,
    explanation: outfit.explanation,
    createdAt: outfit.createdAt,
    items: outfit.items.map((item) => ({
      role: item.role,
      clothing: {
        id: item.clothing.id,
        imageUrl: item.clothing.imageUrl,
        category: item.clothing.category,
        color: item.clothing.color,
        seasons: JSON.parse(item.clothing.seasons),
        styleTags: JSON.parse(item.clothing.styleTags),
        memo: item.clothing.memo,
        wearCount: item.clothing.wearCount,
        createdAt: item.clothing.createdAt,
        updatedAt: item.clothing.updatedAt,
      } as ClothingItem,
    })),
    feedback: outfit.feedback ? { type: outfit.feedback.type } : null,
  }));
}

/**
 * 특정 코디의 피드백을 조회한다.
 *
 * @param outfitId - 코디 조합 식별자
 * @returns 피드백 레코드 또는 null (피드백이 없는 경우)
 */
export async function getFeedbackForOutfit(
  outfitId: string
): Promise<Feedback | null> {
  const feedback = await prisma.feedback.findUnique({
    where: { outfitId },
  });

  return feedback;
}

/**
 * 특정 코디의 피드백 보정값을 계산한다.
 *
 * scoring 모듈의 calculateFeedbackBonus와 연동하여
 * 해당 코디의 피드백 유형에 따른 보정값을 반환한다.
 * - 'like' → +1
 * - 'dislike' → -1
 * - 피드백 없음 → 0
 *
 * 이 함수는 추천 엔진에서 점수 계산 시 호출하여
 * 피드백 보정값을 ScoringContext에 주입하는 데 사용한다.
 *
 * @param outfitId - 코디 조합 식별자
 * @returns -1, 0, 또는 +1 보정값
 */
export async function getFeedbackBonusForScoring(
  outfitId: string
): Promise<-1 | 0 | 1> {
  const feedback = await getFeedbackForOutfit(outfitId);
  const feedbackType = feedback?.type as 'like' | 'dislike' | null | undefined;
  return calculateFeedbackBonus(feedbackType);
}
