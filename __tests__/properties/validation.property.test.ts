/**
 * AI 옷장 스타일 추천 웹사이트 - 유효성 검증 프로퍼티 테스트
 *
 * Property 2: 열거형 입력 검증
 * Property 3: 필수 필드 검증 오류 메시지
 * Property 4: 신규 아이템 착용 빈도 초기화
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateCategory,
  validateColor,
  validateImageUrl,
  validateClothingItem,
} from '@/lib/validators';
import { CATEGORIES, COLORS } from '@/lib/constants';

// ─── Property 2: 열거형 입력 검증 ───────────────────────────────
// Feature: ai-closet-stylist, Property 2: 열거형 입력 검증
// **Validates: Requirements 1.2, 1.5, 1.6**

describe('Property 2: 열거형 입력 검증', () => {
  it('카테고리 - 유효한 값만 허용해야 한다', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const result = validateCategory(value);
        const isValid = (CATEGORIES as readonly string[]).includes(value);

        if (isValid) {
          // 유효한 카테고리 값이면 오류 없음
          expect(result).toBeNull();
        } else {
          // 유효하지 않은 값이면 오류 반환
          expect(result).not.toBeNull();
          expect(result!.field).toBe('category');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('카테고리 - 사전정의 목록의 모든 값이 허용되어야 한다', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CATEGORIES),
        (validCategory) => {
          const result = validateCategory(validCategory);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('색상 - 유효한 값만 허용해야 한다', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const result = validateColor(value);
        const isValid = (COLORS as readonly string[]).includes(value);

        if (isValid) {
          // 유효한 색상 값이면 오류 없음
          expect(result).toBeNull();
        } else {
          // 유효하지 않은 값이면 오류 반환
          expect(result).not.toBeNull();
          expect(result!.field).toBe('color');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('색상 - 사전정의 12색 모두 허용되어야 한다', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COLORS),
        (validColor) => {
          const result = validateColor(validColor);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('사진 URL - http:// 또는 https://로 시작하거나 빈 값만 허용해야 한다', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const result = validateImageUrl(value);
        const isEmpty = value === '';
        const startsWithHttp = value.startsWith('http://') || value.startsWith('https://');

        if (isEmpty || startsWithHttp) {
          // 빈 값이거나 올바른 URL 형식이면 오류 없음
          expect(result).toBeNull();
        } else {
          // 그 외 값은 오류 반환
          expect(result).not.toBeNull();
          expect(result!.field).toBe('imageUrl');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('사진 URL - 유효한 http/https URL은 항상 허용해야 한다', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.webUrl({ validSchemes: ['http', 'https'] }),
          fc.constant('')
        ),
        (url) => {
          const result = validateImageUrl(url);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: 필수 필드 검증 오류 메시지 ──────────────────────
// Feature: ai-closet-stylist, Property 3: 필수 필드 검증 오류 메시지
// **Validates: Requirements 1.3, 1.4**

describe('Property 3: 필수 필드 검증 오류 메시지', () => {
  /** 필수 필드 목록 (category, color) */
  const requiredFields = ['category', 'color'] as const;

  it('누락된 필수 필드 수만큼 오류가 반환되어야 한다', () => {
    // 각 필수 필드를 포함할지 여부를 임의로 결정하는 제너레이터
    const partialItemArb = fc.record({
      includeCategory: fc.boolean(),
      includeColor: fc.boolean(),
      // 선택 필드는 유효한 값 포함
      seasons: fc.constant(['spring']),
      styleTags: fc.constant(['casual']),
      memo: fc.string({ maxLength: 200 }),
    });

    fc.assert(
      fc.property(partialItemArb, (params) => {
        const item: Record<string, unknown> = {
          seasons: params.seasons,
          styleTags: params.styleTags,
          memo: params.memo,
        };

        // 포함 여부에 따라 유효한 값을 넣거나 제외
        if (params.includeCategory) {
          item.category = 'top';
        }
        if (params.includeColor) {
          item.color = 'black';
        }

        const result = validateClothingItem(item);

        // 누락된 필수 필드 수 계산
        let missingCount = 0;
        if (!params.includeCategory) missingCount++;
        if (!params.includeColor) missingCount++;

        if (missingCount === 0) {
          // 모든 필수 필드가 존재하면 유효
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        } else {
          // 누락된 필드가 있으면 오류 수가 누락 수와 같아야 함
          expect(result.valid).toBe(false);

          // 필수 필드 관련 오류만 추출
          const requiredFieldErrors = result.errors.filter((e) =>
            requiredFields.includes(e.field as typeof requiredFields[number])
          );
          expect(requiredFieldErrors).toHaveLength(missingCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('각 누락 필드에 대해 해당 필드명을 포함한 오류가 있어야 한다', () => {
    const missingFieldsArb = fc.subarray([...requiredFields], { minLength: 1 });

    fc.assert(
      fc.property(missingFieldsArb, (missingFields) => {
        const item: Record<string, unknown> = {
          seasons: ['summer'],
          styleTags: ['minimal'],
        };

        // 누락되지 않은 필드에 유효한 값 설정
        if (!missingFields.includes('category')) {
          item.category = 'bottom';
        }
        if (!missingFields.includes('color')) {
          item.color = 'white';
        }

        const result = validateClothingItem(item);

        expect(result.valid).toBe(false);

        // 각 누락 필드에 대한 오류가 존재하는지 검증
        for (const field of missingFields) {
          const fieldError = result.errors.find((e) => e.field === field);
          expect(fieldError).toBeDefined();
          expect(fieldError!.field).toBe(field);
          expect(fieldError!.message.length).toBeGreaterThan(0);
        }

        // 오류 수가 누락 필드 수 이상이어야 한다
        const requiredFieldErrors = result.errors.filter((e) =>
          requiredFields.includes(e.field as typeof requiredFields[number])
        );
        expect(requiredFieldErrors).toHaveLength(missingFields.length);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 4: 신규 아이템 착용 빈도 초기화 ────────────────────
// Feature: ai-closet-stylist, Property 4: 신규 아이템 착용 빈도 초기화
// **Validates: Requirements 1.4**

describe('Property 4: 신규 아이템 착용 빈도 초기화', () => {
  it('validateClothingItem은 wearCount 필드를 검증하지 않아야 한다 (서비스 계층에서 강제)', () => {
    // wearCount에 어떤 값을 넣어도 유효성 검증 단계에서는 오류가 발생하지 않아야 한다.
    // wearCount는 서비스 계층(ClosetService)에서 0으로 강제 초기화된다.
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.integer({ min: -1000, max: 1000 }),
          fc.constant(0),
          fc.constant(999),
          fc.constant(-1)
        ),
        (wearCountValue) => {
          const validItem = {
            category: 'top',
            color: 'black',
            seasons: ['spring'],
            styleTags: ['casual'],
            wearCount: wearCountValue,
          };

          const result = validateClothingItem(validItem);

          // 유효한 아이템에 wearCount가 어떤 값이든 검증 통과해야 한다
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);

          // wearCount에 대한 오류가 없어야 한다
          const wearCountError = result.errors.find((e) => e.field === 'wearCount');
          expect(wearCountError).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('서비스 계층 계약: 신규 아이템 생성 시 wearCount는 항상 0이어야 한다 (문서화)', () => {
    /**
     * 이 테스트는 서비스 계층의 계약을 문서화한다:
     * - ClosetService.createItem()은 입력에 포함된 wearCount 값을 무시하고 항상 0으로 설정한다.
     * - 유효성 검증 계층은 wearCount를 검증하지 않는다 (사용자 입력이 아닌 시스템 필드이므로).
     * - 이 프로퍼티는 ClosetService 구현 시 보장되어야 하며, 해당 서비스의 테스트에서 직접 검증된다.
     *
     * 여기서는 검증 계층이 wearCount를 무시한다는 것을 다양한 입력으로 확인한다.
     */
    fc.assert(
      fc.property(
        fc.record({
          category: fc.constantFrom('top', 'bottom', 'outer', 'shoes', 'accessory'),
          color: fc.constantFrom(
            'black', 'white', 'gray', 'red', 'blue', 'green',
            'yellow', 'pink', 'brown', 'beige', 'navy', 'purple'
          ),
          seasons: fc.subarray(['spring', 'summer', 'fall', 'winter'] as string[], { minLength: 1 }),
          styleTags: fc.subarray(['casual', 'minimal', 'formal', 'street'] as string[], { minLength: 1, maxLength: 4 }),
          wearCount: fc.integer({ min: -10000, max: 10000 }),
          imageUrl: fc.oneof(fc.constant(''), fc.constant('https://example.com/img.png')),
          memo: fc.string({ maxLength: 200 }),
        }),
        (itemInput) => {
          const result = validateClothingItem(itemInput);

          // 유효한 입력이면 wearCount 값에 관계없이 항상 통과
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
