import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast, Button } from '@toss/tds-mobile';
import { BingoBoard } from '../types';
import { shareApp } from '../lib/share';
import { countBingoLines } from '../lib/badges';
import SummerPieceCard from './SummerPieceCard';

interface SummerPieceDetailProps {
  board: BingoBoard;
  onClose: () => void;
}

// "여름 조각" 상세 오버레이 — 기념 카드(공유 산출물)를 크게 보여주고,
// 탭한 챌린지의 인증 사진들을 낱장 캐러셀로 감상해요. 하단에서 바로 공유할 수 있어요.
// (Phase 1: 텍스트+링크 공유. 콜라주 이미지 저장/공유 프리뷰는 후속 단계에서 붙여요.)
export default function SummerPieceDetail({ board, onClose }: SummerPieceDetailProps) {
  const { openToast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // 캐러셀에는 실제 인증(사진 있는) 칸만 넣어요.
  const photos = board.cells.filter((c) => c.completed && c.photoUrl);

  const completedCount = board.cells.filter((c) => c.completed).length;
  const totalCount = board.cells.length;
  const isPerfect = totalCount > 0 && completedCount === totalCount;
  const hasBingo = countBingoLines(board) >= 1;

  const handleShare = async () => {
    setIsSharing(true);
    const message = isPerfect
      ? '찍고빙고에서 여름 빙고를 완성했어요! 🥳 같이 여름 빙고 채워요'
      : hasBingo
        ? '찍고빙고에서 빙고 한 줄을 완성했어요! 🎉 같이 여름 빙고 채워요'
        : '찍고빙고에서 여름 사진 빙고를 채우는 중이에요! 📸 같이 해요';
    await shareApp(openToast, message);
    setIsSharing(false);
  };

  // 스크롤 위치로 현재 낱장 인덱스를 계산해요(스크롤-스냅 캐러셀).
  const handleScroll = () => {
    const el = trackRef.current;
    if (el == null || el.clientWidth === 0) {
      return;
    }
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="fixed inset-0 z-50 bg-page flex flex-col animate-fade-in">
      {/* TopAppBar */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full bg-page/80 backdrop-blur-md shrink-0">
        <button
          onClick={onClose}
          aria-label="뒤로 가기"
          className="justify-self-start w-8 h-8 rounded-full! bg-neutral-50 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 tracking-tight text-center truncate mb-0!">
          {board.title}
        </h1>
        <span aria-hidden="true" />
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-6">
        {/* 공유 산출물 = 여름 조각 카드 */}
        <SummerPieceCard board={board} />

        {/* 낱장 캐러셀 */}
        {photos.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-neutral-900">낱장으로 보기</h2>
              <span className="text-xs font-semibold text-neutral-400">
                {active + 1} / {photos.length}
              </span>
            </div>

            <div
              ref={trackRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-5 px-5 gap-3"
            >
              {photos.map((cell, i) => (
                <figure
                  key={i}
                  className="snap-center shrink-0 w-[calc(100%-2.5rem)] first:ml-0"
                >
                  <div className="aspect-square rounded-[24px] overflow-hidden bg-neutral-50 border border-hairline shadow-sm">
                    <img
                      src={cell.photoUrl}
                      alt={cell.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 px-1 space-y-0.5">
                    <p className="text-sm font-extrabold text-neutral-900 truncate">
                      {cell.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold">
                      {cell.dateCompleted && <span>{cell.dateCompleted}</span>}
                      {cell.completedBy?.nickname && (
                        <span className="text-blue-500">
                          {cell.completedBy.nickname}님이 채움
                        </span>
                      )}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>

            {/* 도트 인디케이터 */}
            {photos.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === active ? 'w-4 bg-blue-500' : 'w-1.5 bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Action */}
      <div className="px-5 pb-8 pt-2 shrink-0">
        <Button
          color="primary"
          display="block"
          size="xlarge"
          loading={isSharing}
          onClick={handleShare}
        >
          친구에게 공유하기
        </Button>
      </div>
    </div>
  );
}
