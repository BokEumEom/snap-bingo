import { useState } from 'react';
import { ArrowLeft, Camera, Check, Lock, UserPlus } from 'lucide-react';
import { useToast, useDialog, Badge, ProgressBar, Post } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { BingoBoard, BingoCell, NavKey, Badge as BadgeItem } from '../types';
import { BADGES } from '../data';
import { shareBoardInvite } from '../lib/share';
import UploadModal from './UploadModal';
import BottomSheet from './BottomSheet';
import BadgeModal from './BadgeModal';
import Emoji from './Emoji';

interface BoardDetailViewProps {
  board: BingoBoard;
  earnedBadgeIds: Set<string>;
  onBack: () => void;
  onCompleteCell: (boardId: string, cellId: number, photoUrl: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onNavigate: (view: NavKey | 'achievement') => void;
}

export default function BoardDetailView({
  board,
  earnedBadgeIds,
  onBack,
  onCompleteCell,
  onDeleteBoard,
  onNavigate
}: BoardDetailViewProps) {
  const { openToast } = useToast();
  const { openConfirm } = useDialog();
  // 사진 인증 시트(커스텀 BottomSheet). uploadCell은 닫힘 애니메이션 동안 유지되도록 open과 분리.
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCell, setUploadCell] = useState<BingoCell | null>(null);

  const handleDelete = async () => {
    const ok = await openConfirm({
      title: '이 빙고 보드를 삭제할까요?',
      description: '보드와 인증한 사진이 모두 사라지고 되돌릴 수 없어요.',
      confirmButton: '삭제',
      cancelButton: '취소',
    });
    if (ok) onDeleteBoard(board.id);
  };

  // 같은 챌린지로 친구를 초대 — 딥링크에 이 보드 설정을 실어 공유해요.
  const handleInvite = () => shareBoardInvite(openToast, board);

  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const completedCount = board.cells.filter(c => c.completed).length;
  const totalCount = board.cells.length;

  // 홈의 "새 챌린지 만들기"와 동일하게 커스텀 BottomSheet를 아래에서 위로 올려 사진 인증을 받아요.
  const openUploadSheet = (cell: BingoCell) => {
    setUploadCell(cell);
    setIsUploadOpen(true);
  };

  const handleCellClick = (cell: BingoCell) => {
    if (cell.completed) {
      openToast(`'${cell.title}'은(는) 이미 인증 완료했어요. (${cell.dateCompleted})`);
    } else {
      openUploadSheet(cell);
    }
  };

