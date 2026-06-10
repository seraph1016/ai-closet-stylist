import Link from "next/link";
import { Suspense } from "react";
import { getItems } from "@/services/closet.service";
import type { Category, ClothingFilter, Season } from "@/types";
import { CATEGORIES, SEASONS } from "@/lib/constants";
import ClothingCard from "@/components/closet/ClothingCard";
import FilterBar from "@/components/closet/FilterBar";

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; season?: string }>;
}) {
  const params = await searchParams;

  const filter: ClothingFilter = {};
  if (params.category && CATEGORIES.includes(params.category as Category)) {
    filter.category = params.category as Category;
  }
  if (params.season && SEASONS.includes(params.season as Season)) {
    filter.season = params.season as Season;
  }

  const hasFilter = Object.keys(filter).length > 0;
  const items = await getItems(hasFilter ? filter : undefined);

  let totalItemCount = items.length;
  if (hasFilter && items.length === 0) {
    const allItems = await getItems();
    totalItemCount = allItems.length;
  }

  const isClosetEmpty = items.length === 0 && totalItemCount === 0;
  const isFilterEmpty = items.length === 0 && totalItemCount > 0;

  return (
    <div className="min-h-screen -mt-8 -mx-4 px-4 sm:px-6 lg:px-8 pb-16" style={{ background: "var(--color-cream)" }}>

      {/* ─── Hero 섹션 — 거울 프레임 모티프 ─── */}
      <section className="relative pt-12 pb-10 text-center animate-fade-in-up overflow-hidden">
        {/* 거울 글로우 배경 */}
        <div className="absolute inset-0 mirror-glow animate-soft-glow pointer-events-none" />

        {/* 거울 프레임 아이콘 */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full border-2 shadow-lg"
          style={{ borderColor: "var(--color-gold)", background: "rgba(255,255,255,0.8)" }}>
          <span className="text-4xl">🪞</span>
        </div>

        {/* 메인 카피 */}
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
          style={{ color: "var(--color-plum)" }}>
          오늘의 당신에게 어울리는<br className="hidden sm:block" /> 단 하나의 코디
        </h1>

        {/* 서브 카피 */}
        <p className="mt-4 text-base sm:text-lg max-w-md mx-auto animate-fade-in-up-delay-1"
          style={{ color: "var(--color-text-secondary)" }}>
          당신만의 옷장이, 매일 새로운 이야기를 들려줍니다
        </p>

        {/* CTA 버튼 */}
        <Link
          href="/closet/new"
          className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 animate-fade-in-up-delay-2"
          style={{ background: "var(--color-plum)", boxShadow: "0 8px 24px -6px rgba(91,45,110,0.3)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          내 옷장에 새 옷 추가하기
        </Link>
      </section>

      {/* ─── 필터 + 아이템 수 ─── */}
      <section className="max-w-6xl mx-auto animate-fade-in-up-delay-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
              나의 옷장
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {items.length}개의 소중한 아이템
            </p>
          </div>
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
        </div>

        {/* ─── 아이템 그리드 ─── */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up-delay-3">
            {items.map((item, index) => (
              <div key={item.id} className="animate-float-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <ClothingCard
                  id={item.id}
                  imageUrl={item.imageUrl}
                  category={item.category}
                  color={item.color}
                  memo={item.memo}
                />
              </div>
            ))}
          </div>
        ) : isClosetEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: "var(--color-plum-soft)" }}>
              <span className="text-5xl">🪞</span>
            </div>
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
              아직 거울에 비출 옷이 없어요
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              첫 번째 아이템을 등록하고 마법을 시작해보세요
            </p>
            <Link
              href="/closet/new"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:scale-105"
              style={{ background: "var(--color-plum)" }}
            >
              ✨ 첫 옷 등록하기
            </Link>
          </div>
        ) : isFilterEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: "var(--color-sage-light)" }}>
              <span className="text-4xl">🔍</span>
            </div>
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
              조건에 맞는 아이템을 찾지 못했어요
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              필터를 바꿔보거나, 새 옷을 추가해보세요
            </p>
            <Link
              href="/closet/new"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:scale-105"
              style={{ background: "var(--color-sage)" }}
            >
              새 옷 등록하기
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
