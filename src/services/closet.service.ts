/**
 * AI 옷장 스타일 추천 웹사이트 - 옷장 관리 서비스 (ClosetService)
 *
 * 의류 아이템의 생성, 수정, 삭제, 조회(필터 포함)를 담당하는 서비스 계층이다.
 * Prisma Client를 통해 DB에 접근하며, 라우트 핸들러나 컴포넌트에서 직접
 * Prisma를 호출하지 않도록 중간 계층 역할을 수행한다.
 *
 * 향후 Supabase 전환 시 이 서비스 계층만 교체하면 된다.
 */

import { prisma } from '@/lib/prisma';
import { validateClothingItem, type ValidationResult } from '@/lib/validators';
import type { Category, ClothingFilter, ClothingItem, Color, Season, StyleTag } from '@/types';

// ─── 입력 타입 정의 ─────────────────────────────────────────────

/**
 * 의류 아이템 생성 입력 데이터
 * 사용자가 새로운 의류를 등록할 때 필요한 필드를 정의한다.
 */
export interface CreateClothingInput {
  /** 사진 URL (선택, http:// 또는 https://로 시작) */
  imageUrl?: string | null;
  /** 카테고리 (필수: top, bottom, outer, shoes, accessory) */
  category: Category;
  /** 색상 (필수: 사전정의 12색 중 하나) */
  color: Color;
  /** 계절 (선택: spring, summer, fall, winter 복수 선택) */
  seasons?: Season[];
  /** 스타일 태그 (선택: casual, minimal, formal, street 최대 4개) */
  styleTags?: StyleTag[];
  /** 메모 (선택: 최대 200자) */
  memo?: string | null;
}

/**
 * 의류 아이템 수정 입력 데이터
 * 기존 아이템의 필드를 부분적으로 업데이트할 때 사용한다.
 * 모든 필드가 선택적이다.
 */
export interface UpdateClothingInput {
  /** 사진 URL (선택) */
  imageUrl?: string | null;
  /** 카테고리 (선택) */
  category?: Category;
  /** 색상 (선택) */
  color?: Color;
  /** 계절 (선택) */
  seasons?: Season[];
  /** 스타일 태그 (선택) */
  styleTags?: StyleTag[];
  /** 메모 (선택) */
  memo?: string | null;
}

// ─── 헬퍼 함수 ──────────────────────────────────────────────────

/**
 * Prisma DB 레코드를 애플리케이션 ClothingItem 타입으로 변환한다.
 * DB에서 seasons와 styleTags는 JSON 문자열로 저장되어 있으므로
 * 이를 파싱하여 배열로 변환한다.
 *
 * @param record - Prisma에서 조회한 원시 레코드
 * @returns 애플리케이션에서 사용하는 ClothingItem 객체
 */
