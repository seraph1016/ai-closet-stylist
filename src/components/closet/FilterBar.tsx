"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Category, Season } from "@/types";
import { CATEGORIES, SEASONS } from "@/lib/constants";

const CATEGORY_LABELS: Record<Category, string> = {
  top: "상의",
  bottom: "하의",
  outer: "아우터",
  shoes: "신발",
  accessory: "액세서리",
};

const SEASON_LABELS: Record<Season, string> = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
};

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentSeason = searchParams.get("season") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/closet?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2">
        <label htmlFor="category-filter" className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
          카테고리
        </label>
        <select
          id="category-filter"
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
          style={{ borderColor: "rgba(0,0,0,0.08)", color: "var(--color-text-primary)" }}
        >
          <option value="">전체</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
      </div>

      {/* 계절 필터 */}
      <div className="flex items-center gap-2">
        <label htmlFor="season-filter" className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
          계절
        </label>
        <select
          id="season-filter"
          value={currentSeason}
          onChange={(e) => updateFilter("season", e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
          style={{ borderColor: "rgba(0,0,0,0.08)", color: "var(--color-text-primary)" }}
        >
          <option value="">전체</option>
          {SEASONS.map((season) => (
            <option key={season} value={season}>{SEASON_LABELS[season]}</option>
          ))}
        </select>
      </div>

      {/* 필터 초기화 */}
      {(currentCategory || currentSeason) && (
        <button
          onClick={() => router.push("/closet")}
          className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hover:opacity-80"
          style={{ color: "var(--color-plum)", background: "var(--color-plum-soft)" }}
        >
          ✕ 필터 초기화
        </button>
      )}
    </div>
  );
}
