/**
 * 옷 등록 페이지 (/closet/new)
 *
 * 새로운 의류 아이템을 등록하기 위한 페이지이다.
 * ClothingForm 컴포넌트를 'create' 모드로 렌더링한다.
 */

import Link from 'next/link';
import ClothingForm from '@/components/closet/ClothingForm';
import { createClothingAction } from '@/actions/closet';

export default function NewClothingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 영역 */}
        <div className="mb-6">
          <Link
            href="/closet"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            옷장으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">옷 등록</h1>
          <p className="mt-1 text-sm text-gray-600">
            새로운 의류 아이템을 옷장에 등록합니다.
          </p>
        </div>

        {/* 폼 컴포넌트 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ClothingForm mode="create" action={createClothingAction} />
        </div>
      </div>
    </main>
  );
}
