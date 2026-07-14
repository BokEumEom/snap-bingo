import { useState } from 'react';
import { ArrowLeft, Image, Trash2, ChevronRight } from 'lucide-react';
import { useDialog, Button, Badge } from '@toss/tds-mobile';
import { BingoBoard, NavKey } from '../types';
import Emoji from './Emoji';
import PieceGrid from './PieceGrid';
import SummerPieceDetail from './SummerPieceDetail';
import BottomNav from './BottomNav';

interface GalleryViewProps {
  boards: BingoBoard[];
  onNavigate: (view: NavKey) => void;
  onClearGallery: () => void; // Let them reset for testing! Extremely helpful.
}

// "여름 조각" 탭 — 챌린지별 '9조각 카드'를 모아 보여줘요.
// 카드를 탭하면 그 챌린지의 인증 사진을 낱장 캐러셀로 감상하고 바로 공유할 수 있어요.
// (예전 낱장 2열 그리드 아카이브는 빙고판·인증현황과 사진이 중복돼 약했어서, 공유 산출물인
//  카드가 주인공이 되도록 교체했어요.)
export default function GalleryView({
  boards,
  onNavigate,
  onClearGallery
}: GalleryViewProps) {
  const { openConfirm } = useDialog();
  const [selected, setSelected] = useState<BingoBoard | null>(null);

  // 인증 사진이 하나라도 있는 챌린지만 '여름 조각'으로 모아요.
  const piecedBoards = boards.filter((board) =>
    board.cells.some((cell) => cell.completed && cell.photoUrl)
  );

  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans relative flex flex-col slide-clip-x">

      {/* TopAppBar */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <button
          onClick={() => onNavigate('dashboard')}
          aria-label="뒤로 가기"
          className="justify-self-start w-8 h-8 rounded-full! bg-neutral-50 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight text-center mb-0!">여름 조각</h1>
        <button
          onClick={async () => {
            const ok = await openConfirm({
              title: '여름 조각을 초기화할까요?',
              description: '모든 업로드 내역이 사라지고 처음 상태로 돌아가요.',
              confirmButton: '초기화',
              cancelButton: '취소',
            });
            if (ok) onClearGallery();
          }}
          className="justify-self-end w-8 h-8 rounded-full! bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-95"
          aria-label="여름 조각 초기화"
          title="여름 조각 초기화"
        >
          <Trash2 size={16} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 space-y-6 animate-slide-in-right">

        {/* Intro */}
        <section className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">나의 여름 조각들</h2>
          <p className="text-xs text-neutral-500 font-medium">완성한 여름을 9칸 카드로 모아, 한 장으로 자랑해요</p>
        </section>

        {/* Cards */}
        {piecedBoards.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center">
              <Image size={28} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-neutral-800">아직 모은 여름 조각이 없어요</p>
              <p className="text-xs text-neutral-400 max-w-[220px] mx-auto leading-relaxed">
                빙고판에서 빈 칸을 탭하고 여름 미션 사진을 인증하면 카드가 채워져요!
              </p>
            </div>
            <Button
              color="primary"
              size="small"
              onClick={() => onNavigate('dashboard')}
            >
              빙고 하러가기
            </Button>
          </div>
        ) : (
          <section className="space-y-4">
            {piecedBoards.map((board) => {
              const completed = board.cells.filter((c) => c.completed).length;
              const total = board.cells.length;
              const isPerfect = total > 0 && completed === total;

              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => setSelected(board)}
                  className="w-full text-left bg-surface rounded-[24px] border border-hairline/60 shadow-sm p-4 space-y-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Emoji emoji={board.emoji} size={20} className="flex-shrink-0" alt="" />
                      <span className="text-sm font-bold text-neutral-900 truncate">{board.title}</span>
                    </div>
                    <Badge variant="weak" size="xsmall" color={isPerfect ? 'green' : 'blue'}>
                      {`${completed}/${total}`}
                    </Badge>
                  </div>

                  <PieceGrid board={board} />

                  <div className="flex items-center justify-end gap-0.5 text-xs font-semibold text-neutral-400">
                    낱장으로 보기
                    <ChevronRight size={14} />
                  </div>
                </button>
              );
            })}
          </section>
        )}

      </main>

      <BottomNav current="gallery" onNavigate={onNavigate} />

      {/* 카드 상세 — 큰 카드 + 낱장 캐러셀 + 공유 */}
      {selected != null && (
        <SummerPieceDetail board={selected} onClose={() => setSelected(null)} />
      )}

    </div>
  );
}
