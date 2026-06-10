"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/** 네비게이션 링크 목록 정의 */
const navLinks = [
  { href: "/closet", label: "옷장" },
  { href: "/recommend", label: "코디 추천" },
  { href: "/shopping", label: "쇼핑 추천" },
  { href: "/outfits", label: "저장된 코디" },
];

/**
 * 네비게이션 컴포넌트
 * - 데스크톱(md 이상): 수평 네비게이션 링크
 * - 모바일(md 미만): 햄버거 메뉴 버튼 + 펼침 동작
 * - 현재 활성 페이지를 시각적으로 구분 (색상 + 하단 밑줄)
 */
export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /** 현재 경로가 링크와 일치하는지 확인 */
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav>
      {/* 데스크톱 네비게이션 (md 이상에서 표시) */}
      <ul className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-500 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* 모바일 햄버거 메뉴 버튼 (md 미만에서 표시) */}
      <button
        className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? (
          // X 아이콘 (닫기)
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // 햄버거 아이콘 (열기)
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {/* 모바일 펼침 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
          <ul className="flex flex-col py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-blue-600 bg-blue-50 border-l-4 border-blue-600"
                      : "text-gray-700 hover:text-blue-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
