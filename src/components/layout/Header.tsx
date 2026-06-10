import Link from "next/link";
import Navigation from "./Navigation";

/**
 * 헤더 컴포넌트
 * - 서비스 로고/타이틀과 네비게이션을 포함
 * - 일관된 여백, 미세한 그림자 적용
 * - 모바일 메뉴 펼침을 위해 relative 포지션 설정
 */
export default function Header() {
  return (
    <header className="relative bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* 서비스 로고/타이틀 */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors"
        >
          🪞 AI 마법의 거울
        </Link>

        {/* 네비게이션 */}
        <Navigation />
      </div>
    </header>
  );
}
