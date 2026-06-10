"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category, Color } from "@/types";
import { deleteClothingAction } from "@/actions/closet";

const CATEGORY_LABELS: Record<Category, string> = {
  top: "상의",
  bottom: "하의",
  outer: "아우터",
  shoes: "신발",
  accessory: "액세서리",
};

const COLOR_LABELS: Record<Color, string> = {
  black: "블랙",
  white: "화이트",
  gray: "그레이",
  red: "레드",
  blue: "블루",
  green: "그린",
  yellow: "옐로우",
  pink: "핑크",
  brown: "브라운",
  beige: "베이지",
  navy: "네이비",
  purple: "퍼플",
};

const COLOR_CSS: Record<Color, string> = {
  black: "bg-gray-900",
  white: "bg-white border border-gray-200",
  gray: "bg-gray-400",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  pink: "bg-pink-400",
  brown: "bg-amber-700",
  beige: "bg-amber-100 border border-amber-200",
  navy: "bg-blue-900",
  purple: "bg-purple-500",
};

interface ClothingCardProps {
  id: string;
  imageUrl: string | null;
  category: Category;
  color: Color;
  memo: string | null;
}

export default function ClothingCard({
  id,
  imageUrl,
  category,
  color,
  memo,
}: ClothingCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const itemName = memo || `${CATEGORY_LABELS[category]} - ${COLOR_LABELS[color]}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteMessage(null);
    try {
      const result = await deleteClothingAction(id);
      if (result.success) {
        setDeleteMessage({ type: "success", text: "삭제되었습니다." });
        setTimeout(() => window.location.reload(), 800);
      } else {
        setDeleteMessage({ type: "error", text: result.message });
        setIsDeleting(false);
      }
    } catch {
      setDeleteMessage({ type: "error", text: "삭제에 실패했습니다." });
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* ─── 카드 — 크림 배경, 부드러운 둥근 모서리, 호버 떠오름 ─── */}
      <div className="card-hover group relative rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm overflow-hidden">

        {/* 이미지 영역 */}
        <div className="aspect-[4/5] w-full flex items-center justify-center overflow-hidden" style={{ background: "var(--color-ivory)" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${CATEGORY_LABELS[category]} - ${COLOR_LABELS[color]}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2" style={{ color: "var(--color-text-muted)" }}>
              <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs opacity-60">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="p-4">
          {/* 상단 — 카테고리 + 색상 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: "var(--color-plum-soft)", color: "var(--color-plum)" }}>
              {CATEGORY_LABELS[category]}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-3.5 h-3.5 rounded-full shadow-sm ${COLOR_CSS[color]}`}
                aria-label={`색상: ${COLOR_LABELS[color]}`} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{COLOR_LABELS[color]}</span>
            </div>
          </div>

          {/* 메모 */}
          {memo && (
            <p className="text-sm truncate mb-3" style={{ color: "var(--color-text-secondary)" }} title={memo}>
              {memo}
            </p>
          )}

          {/* 액션 버튼 — 수정 / 삭제 */}
          <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
            <Link
              href={`/closet/${id}/edit`}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 hover:shadow-sm"
              style={{ color: "var(--color-plum)", background: "var(--color-plum-soft)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              수정
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-red-500 bg-red-50 transition-all duration-200 hover:bg-red-100 hover:shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* ─── 삭제 확인 모달 — 리디자인 ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!isDeleting) { setShowDeleteModal(false); setDeleteMessage(null); } }}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fade-in-up">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              정말 삭제하시겠어요?
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              <span className="font-medium">&ldquo;{itemName}&rdquo;</span>을(를) 삭제하면 복구할 수 없습니다.
            </p>

            {deleteMessage && (
              <div className={`mb-4 rounded-xl px-4 py-2.5 text-sm ${
                deleteMessage.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {deleteMessage.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteMessage(null); }}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
                style={{ color: "var(--color-text-primary)" }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteMessage?.type === "success"}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
