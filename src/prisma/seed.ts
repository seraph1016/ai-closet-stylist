/**
 * Prisma 시드 스크립트
 *
 * 모든 의류 카테고리(top, bottom, outer, shoes, accessory)에 걸쳐
 * 18개의 샘플 의류 아이템을 생성한다.
 * 다양한 색상, 계절, 스타일 태그 조합을 포함하여
 * seed 실행 후 바로 데모가 가능한 상태를 제공한다.
 *
 * 실행 방법: npx prisma db seed
 *
 * Validates: Requirements 9.5, 9.6
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 샘플 의류 아이템 데이터 정의
 *
 * 각 아이템은 카테고리, 색상, 계절, 스타일 태그, 메모를 포함한다.
 * 일부 아이템은 imageUrl을 포함하고, 일부는 포함하지 않아
 * 실제 사용 패턴을 반영한다.
 */
const sampleItems = [
  // ─── 상의 (Top) - 4개 ──────────────────────────────────────────
  {
    category: 'top',
    color: 'black',
    seasons: JSON.stringify(['spring', 'fall']),
    styleTags: JSON.stringify(['casual']),
    memo: '데일리 검정 티셔츠',
    imageUrl: null,
    wearCount: 5,
  },
  {
    category: 'top',
    color: 'white',
    seasons: JSON.stringify(['spring', 'summer', 'fall']),
    styleTags: JSON.stringify(['formal', 'minimal']),
    memo: '출근용 흰 셔츠',
    imageUrl: 'https://example.com/images/white-shirt.jpg',
    wearCount: 8,
  },
  {
    category: 'top',
    color: 'navy',
    seasons: JSON.stringify(['spring', 'fall', 'winter']),
    styleTags: JSON.stringify(['minimal']),
    memo: '네이비 니트',
    imageUrl: null,
    wearCount: 3,
  },
  {
    category: 'top',
    color: 'red',
    seasons: JSON.stringify(['summer', 'fall']),
    styleTags: JSON.stringify(['street', 'casual']),
    memo: '빨간 그래픽 티',
    imageUrl: 'https://example.com/images/red-tee.jpg',
    wearCount: 2,
  },

  // ─── 하의 (Bottom) - 4개 ───────────────────────────────────────
  {
    category: 'bottom',
    color: 'blue',
    seasons: JSON.stringify(['spring', 'summer', 'fall']),
    styleTags: JSON.stringify(['casual', 'street']),
    memo: '여름 데일리 청바지',
    imageUrl: null,
    wearCount: 10,
  },
  {
    category: 'bottom',
    color: 'black',
    seasons: JSON.stringify(['spring', 'summer', 'fall', 'winter']),
    styleTags: JSON.stringify(['formal', 'minimal']),
    memo: '면접용 검정 슬랙스',
    imageUrl: 'https://example.com/images/black-slacks.jpg',
    wearCount: 6,
  },
  {
    category: 'bottom',
    color: 'beige',
    seasons: JSON.stringify(['spring', 'summer']),
    styleTags: JSON.stringify(['minimal', 'casual']),
    memo: '베이지 치노 팬츠',
    imageUrl: null,
    wearCount: 4,
  },
  {
    category: 'bottom',
    color: 'gray',
    seasons: JSON.stringify(['fall', 'winter']),
    styleTags: JSON.stringify(['street']),
    memo: '회색 조거 팬츠',
    imageUrl: null,
    wearCount: 7,
  },

  // ─── 아우터 (Outer) - 3개 ──────────────────────────────────────
  {
    category: 'outer',
    color: 'navy',
    seasons: JSON.stringify(['fall', 'winter']),
    styleTags: JSON.stringify(['formal', 'minimal']),
    memo: '네이비 울 코트',
    imageUrl: 'https://example.com/images/navy-coat.jpg',
    wearCount: 3,
  },
  {
    category: 'outer',
    color: 'brown',
    seasons: JSON.stringify(['spring', 'fall']),
    styleTags: JSON.stringify(['casual']),
    memo: '가을 브라운 자켓',
    imageUrl: null,
    wearCount: 5,
  },
  {
    category: 'outer',
    color: 'black',
    seasons: JSON.stringify(['spring', 'fall', 'winter']),
    styleTags: JSON.stringify(['minimal', 'street']),
    memo: '블랙 라이더 자켓',
    imageUrl: 'https://example.com/images/black-rider.jpg',
    wearCount: 4,
  },

  // ─── 신발 (Shoes) - 4개 ────────────────────────────────────────
  {
    category: 'shoes',
    color: 'black',
    seasons: JSON.stringify(['spring', 'summer', 'fall', 'winter']),
    styleTags: JSON.stringify(['formal']),
    memo: '검정 구두 (출근/면접)',
    imageUrl: null,
    wearCount: 9,
  },
  {
    category: 'shoes',
    color: 'white',
    seasons: JSON.stringify(['spring', 'summer']),
    styleTags: JSON.stringify(['casual', 'street']),
    memo: '화이트 스니커즈',
    imageUrl: 'https://example.com/images/white-sneakers.jpg',
    wearCount: 12,
  },
  {
    category: 'shoes',
    color: 'brown',
    seasons: JSON.stringify(['spring', 'fall']),
    styleTags: JSON.stringify(['minimal', 'casual']),
    memo: '브라운 로퍼',
    imageUrl: null,
    wearCount: 6,
  },
  {
    category: 'shoes',
    color: 'navy',
    seasons: JSON.stringify(['summer', 'fall']),
    styleTags: JSON.stringify(['street']),
    memo: '네이비 캔버스화',
    imageUrl: null,
    wearCount: 3,
  },

  // ─── 액세서리 (Accessory) - 3개 ────────────────────────────────
  {
    category: 'accessory',
    color: 'yellow',
    seasons: JSON.stringify(['spring', 'summer', 'fall']),
    styleTags: JSON.stringify(['casual']),
    memo: '골드 체인 목걸이',
    imageUrl: null,
    wearCount: 4,
  },
  {
    category: 'accessory',
    color: 'gray',
    seasons: JSON.stringify(['spring', 'summer', 'fall', 'winter']),
    styleTags: JSON.stringify(['minimal', 'formal']),
    memo: '실버 시계',
    imageUrl: 'https://example.com/images/silver-watch.jpg',
    wearCount: 15,
  },
  {
    category: 'accessory',
    color: 'black',
    seasons: JSON.stringify(['fall', 'winter']),
    styleTags: JSON.stringify(['formal', 'minimal']),
    memo: '블랙 가죽 벨트',
    imageUrl: null,
    wearCount: 8,
  },
];

/**
 * 메인 시드 함수
 *
 * 기존 데이터를 삭제한 후 샘플 의류 아이템을 생성한다.
 * 삭제 순서는 외래 키 관계를 고려하여 Feedback → OutfitItem → Outfit → ClothingItem 순이다.
 */
async function main(): Promise<void> {
  console.log('🌱 시드 데이터 생성을 시작합니다...');

  // 기존 데이터 초기화 (외래 키 의존 순서대로 삭제)
  await prisma.feedback.deleteMany();
  await prisma.outfitItem.deleteMany();
  await prisma.outfit.deleteMany();
  await prisma.clothingItem.deleteMany();

  console.log('🗑️  기존 데이터를 삭제했습니다.');

  // 샘플 의류 아이템 생성
  for (const item of sampleItems) {
    await prisma.clothingItem.create({
      data: item,
    });
  }

  console.log(`✅ ${sampleItems.length}개의 샘플 의류 아이템을 생성했습니다.`);
  console.log('   - 상의(top): 4개');
  console.log('   - 하의(bottom): 4개');
  console.log('   - 아우터(outer): 3개');
  console.log('   - 신발(shoes): 4개');
  console.log('   - 액세서리(accessory): 3개');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 시드 생성 중 오류가 발생했습니다:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
