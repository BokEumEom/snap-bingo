import { BingoBoard } from '../types';
import { APP_ICON } from '../data';

interface PieceGridProps {
  board: BingoBoard;
}

// "여름 조각" 기념 카드의 핵심 시각 요소 — 3×3 souvenir 그리드예요.
// 인증현황 카드와 갤러리("여름 조각") 카드가 공유해요(중복 제거).
// 가운데 칸(index 4)은 브랜드 로고 워터마크, 나머지는 인증 사진 또는 빈 칸 점이에요.
// (BoardDetailView의 기능용 그리드와 달리 체크마크·업로드가 없는 감상/공유용이에요.)
export default function PieceGrid({ board }: PieceGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {board.cells.map((cell, i) => {
        // 가운데 칸(index 4)은 브랜드 로고 워터마크로 표시해요.
        if (i === 4) {
          return (
            <div
              key={i}
              className="relative aspect-square rounded-[16px] overflow-hidden border border-blue-100/40"
            >
              <img
                src={APP_ICON}
                alt="찍고빙고"
                className="w-full h-full object-cover scale-110"
              />
            </div>
          );
        }

        return (
          <div
            key={i}
            className="relative aspect-square rounded-[16px] overflow-hidden bg-neutral-50 border border-hairline"
          >
            {cell.completed && cell.photoUrl ? (
              <img
                src={cell.photoUrl}
                alt={cell.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50 text-neutral-200">
                <div className="w-1.5 h-1.5 bg-neutral-200 rounded-full"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
