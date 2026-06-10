/**
 * 피드백 프로퍼티 테스트
 *
 * 피드백 관리 서비스의 핵심 동작에 대한 프로퍼티 기반 테스트를 정의한다.
 * - 피드백 덮어쓰기 멱등성 (동일 코디에 대해 항상 마지막 피드백만 유지)
 * - 코디 기록 정렬 및 페이지네이션 (최신순 정렬, 최대 50개 반환)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── 순수 로직 함수 (테스트 대상) ──────────────────────────────────

/**
 * 피드백 upsert 시뮬레이션
 *
 * Prisma의 upsert 동작을 시뮬레이션한다:
 * 동일 outfitId에 대해 피드백이 존재하면 덮어쓰고, 없으면 생성한다.
 * 최종적으로 각 outfitId에 대해 정확히 하나의 피드백 레코드만 존재해야 한다.
 */
function simulateFeedbackUpsert(
  submissions: { outfitId: string; type: 'like' | 'dislike' }[]
): Map<string, 'like' | 'dislike'> {
  const feedbackMap = new Map<string, 'like' | 'dislike'>();
  for (const submission of submissions) {
    feedbackMap.set(submission.outfitId, submission.type);
  }
  return feedbackMap;
}

/**
 * 코디 히스토리 페이지네이션 로직
 *
 * FeedbackService.getOutfitHistory의 정렬·페이지네이션 로직을 순수 함수로 구현한다.
 * createdAt 기준 내림차순 정렬 후 limit개만 반환한다.
 */
