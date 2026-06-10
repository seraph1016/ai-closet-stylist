import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen -mt-8 -mx-4">
      {/* 히어로 섹션 — 풀 블리드, 배경 이미지 + 오버레이 */}
      <section className="relative overflow-hidden px-6 py-40 sm:py-48 text-center">
        {/* 배경 이미지 (Unsplash 무료 패션 이미지) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80')",
          }}
        />
        {/* 다크 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* 장식 — 골드 글로우 */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />

        {/* 콘텐츠 */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* 거울 아이콘 — 골드 링 */}
          <div className="mb-8 flex items-center justify-center w-24 h-24 rounded-full border-2 border-amber-300/60 bg-white/10 backdrop-blur-sm shadow-2xl">
            <span className="text-5xl">🪞</span>
          </div>

          {/* 메인 제목 — Playfair 세리프 */}
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-white sm:text-6xl lg:text-7xl tracking-tight drop-shadow-2xl">
            AI 마법의 거울
          </h1>

          {/* 영문 서브타이틀 */}
          <p className="mt-3 font-[family-name:var(--font-playfair)] text-lg text-amber-200/90 italic tracking-wide sm:text-xl">
            Magic Mirror of Style
          </p>

          {/* 한글 부제 */}
          <p className="mt-6 max-w-2xl text-lg text-white/85 sm:text-xl leading-relaxed">
            &ldquo;거울아 거울아, 오늘 뭘 입을까?&rdquo;
          </p>
          <p className="mt-2 max-w-xl text-base text-white/60">
            AI가 당신의 옷장을 분석하고 완벽한 코디를 추천해드립니다
          </p>

          {/* CTA 버튼 — 골드 테마 */}
          <Link
            href="/closet"
            className="mt-12 inline-flex items-center gap-3 rounded-full border border-amber-300/40 bg-white/10 backdrop-blur-md px-10 py-4 text-lg font-semibold text-white shadow-2xl transition-all hover:scale-105 hover:bg-white/20 hover:border-amber-300/70 focus:outline-none focus:ring-4 focus:ring-amber-300/30"
          >
            <span className="text-2xl">✨</span>
            마법의 옷장 열기
          </Link>
        </div>
      </section>

      {/* 기능 카드 섹션 */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        {/* 섹션 제목 */}
        <div className="text-center mb-16">
          <p className="font-[family-name:var(--font-playfair)] text-sm uppercase tracking-[0.3em] text-purple-600 mb-3">
            Features
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-gray-900 sm:text-4xl">
            마법의 거울이 할 수 있는 것들
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-lg mx-auto">
            세 가지 마법으로 당신의 스타일을 완성하세요
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* 옷장 관리 카드 */}
          <div className="group relative rounded-3xl bg-white p-10 shadow-lg ring-1 ring-gray-100 transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-purple-500 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 text-4xl shadow-sm">
              👔
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-gray-900 mb-3">
              옷장 관리
            </h3>
            <p className="text-gray-500 leading-relaxed">
              내 옷장의 모든 옷을 한눈에 관리하고, 카테고리와 계절별로 정리하세요
            </p>
          </div>

          {/* 코디 추천 카드 */}
          <div className="group relative rounded-3xl bg-white p-10 shadow-lg ring-1 ring-gray-100 transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-pink-500 to-rose-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-50 text-4xl shadow-sm">
              🪄
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-gray-900 mb-3">
              AI 코디 추천
            </h3>
            <p className="text-gray-500 leading-relaxed">
              상황과 날씨에 맞는 완벽한 코디를 AI가 마법처럼 찾아드려요
            </p>
          </div>

          {/* 쇼핑 추천 카드 */}
          <div className="group relative rounded-3xl bg-white p-10 shadow-lg ring-1 ring-gray-100 transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-amber-500 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 text-4xl shadow-sm">
              🛍️
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-gray-900 mb-3">
              스마트 쇼핑
            </h3>
            <p className="text-gray-500 leading-relaxed">
              부족한 아이템을 분석하고, 기존 옷과 어울리는 아이템만 추천해요
            </p>
          </div>
        </div>
      </section>

      {/* 하단 CTA — 다크 엘레강스 */}
      <section className="relative overflow-hidden bg-gray-900 px-6 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-pink-900/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="relative z-10">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white sm:text-3xl">
            지금 바로 마법을 시작하세요
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-md mx-auto">
            옷장에 옷을 등록하면 AI가 자동으로 코디를 추천해드립니다
          </p>
          <Link
            href="/closet"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-8 py-3 text-base font-semibold text-amber-300 transition-all hover:scale-105 hover:bg-amber-400/20 hover:border-amber-400/50"
          >
            시작하기 →
          </Link>
        </div>
      </section>
    </main>
  );
}
