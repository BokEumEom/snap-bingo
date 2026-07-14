import { Sparkles } from 'lucide-react';
import { Badge } from '@toss/tds-mobile';
import { BingoBoard } from '../types';
import { countBingoLines } from '../lib/badges';
import PieceGrid from './PieceGrid';
import Emoji from './Emoji';

interface SummerPieceCardProps {
  board: BingoBoard;
}

// "여름 조각" 기념 카드(souvenir) — 인증현황 화면과 갤러리 상세에서 공용으로 써요.
// 진행도에 따라 축하 chrome를 다르게 표시해요(항상 "완료"로 단정하지 않도록).
// 순수 표현 컴포넌트라 공유/저장 액션은 이 카드를 감싸는 화면이 담당해요.
export default function SummerPieceCard({ board }: SummerPieceCardProps) {
  const completedCount = board.cells.filter((c) => c.completed).length;
  const totalCount = board.cells.length;
  const isPerfect = totalCount > 0 && completedCount === totalCount;
  const hasBingo = countBingoLines(board) >= 1;
  const isDone = isPerfect || hasBingo;

  return (
    <div className="w-full bg-surface rounded-[32px] overflow-hidden shadow-xl border border-hairline/60 p-6 flex flex-col relative">
      {/* Sparkles effect */}
      <div className="absolute top-4 right-4 text-amber-400 animate-pulse">
        <Sparkles size={20} />
      </div>

      {/* Header section inside card */}
      <div className="flex flex-col items-center mb-5 text-center">
        <div className="mb-2">
          <Badge
            variant="weak"
            size="small"
            color={isPerfect ? 'yellow' : hasBingo ? 'green' : 'blue'}
          >
            {isPerfect
              ? '여름 미션 완료'
              : hasBingo
                ? '빙고 달성'
                : `${completedCount}/${totalCount} 진행 중`}
          </Badge>
        </div>
        <h2 className="text-3xl font-extrabold text-blue-600 tracking-tighter">
          {isDone ? 'BINGO!' : '빙고 진행 중'}
        </h2>
        <p className="text-xs text-neutral-400 mt-1">나의 여름 조각들</p>
      </div>

      {/* 3x3 Bingo Grid — 내 실제 빙고판(가운데는 브랜드 워터마크) */}
      <div className="mb-5">
        <PieceGrid board={board} />
      </div>

      {/* Card Footer */}
      <div className="flex justify-between items-center gap-2 pt-4 border-t border-hairline">
        <div className="flex items-center gap-1.5 min-w-0">
          <Emoji emoji={board.emoji} size={18} className="flex-shrink-0" alt="" />
          <span className="text-xs font-bold text-neutral-800 truncate">
            {board.title}
          </span>
        </div>
        <p className="text-[11px] font-extrabold text-blue-600 flex-shrink-0">
          찍고빙고
        </p>
      </div>
    </div>
  );
}
