import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@toss/tds-mobile';

interface BoardDetailSkeletonProps {
  // 로딩 중에도 뒤로 나갈 수 있게 해요(방이 느리거나 사라져도 갇히지 않도록).
  onBack: () => void;
}

// 함께 보드를 여는 동안 보여주는 로딩 골격이에요.
// 회전하는 텍스트 대신 TDS Skeleton으로 '제목·부제목·카드'가 곧 나온다는 걸 미리 알려줘요.
// (TDS Skeleton은 리스트/카드용이라 3×3 그리드 자체는 표현하지 않고, 콘텐츠 로딩 느낌을 줘요.)
export default function BoardDetailSkeleton({
  onBack,
}: BoardDetailSkeletonProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans relative">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <button
          onClick={onBack}
          aria-label="뒤로 가기"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100/60 active:scale-95 transition-all justify-self-start"
        >
          <ArrowLeft size={22} className="text-neutral-700" />
        </button>
        <span aria-hidden />
        <span aria-hidden />
      </header>

      <main
        className="pt-3"
        aria-busy="true"
        aria-label="함께 보드를 여는 중이에요"
      >
        <Skeleton
          custom={['title', 'subtitle', 'spacer(28)', 'card', 'card', 'card']}
          repeatLastItemCount={0}
          background="greyOpacity100"
        />
      </main>
    </div>
  );
}