  const handleFabClick = () => {
    // Find first incomplete cell
    const firstIncomplete = board.cells.find(c => !c.completed);
    if (firstIncomplete) {
      openUploadSheet(firstIncomplete);
    } else {
      openToast('모든 미션을 완료했어요! 상단의 인증 현황에서 확인해 보세요.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans relative">
      
      {/* TopAppBar */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <button
          onClick={onBack}
          aria-label="뒤로 가기"
          className="justify-self-start w-8 h-8 rounded-full! bg-neutral-50 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight text-center mb-0!">찍고빙고</h1>
        <button
          onClick={() => onNavigate('achievement')}
          className="justify-self-end text-sm font-bold text-blue-600 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full! transition-all active:scale-95"
        >
          인증 현황
        </button>
      </header>

      {/* Main Container */}
      <main className="px-5 pt-5 space-y-6">
        
        {/* Dashboard Header */}
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                {board.eyebrow ?? '여름 챌린지'}
              </p>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">나의 빙고 보드</h2>
            </div>
            <Badge variant="fill" size="small" color="blue">
              {`${completedCount} / ${totalCount} 완료`}
            </Badge>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            progress={completedCount / totalCount}
            size="normal"
            color={adaptive.blue600}
            animate
          />
        </section>

        {/* 같은 챌린지 함께 시작 — 친구를 초대해 각자 자기 폰에서 같은 보드를 채워요 */}
        <button
          onClick={handleInvite}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 active:scale-[0.99] transition-all"
        >
          <UserPlus size={16} />
          이 챌린지에 친구 초대하기
        </button>

        {/* 3x3 Bingo Grid */}
        <section className="grid grid-cols-3 gap-3">
          {board.cells.map((cell) => (
            <div 
              key={cell.id}
              onClick={() => handleCellClick(cell)}
              className="aspect-square rounded-2xl overflow-hidden relative active:scale-[0.96] transition-all cursor-pointer bg-surface group border border-hairline"
            >
              {cell.completed && cell.photoUrl ? (
                <>
                  {/* Completed Cell */}
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${cell.photoUrl}')` }}
                  ></div>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/95 text-blue-600 rounded-full p-1.5 shadow-md flex items-center justify-center animate-pulse">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-[10px] font-bold leading-tight truncate">{cell.title}</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Empty Cell */}
                  <div className="w-full h-full bg-neutral-50/50 border-2 border-dashed border-neutral-200/80 rounded-2xl p-2 flex flex-col items-center justify-center text-center hover:bg-neutral-100/50 transition-colors">
                    <div className="mb-1.5 leading-none" aria-hidden="true">
                      <Emoji emoji={cell.icon} size={24} alt="" />
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500 group-hover:text-neutral-700 leading-tight">{cell.title}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </section>

        {/* 획득 가능한 뱃지 */}
        <section className="space-y-3">
          <h3 className="text-base font-bold text-neutral-900">획득 가능한 뱃지</h3>
          <div className="bg-neutral-100/60 rounded-[24px] p-5 grid grid-cols-3 gap-x-2 gap-y-5">
            {BADGES.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <button
                  key={badge.id}
                  onClick={() =>
                    earned
                      ? setSelectedBadge(badge)
                      : openToast(`'${badge.name}' 뱃지는 아직 잠겨 있어요. 미션을 완료해 보세요!`)
                  }
                  className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <div
                    className={`relative w-16 h-16 rounded-full bg-surface shadow-sm border border-hairline flex items-center justify-center text-3xl ${
                      earned ? '' : 'opacity-40 grayscale'
                    }`}
                  >
                    <Emoji emoji={badge.emoji} size={36} alt={badge.name} />
                    {!earned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={16} className="text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center leading-tight ${
                      earned ? 'text-neutral-800' : 'text-neutral-400'
                    }`}
                  >
                    {badge.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-neutral-100/60 border border-neutral-200/20 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-neutral-800 mb-2.5">어떻게 하나요?</h4>
          <Post.Ol className="instr-post-list">
            <Post.Li className="instr-post-step">
              <span className="w-4 h-4 bg-neutral-200/80 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-neutral-700">1</span>
              <span className="text-[11px] text-neutral-600">미션에 맞는 여름 사진을 촬영하거나 갤러리에서 준비하세요.</span>
            </Post.Li>
            <Post.Li className="instr-post-step">
              <span className="w-4 h-4 bg-neutral-200/80 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-neutral-700">2</span>
              <span className="text-[11px] text-neutral-600">원하는 빈 칸을 눌러 사진을 업로드하고 인증을 완료하세요.</span>
            </Post.Li>
            <Post.Li className="instr-post-step">
              <span className="w-4 h-4 bg-neutral-200/80 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-neutral-700">3</span>
              <span className="text-[11px] text-neutral-600">가로, 세로, 혹은 대각선으로 한 줄을 모두 채우면 빙고가 달성됩니다!</span>
            </Post.Li>
          </Post.Ol>
        </section>

        {/* Delete board */}
        <section className="pt-1">
          <button
            onClick={handleDelete}
            className="w-full text-center text-xs font-semibold text-rose-500 py-3 rounded-2xl! hover:bg-rose-50/60 active:scale-[0.98] transition-all"
          >
            이 보드 삭제하기
          </button>
        </section>

      </main>

      {/* Floating Action Button */}
      <button
        onClick={handleFabClick}
        aria-label="빠른 인증하기"
        className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl! shadow-lg shadow-blue-200 flex items-center justify-center active:scale-95 transition-transform z-30"
        title="빠른 인증하기"
      >
        <Camera size={26} />
      </button>

      {selectedBadge && (
        <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}

      <BottomSheet
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={uploadCell ? `${uploadCell.title} 인증` : undefined}
      >
        {uploadCell && (
          <UploadModal
            cellTitle={uploadCell.title}
            cellIcon={uploadCell.icon}
            cellId={uploadCell.id}
            boardId={board.id}
            onClose={() => setIsUploadOpen(false)}
            onUploadSuccess={(photoUrl) => {
              setIsUploadOpen(false);
              onCompleteCell(board.id, uploadCell.id, photoUrl);
            }}
          />
        )}
      </BottomSheet>

    </div>
  );
}
