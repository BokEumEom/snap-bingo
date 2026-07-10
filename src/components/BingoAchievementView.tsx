import { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useToast, Button, Badge } from '@toss/tds-mobile';
import { BingoBoard } from '../types';
import { APP_ICON } from '../data';
import { shareApp } from '../lib/share';
import { countBingoLines } from '../lib/badges';

interface BingoAchievementViewProps {
  board: BingoBoard;
  onBack: () => void;
  onClose: () => void;
}

export default function BingoAchievementView({
  board,
  onBack,
  onClose
}: BingoAchievementViewProps) {
  const { openToast } = useToast();

  // 실제 진행도에 따라 축하 chrome를 다르게 표시한다(항상 "완료"로 단정하지 않도록).
  const completedCount = board.cells.filter((c) => c.completed).length;
  const totalCount = board.cells.length;
  const isPerfect = totalCount > 0 && completedCount === totalCount;
  const hasBingo = countBingoLines(board) >= 1;
  const isDone = isPerfect || hasBingo;

  const [isShareSuccess, setIsShareSuccess] = useState(false);

  const handleShare = async () => {
    setIsShareSuccess(true);
    const shareMessage = isPerfect
      ? '찍고빙고에서 여름 빙고를 완성했어요! 🥳 같이 여름 빙고 채워요'
      : hasBingo
        ? '찍고빙고에서 빙고 한 줄을 완성했어요! 🎉 같이 여름 빙고 채워요'
        : '찍고빙고에서 여름 사진 빙고를 채우는 중이에요! 📸 같이 해요';
    await shareApp(openToast, shareMessage);
    setIsShareSuccess(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans relative flex flex-col justify-between">
      
      {/* TopAppBar */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <button
          onClick={onBack}
          aria-label="뒤로 가기"
          className="justify-self-start w-8 h-8 rounded-full! bg-neutral-50 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight text-center mb-0!">{isDone ? '빙고 달성!' : '인증 현황'}</h1>
        <button
          onClick={onClose}
          className="justify-self-end text-sm font-semibold text-blue-600 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full! transition-all active:scale-95"
        >
          닫기
        </button>
      </header>

      {/* Main Content Scroll container */}
      <main className="flex-1 px-5 py-5 flex flex-col items-center justify-center animate-fade-in space-y-6">
        
        {/* Souvenir Achievement Card */}
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
                {isPerfect ? '여름 미션 완료' : hasBingo ? '빙고 달성' : `${completedCount}/${totalCount} 진행 중`}
              </Badge>
            </div>
            <h2 className="text-3xl font-extrabold text-blue-600 tracking-tighter">
              {isDone ? 'BINGO!' : '빙고 진행 중'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">나의 여름 조각들</p>
          </div>

          {/* 3x3 Bingo Grid — 내 실제 빙고판(가운데는 브랜드 워터마크) */}
          <div className="grid grid-cols-3 gap-2 w-full mb-5">
            {board.cells.map((cell, i) => {
              // 가운데 칸(index 4)은 브랜드 로고 워터마크로 표시해요.
              if (i === 4) {
                return (
                  <div key={i} className="relative aspect-square rounded-[16px] overflow-hidden border border-blue-100/40">
                    <img
                      src={APP_ICON}
                      alt="찍고빙고"
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                );
              }

              return (
                <div key={i} className="relative aspect-square rounded-[16px] overflow-hidden bg-neutral-50 border border-hairline">
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

          {/* Card Footer */}
          <div className="flex justify-between items-center gap-2 pt-4 border-t border-hairline">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base flex-shrink-0">{board.emoji}</span>
              <span className="text-xs font-bold text-neutral-800 truncate">{board.title}</span>
            </div>
            <p className="text-[11px] font-extrabold text-blue-600 flex-shrink-0">찍고빙고</p>
          </div>

        </div>

        {/* Congratulations / progress Text */}
        <p className="text-xs font-medium text-neutral-500 text-center leading-relaxed px-4">
          {isPerfect ? (
            <>
              축하합니다! 모든 여름 미션을 완료하셨네요.<br />
              소중하게 담은 순간들을 친구들에게 인증해 보세요!
            </>
          ) : hasBingo ? (
            <>
              빙고 한 줄을 완성했어요! ({completedCount}/{totalCount})<br />
              남은 칸도 채워 퍼펙트에 도전해 보세요.
            </>
          ) : (
            <>
              아직 완성된 줄이 없어요. ({completedCount}/{totalCount})<br />
              미션을 인증해 첫 빙고를 만들어 보세요!
            </>
          )}
        </p>

      </main>

      {/* Action Buttons at bottom */}
      <div className="px-5 pb-8 flex flex-col gap-3 sticky bottom-0 z-20">
        <Button
          color="primary"
          display="block"
          size="xlarge"
          loading={isShareSuccess}
          onClick={handleShare}
        >
          친구에게 공유하기
        </Button>
      </div>

    </div>
  );
}