function toClothingItem(record: {
  id: string;
  imageUrl: string | null;
  category: string;
  color: string;
  seasons: string;
  styleTags: string;
  memo: string | null;
  wearCount: number;
  createdAt: Date;
  updatedAt: Date;
}): ClothingItem {
  return {
    id: record.id,
    imageUrl: record.imageUrl,
    category: record.category as Category,
    color: record.color as Color,
    seasons: JSON.parse(record.seasons) as Season[],
    styleTags: JSON.parse(record.styleTags) as StyleTag[],
    memo: record.memo,
    wearCount: record.wearCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// ─── 서비스 함수 ────────────────────────────────────────────────

/**
 * 새로운 의류 아이템을 생성한다.
 *
 * - 입력 데이터의 유효성을 검증한다.
 * - 착용 빈도(wearCount)는 항상 0으로 초기화한다 (입력값 무시).
 * - seasons와 styleTags는 JSON 문자열로 직렬화하여 DB에 저장한다.
 *
 * @param data - 의류 아이템 생성 입력 데이터
 * @returns 생성된 의류 아이템
 * @throws 유효성 검증 실패 시 ValidationError 배열을 포함한 에러
 */
export async function createItem(data: CreateClothingInput): Promise<ClothingItem> {
  // 유효성 검증 수행
  const validation: ValidationResult = validateClothingItem(data);
  if (!validation.valid) {
    const error = new Error('유효성 검증에 실패했습니다.');
    (error as Error & { validationErrors: typeof validation.errors }).validationErrors =
      validation.errors;
    throw error;
  }

  // DB에 저장 (wearCount는 항상 0으로 강제 설정)
  const record = await prisma.clothingItem.create({
    data: {
      imageUrl: data.imageUrl ?? null,
      category: data.category,
      color: data.color,
      seasons: JSON.stringify(data.seasons ?? []),
      styleTags: JSON.stringify(data.styleTags ?? []),
      memo: data.memo ?? null,
      wearCount: 0, // 착용 빈도 초기값 0 강제 설정 (입력값 무시)
    },
  });

  return toClothingItem(record);
}

/**
 * 기존 의류 아이템을 수정한다.
 *
 * - 수정 데이터의 유효성을 기존 데이터와 병합하여 검증한다.
 * - seasons와 styleTags가 제공된 경우 JSON 문자열로 직렬화한다.
 *
 * @param id - 수정할 아이템의 고유 ID
 * @param data - 수정할 필드 데이터
 * @returns 수정된 의류 아이템
 * @throws 아이템이 존재하지 않거나 유효성 검증 실패 시 에러
 */
export async function updateItem(id: string, data: UpdateClothingInput): Promise<ClothingItem> {
  // 기존 아이템 조회
  const existing = await prisma.clothingItem.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`ID '${id}'에 해당하는 의류 아이템을 찾을 수 없습니다.`);
  }

  // 기존 데이터와 수정 데이터를 병합하여 유효성 검증
  const merged = {
    category: data.category ?? existing.category,
    color: data.color ?? existing.color,
    seasons: data.seasons ?? JSON.parse(existing.seasons),
    styleTags: data.styleTags ?? JSON.parse(existing.styleTags),
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
    memo: data.memo !== undefined ? data.memo : existing.memo,
  };

  const validation: ValidationResult = validateClothingItem(merged);
  if (!validation.valid) {
    const error = new Error('유효성 검증에 실패했습니다.');
    (error as Error & { validationErrors: typeof validation.errors }).validationErrors =
      validation.errors;
    throw error;
  }

  // DB 업데이트를 위한 데이터 구성
  const updateData: Record<string, unknown> = {};

  if (data.category !== undefined) {
    updateData.category = data.category;
  }
  if (data.color !== undefined) {
    updateData.color = data.color;
  }
  if (data.seasons !== undefined) {
    updateData.seasons = JSON.stringify(data.seasons);
  }
  if (data.styleTags !== undefined) {
    updateData.styleTags = JSON.stringify(data.styleTags);
  }
  if (data.imageUrl !== undefined) {
    updateData.imageUrl = data.imageUrl;
  }
  if (data.memo !== undefined) {
    updateData.memo = data.memo;
  }

  const record = await prisma.clothingItem.update({
    where: { id },
    data: updateData,
  });

  return toClothingItem(record);
}

/**
 * 의류 아이템을 삭제한다.
 *
 * Prisma 스키마에서 OutfitItem과 Feedback에 onDelete: Cascade가 설정되어 있으므로,
 * 의류 아이템 삭제 시 연관된 OutfitItem 레코드도 자동으로 함께 삭제된다.
 *
 * @param id - 삭제할 아이템의 고유 ID
 * @throws 아이템이 존재하지 않으면 에러
 */
export async function deleteItem(id: string): Promise<void> {
  // 아이템 존재 여부 확인
  const existing = await prisma.clothingItem.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`ID '${id}'에 해당하는 의류 아이템을 찾을 수 없습니다.`);
  }

  // 삭제 실행 (연관 데이터는 Prisma cascade로 자동 삭제)
  await prisma.clothingItem.delete({ where: { id } });
}

/**
 * 의류 아이템 목록을 조회한다 (필터 지원).
 *
 * - 필터가 없으면 전체 목록을 반환한다.
 * - category 필터: 해당 카테고리의 아이템만 반환
 * - season 필터: 해당 계절이 포함된 아이템만 반환 (JSON contains 검색)
 * - 두 필터를 동시에 적용하면 AND 조건으로 동작한다.
 *
 * @param filter - 옷장 필터 (카테고리, 계절 선택적)
 * @returns 필터 조건에 맞는 의류 아이템 배열
 */
export async function getItems(filter?: ClothingFilter): Promise<ClothingItem[]> {
  // Prisma where 조건 구성
  const where: Record<string, unknown> = {};

  if (filter?.category) {
    where.category = filter.category;
  }

  if (filter?.season) {
    // seasons 필드는 JSON 문자열로 저장되어 있으므로 contains로 검색
    // 예: '["spring","summer"]' 에서 "spring" 포함 여부 확인
    where.seasons = { contains: filter.season };
  }

  const records = await prisma.clothingItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return records.map(toClothingItem);
}

/**
 * 특정 ID의 의류 아이템을 조회한다.
 *
 * @param id - 조회할 아이템의 고유 ID
 * @returns 의류 아이템 객체, 존재하지 않으면 null
 */
export async function getItemById(id: string): Promise<ClothingItem | null> {
  const record = await prisma.clothingItem.findUnique({ where: { id } });

  if (!record) {
    return null;
  }

  return toClothingItem(record);
}