function getHistoryPage(
  outfits: { id: string; createdAt: Date }[],
  limit: number = 50
): { id: string; createdAt: Date }[] {
  return [...outfits]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// ─── 제너레이터 정의 ──────────────────────────────────────────────

/** 피드백 유형 제너레이터 */
const feedbackTypeArb = fc.constantFrom('like' as const, 'dislike' as const);

/** outfitId 제너레이터 (다양한 ID 생성) */
const outfitIdArb = fc.uuid();

/** 피드백 제출 항목 제너레이터 */
const feedbackSubmissionArb = fc.record({
  outfitId: outfitIdArb,
  type: feedbackTypeArb,
});

/** 코디 기록 레코드 제너레이터 (유효한 날짜만 생성) */
const outfitRecordArb = fc.record({
  id: fc.uuid(),
  createdAt: fc.integer({ min: 1577836800000, max: 1924905600000 }).map((ts) => new Date(ts)),
});

// ─── Property 14: 피드백 덮어쓰기 멱등성 ───────────────────────────

// Feature: ai-closet-stylist, Property 14: 피드백 덮어쓰기 멱등성
describe('Property 14: 피드백 덮어쓰기 멱등성', () => {
  /**
   * **Validates: Requirements 7.1**
   *
   * For any outfit ID and any sequence of feedback submissions (like/dislike),
   * after all submissions are processed, exactly one feedback record should
   * exist for that outfit, and its type should match the last submitted value.
   */
  it('임의의 피드백 시퀀스 후, 각 outfitId에 대해 정확히 하나의 피드백만 존재하며 마지막 값과 일치한다', () => {
    fc.assert(
      fc.property(
        fc.array(feedbackSubmissionArb, { minLength: 1, maxLength: 50 }),
        (submissions) => {
          const result = simulateFeedbackUpsert(submissions);

          // 각 고유 outfitId에 대해 검증
          const uniqueOutfitIds = [...new Set(submissions.map((s) => s.outfitId))];

          for (const outfitId of uniqueOutfitIds) {
            // 정확히 하나의 피드백 레코드가 존재해야 한다
            expect(result.has(outfitId)).toBe(true);

            // 마지막으로 제출된 피드백 유형과 일치해야 한다
            const lastSubmission = [...submissions]
              .reverse()
              .find((s) => s.outfitId === outfitId);
            expect(result.get(outfitId)).toBe(lastSubmission!.type);
          }

          // 피드백 레코드 수는 고유 outfitId 수와 동일해야 한다
          expect(result.size).toBe(uniqueOutfitIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('동일 outfitId에 대해 여러 번 피드백을 제출해도 최종적으로 하나의 레코드만 존재한다', () => {
    fc.assert(
      fc.property(
        outfitIdArb,
        fc.array(feedbackTypeArb, { minLength: 2, maxLength: 20 }),
        (outfitId, types) => {
          // 동일 outfitId에 대해 여러 번 제출
          const submissions = types.map((type) => ({ outfitId, type }));
          const result = simulateFeedbackUpsert(submissions);

          // 정확히 하나의 레코드만 존재
          expect(result.size).toBe(1);
          expect(result.has(outfitId)).toBe(true);

          // 마지막 제출 값과 일치
          expect(result.get(outfitId)).toBe(types[types.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('피드백 덮어쓰기는 다른 outfitId의 피드백에 영향을 주지 않는다', () => {
    fc.assert(
      fc.property(
        outfitIdArb,
        outfitIdArb,
        feedbackTypeArb,
        feedbackTypeArb,
        fc.array(feedbackTypeArb, { minLength: 1, maxLength: 10 }),
        (outfitId1, outfitId2, initialType1, initialType2, additionalTypes) => {
          // outfitId1과 outfitId2가 동일하면 테스트 의미 없음 (skip)
          fc.pre(outfitId1 !== outfitId2);

          // 초기 피드백 설정
          const submissions = [
            { outfitId: outfitId1, type: initialType1 },
            { outfitId: outfitId2, type: initialType2 },
            // outfitId1에만 추가 피드백 제출
            ...additionalTypes.map((type) => ({ outfitId: outfitId1, type })),
          ];

          const result = simulateFeedbackUpsert(submissions);

          // outfitId2의 피드백은 변경되지 않아야 한다
          expect(result.get(outfitId2)).toBe(initialType2);

          // outfitId1의 피드백은 마지막 추가 타입이어야 한다
          expect(result.get(outfitId1)).toBe(additionalTypes[additionalTypes.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 17: 코디 기록 정렬 및 페이지네이션 ────────────────────

// Feature: ai-closet-stylist, Property 17: 코디 기록 정렬 및 페이지네이션
describe('Property 17: 코디 기록 정렬 및 페이지네이션', () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * For any set of stored outfit records, retrieving the outfit history
   * should return at most 50 records, sorted by createdAt in descending
   * order (newest first).
   */
  it('코디 히스토리는 최대 50개만 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(outfitRecordArb, { minLength: 0, maxLength: 100 }),
        (outfits) => {
          const result = getHistoryPage(outfits);
          expect(result.length).toBeLessThanOrEqual(50);
          expect(result.length).toBe(Math.min(outfits.length, 50));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('코디 히스토리는 createdAt 기준 내림차순(최신순)으로 정렬된다', () => {
    fc.assert(
      fc.property(
        fc.array(outfitRecordArb, { minLength: 2, maxLength: 100 }),
        (outfits) => {
          const result = getHistoryPage(outfits);

          // 결과가 2개 이상일 때 정렬 순서 검증
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              result[i + 1].createdAt.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('50개 초과 레코드에서 반환된 결과는 전체에서 가장 최신 50개이다', () => {
    fc.assert(
      fc.property(
        fc.array(outfitRecordArb, { minLength: 51, maxLength: 100 }),
        (outfits) => {
          const result = getHistoryPage(outfits);

          // 정확히 50개 반환
          expect(result.length).toBe(50);

          // 전체를 정렬한 후 상위 50개와 일치해야 한다
          const allSorted = [...outfits].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          );
          const top50 = allSorted.slice(0, 50);

          for (let i = 0; i < 50; i++) {
            expect(result[i].id).toBe(top50[i].id);
            expect(result[i].createdAt.getTime()).toBe(top50[i].createdAt.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('빈 히스토리에서는 빈 배열을 반환한다', () => {
    const result = getHistoryPage([]);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('커스텀 limit 값을 적용하면 해당 개수만큼만 반환한다', () => {
    fc.assert(
      fc.property(
        fc.array(outfitRecordArb, { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (outfits, limit) => {
          const result = getHistoryPage(outfits, limit);
          expect(result.length).toBeLessThanOrEqual(limit);
          expect(result.length).toBe(Math.min(outfits.length, limit));

          // 정렬 순서 검증
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              result[i + 1].createdAt.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
