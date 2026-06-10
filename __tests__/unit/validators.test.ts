/**
 * 유효성 검증 유틸리티 단위 테스트
 *
 * src/lib/validators.ts의 각 검증 함수를 테스트한다.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCategory,
  validateColor,
  validateSeasons,
  validateStyleTags,
  validateImageUrl,
  validateMemo,
  validateClothingItem,
} from '@/lib/validators';

describe('validateCategory', () => {
  it('유효한 카테고리 값은 null을 반환한다', () => {
    expect(validateCategory('top')).toBeNull();
    expect(validateCategory('bottom')).toBeNull();
    expect(validateCategory('outer')).toBeNull();
    expect(validateCategory('shoes')).toBeNull();
    expect(validateCategory('accessory')).toBeNull();
  });

  it('빈 값이면 필수 필드 오류를 반환한다', () => {
    const error = validateCategory('');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('category');
    expect(error!.message).toContain('필수');
  });

  it('null/undefined이면 필수 필드 오류를 반환한다', () => {
    expect(validateCategory(null)!.field).toBe('category');
    expect(validateCategory(undefined)!.field).toBe('category');
  });

  it('허용되지 않은 값이면 오류를 반환한다', () => {
    const error = validateCategory('hat');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('category');
    expect(error!.message).toContain('top');
    expect(error!.message).toContain('bottom');
  });

  it('문자열이 아닌 값이면 오류를 반환한다', () => {
    const error = validateCategory(123);
    expect(error).not.toBeNull();
    expect(error!.field).toBe('category');
    expect(error!.message).toContain('문자열');
  });
});

describe('validateColor', () => {
  it('유효한 색상 값은 null을 반환한다', () => {
    expect(validateColor('black')).toBeNull();
    expect(validateColor('white')).toBeNull();
    expect(validateColor('navy')).toBeNull();
    expect(validateColor('purple')).toBeNull();
  });

  it('빈 값이면 필수 필드 오류를 반환한다', () => {
    const error = validateColor('');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('color');
    expect(error!.message).toContain('필수');
  });

  it('허용되지 않은 값이면 오류를 반환한다', () => {
    const error = validateColor('orange');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('color');
    expect(error!.message).toContain('black');
  });
});

describe('validateSeasons', () => {
  it('유효한 계절 배열은 null을 반환한다', () => {
    expect(validateSeasons(['spring'])).toBeNull();
    expect(validateSeasons(['spring', 'summer'])).toBeNull();
    expect(validateSeasons(['spring', 'summer', 'fall', 'winter'])).toBeNull();
  });

  it('null/undefined이면 null을 반환한다 (선택 필드)', () => {
    expect(validateSeasons(null)).toBeNull();
    expect(validateSeasons(undefined)).toBeNull();
  });

  it('빈 배열이면 null을 반환한다', () => {
    expect(validateSeasons([])).toBeNull();
  });

  it('배열이 아닌 값이면 오류를 반환한다', () => {
    const error = validateSeasons('spring');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('seasons');
    expect(error!.message).toContain('배열');
  });

  it('유효하지 않은 계절 값이 포함되면 오류를 반환한다', () => {
    const error = validateSeasons(['spring', 'monsoon']);
    expect(error).not.toBeNull();
    expect(error!.field).toBe('seasons');
    expect(error!.message).toContain('spring');
  });
});

describe('validateStyleTags', () => {
  it('유효한 스타일 태그 배열은 null을 반환한다', () => {
    expect(validateStyleTags(['casual'])).toBeNull();
    expect(validateStyleTags(['casual', 'minimal', 'formal', 'street'])).toBeNull();
  });

  it('null/undefined이면 null을 반환한다 (선택 필드)', () => {
    expect(validateStyleTags(null)).toBeNull();
    expect(validateStyleTags(undefined)).toBeNull();
  });

  it('5개 이상이면 오류를 반환한다', () => {
    const error = validateStyleTags(['casual', 'minimal', 'formal', 'street', 'casual']);
    expect(error).not.toBeNull();
    expect(error!.field).toBe('styleTags');
    expect(error!.message).toContain('최대 4개');
  });

  it('유효하지 않은 스타일 값이 포함되면 오류를 반환한다', () => {
    const error = validateStyleTags(['casual', 'punk']);
    expect(error).not.toBeNull();
    expect(error!.field).toBe('styleTags');
  });
});

describe('validateImageUrl', () => {
  it('http://로 시작하는 URL은 null을 반환한다', () => {
    expect(validateImageUrl('http://example.com/image.jpg')).toBeNull();
  });

  it('https://로 시작하는 URL은 null을 반환한다', () => {
    expect(validateImageUrl('https://example.com/image.png')).toBeNull();
  });

  it('빈 값이면 null을 반환한다 (선택 필드)', () => {
    expect(validateImageUrl('')).toBeNull();
    expect(validateImageUrl(null)).toBeNull();
    expect(validateImageUrl(undefined)).toBeNull();
  });

  it('http/https로 시작하지 않는 URL이면 오류를 반환한다', () => {
    const error = validateImageUrl('ftp://example.com/image.jpg');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('imageUrl');
    expect(error!.message).toContain('http://');
    expect(error!.message).toContain('https://');
  });

  it('프로토콜 없는 URL이면 오류를 반환한다', () => {
    const error = validateImageUrl('example.com/image.jpg');
    expect(error).not.toBeNull();
    expect(error!.field).toBe('imageUrl');
  });
});

describe('validateMemo', () => {
  it('200자 이하 메모는 null을 반환한다', () => {
    expect(validateMemo('짧은 메모')).toBeNull();
    expect(validateMemo('a'.repeat(200))).toBeNull();
  });

  it('빈 값이면 null을 반환한다 (선택 필드)', () => {
    expect(validateMemo('')).toBeNull();
    expect(validateMemo(null)).toBeNull();
    expect(validateMemo(undefined)).toBeNull();
  });

  it('201자 이상이면 오류를 반환한다', () => {
    const error = validateMemo('a'.repeat(201));
    expect(error).not.toBeNull();
    expect(error!.field).toBe('memo');
    expect(error!.message).toContain('200자');
  });
});

describe('validateClothingItem', () => {
  it('모든 필수 필드가 유효하면 valid: true를 반환한다', () => {
    const result = validateClothingItem({
      category: 'top',
      color: 'black',
      seasons: ['spring'],
      styleTags: ['casual'],
      imageUrl: 'https://example.com/img.jpg',
      memo: '좋은 옷',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('필수 필드만 있어도 valid: true를 반환한다', () => {
    const result = validateClothingItem({
      category: 'shoes',
      color: 'white',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('카테고리가 없으면 오류를 반환한다', () => {
    const result = validateClothingItem({
      color: 'black',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'category')).toBe(true);
  });

  it('색상이 없으면 오류를 반환한다', () => {
    const result = validateClothingItem({
      category: 'top',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'color')).toBe(true);
  });

  it('카테고리와 색상 모두 없으면 두 개의 오류를 반환한다', () => {
    const result = validateClothingItem({});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.some((e) => e.field === 'category')).toBe(true);
    expect(result.errors.some((e) => e.field === 'color')).toBe(true);
  });

  it('null 입력이면 필수 필드 오류를 반환한다', () => {
    const result = validateClothingItem(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('여러 필드에 오류가 있으면 모든 오류를 반환한다', () => {
    const result = validateClothingItem({
      category: 'invalid',
      color: 'orange',
      imageUrl: 'not-a-url',
      memo: 'a'.repeat(201),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
