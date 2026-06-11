/**
 * 옷 수정 페이지 (/closet/[id]/edit)
 *
 * 기존 의류 아이템의 정보를 수정하기 위한 페이지이다.
 * getItemById로 기존 데이터를 조회한 후, ClothingForm 컴포넌트를 'edit' 모드로 렌더링한다.
 * 아이템이 존재하지 않으면 404 페이지를 표시한다.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import ClothingForm from '@/components/closet/ClothingForm';
import { updateClothingAction } from '@/actions/closet';
import { getItemById } from '@/services/closet.service';

export const dynamic = 'force-dynamic';

export default async function EditClothingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let item;
  try {
    item = await getItemById(id);
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl mb-4">🪞</span>
        <p className="text-lg font-medium mb-2">데모 모드</p>
        <p className="text-sm text-gray-500">로컬 환경에서 DB를 설정하면 수정 기능을 사용할 수 있습니다.</p>
      </div>
    );
  }

  // 아이템이 존재하지 않으면 404 반환
  if (!item) {
    notFound();
  }

  // updateClothingAction에 id를 바인딩하여 ClothingForm의 action 시그니처에 맞춤
  const boundAction = updateClothingAction.bind(null, id);

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
          <h1 className="text-2xl font-bold text-gray-900">옷 수정</h1>
          <p className="mt-1 text-sm text-gray-600">
            의류 아이템 정보를 수정합니다.
          </p>
        </div>

        {/* 폼 컴포넌트 (수정 모드, 기존 데이터 미리 채우기) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ClothingForm mode="edit" initialData={item} action={boundAction} />
        </div>
      </div>
    </main>
  );
}
