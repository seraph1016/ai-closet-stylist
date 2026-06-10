# AI 옷장 스타일 추천 웹사이트

사용자가 보유한 옷을 등록·관리하고, 상황별 코디 조합을 규칙 기반 엔진으로 추천받으며, 부족한 아이템에 대한 쇼핑 검색 키워드를 제공하는 MVP 웹 애플리케이션입니다.

## 사전 요구사항

- **Node.js** 18 이상
- **npm** (Node.js 설치 시 포함)

## 설치 방법

```bash
npm install
```

## 데이터베이스 설정

Prisma 클라이언트를 생성하고 SQLite 데이터베이스를 초기화합니다.

```bash
npx prisma generate
npx prisma db push
```

## 시드 데이터

모든 의류 카테고리(top, bottom, outer, shoes, accessory)에 걸쳐 15~20개의 샘플 의류 아이템을 생성합니다. 시드 실행 후 바로 데모가 가능합니다.

```bash
npx prisma db seed
```

## 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속합니다.

## 테스트

```bash
# 전체 테스트 실행
npm test

# 프로퍼티 기반 테스트만 실행
npm run test:properties
```

## 프로젝트 디렉토리 구조

```
ai-closet-stylist/
├── prisma/
│   ├── schema.prisma          # Prisma 스키마 (ClothingItem, Outfit, OutfitItem, Feedback)
│   └── dev.db                 # SQLite 데이터베이스 파일
├── src/
│   ├── app/                   # Next.js App Router 페이지 및 레이아웃
│   │   ├── layout.tsx         # 루트 레이아웃 (네비게이션 포함)
│   │   ├── page.tsx           # 서비스 소개 페이지 (/)
│   │   ├── closet/            # 옷장 관리 (/closet, /closet/new, /closet/[id]/edit)
│   │   ├── recommend/         # 코디 추천 (/recommend)
│   │   ├── shopping/          # 쇼핑 추천 (/shopping)
│   │   └── outfits/           # 저장된 코디 목록 (/outfits)
│   ├── services/              # 비즈니스 로직 서비스 계층
│   │   ├── closet.service.ts  # 옷장 관리 (CRUD, 필터링)
│   │   ├── recommend.service.ts # 추천 엔진 (조합 생성, 점수 계산, 설명 생성)
│   │   ├── shopping.service.ts  # 쇼핑 분석 (갭 분석, 키워드 생성)
│   │   ├── feedback.service.ts  # 피드백 관리
│   │   └── scoring/           # 점수 계산 모듈 (색상 조화, 계절, 상황)
│   ├── actions/               # Next.js Server Actions
│   │   ├── closet.ts          # 옷장 CRUD 액션
│   │   ├── recommend.ts       # 추천 액션
│   │   └── feedback.ts        # 피드백 액션
│   ├── components/            # React UI 컴포넌트
│   │   ├── layout/            # 헤더, 네비게이션
│   │   ├── closet/            # 의류 카드, 폼, 필터
│   │   ├── recommend/         # 추천 폼, 코디 카드
│   │   └── shopping/          # 쇼핑 키워드 카드
│   ├── types/                 # 공유 TypeScript 타입 정의
│   │   └── index.ts
│   ├── lib/                   # 유틸리티 및 설정
│   │   ├── prisma.ts          # Prisma Client 싱글톤
│   │   ├── constants.ts       # 상수 (색상, 카테고리, 매핑 등)
│   │   └── validators.ts      # 공통 유효성 검증
│   ├── interfaces/            # 확장 인터페이스 (향후 연동용)
│   │   ├── llm.interface.ts   # LLM 연동 인터페이스
│   │   ├── image-ai.interface.ts # 이미지 분류 AI 인터페이스
│   │   └── auth.interface.ts  # 인증 인터페이스
│   └── prisma/                # 시드 스크립트
├── __tests__/                 # 테스트 파일
│   ├── properties/            # 프로퍼티 기반 테스트 (fast-check)
│   ├── unit/                  # 단위 테스트
│   └── integration/           # 통합 테스트
├── package.json
├── vitest.config.ts
├── next.config.ts
└── tsconfig.json
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| ORM | Prisma |
| 데이터베이스 | SQLite |
| 테스트 | Vitest + fast-check (Property-Based Testing) |
