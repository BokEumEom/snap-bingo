import { useState } from 'react';
import { ArrowLeft, Camera, Check, Lock, UserPlus, Pencil } from 'lucide-react';
import { useToast, useDialog, Badge, ProgressBar, Post } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { BingoBoard, BingoCell, NavKey, Badge as BadgeItem } from '../types';
import { BADGES } from '../data';
import { shareBoardInvite, shareRoomInvite } from '../lib/share';
import UploadModal from './UploadModal';
import BottomSheet from './BottomSheet';
import BadgeModal from './BadgeModal';
import NicknameEditSheet from './NicknameEditSheet';
import Emoji from './Emoji';

interface BoardDetailViewProps {
  board: BingoBoard;
  earnedBadgeIds: Set<string>;
  onBack: () => void;
  onCompleteCell: (boardId: string, cellId: number, photoUrl: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onNavigate: (view: NavKey | 'achievement') => void;
  // 공유(함께) 보드일 때 참가자 목록. 있으면 멤버 줄과 칸별 인증자 칩을 보여줘요.
  members?: { uid: string; nickname: string }[];
  // 내가 이 함께 보드를 만든 사람(방장)인지. 방장은 '삭제', 참가자는 '나가기'를 봐요.
  isOwner?: boolean;
  // 공유 보드 참가자 전용 — '나가기'(내 목록에서 제거).
  onLeaveBoard?: () => void;
  // 공유 보드 방장 전용 — '삭제'(DB에서 방 전체 제거, 모든 참가자에게서 사라짐).
  onDeleteSharedBoard?: () => void;
  // 함께 보드에서 '나'를 식별해요(내 멤버 칩 편집·내 칸 사진 교체 판정용).
  myUid?: string | null;
  // 함께 보드 — 이 방에서 내 이름(멤버 닉네임)을 바꿔요.
  onEditNickname?: (nickname: string) => void;
  // 내가 인증한 칸의 사진을 교체해요(솔로: 로컬 갱신, 함께: 내 칸만).
  onChangePhoto?: (boardId: string, cellId: number, photoUrl: string) => void;
}

export default function BoardDetailView({
  board,
  earnedBadgeIds,
  onBack,
  onCompleteCell,
  onDeleteBoard,
  onNavigate,
  members = [],
  isOwner = false,
  onLeaveBoard,
  onDeleteSharedBoard,
  myUid,
  onEditNickname,
  onChangePhoto
}: BoardDetailViewProps) {
  const shared = board.shared === true;
  const { openToast } = useToast();
  const { openConfirm } = useDialog();
  // 사진 인증 시트(커스텀 BottomSheet). uploadCell은 닫힘 애니메이션 동안 유지되도록 open과 분리.
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCell, setUploadCell] = useState<BingoCell | null>(null);
  // 업로드 시트가 '새 인증(claim)'인지 '사진 교체(change)'인지 구분해요.
  const [uploadMode, setUploadMode] = useState<'complete' | 'change'>(
    'complete',
  );
  // 함께 방 이름(내 멤버 닉네임) 편집 시트.
  const [isNickOpen, setIsNickOpen] = useState(false);

  const handleDelete = async () => {
    const ok = await openConfirm({
      title: '이 빙고 보드를 삭제할까요?',
      description: '보드와 인증한 사진이 모두 사라지고 되돌릴 수 없어요.',
      confirmButton: '삭제',
      cancelButton: '취소',
    });
    if (ok) onDeleteBoard(board.id);
  };

  // 함께 보드 나가기(참가자) — 방을 삭제하지 않고 내 목록(대시보드)에서만 빼요. 초대 링크로 재참가 가능.
  const handleLeave = async () => {
    const ok = await openConfirm({
      title: '이 함께 보드에서 나갈까요?',
      description: '내 목록에서 사라져요. 초대 링크로 언제든 다시 참가할 수 있어요.',
      confirmButton: '나가기',
      cancelButton: '취소',
    });
    if (ok) onLeaveBoard?.();
  };

  // 함께 보드 삭제(방장) — 방·참가자·인증 사진이 모두에게서 사라지고 되돌릴 수 없어요.
  const handleDeleteShared = async () => {
    const ok = await openConfirm({
      title: '이 함께 챌린지를 삭제할까요?',
      description: '모든 참가자에게서 보드와 인증한 사진이 사라지고 되돌릴 수 없어요.',
      confirmButton: '삭제',
      cancelButton: '취소',
    });
    if (ok) onDeleteSharedBoard?.();
  };

  // 친구 초대 — 공유 보드면 같은 룸에 실시간으로 참가하는 링크, 솔로면 각자 채우는 링크를 공유해요.
  const handleInvite = () =>
    shared ? shareRoomInvite(openToast, board) : shareBoardInvite(openToast, board);

  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const completedCount = board.cells.filter(c => c.completed).length;
  const totalCount = board.cells.length;

  // 홈의 "새 챌린지 만들기"와 동일하게 커스텀 BottomSheet를 아래에서 위로 올려 사진 인증을 받아요.
  const openUploadSheet = (cell: BingoCell, mode: 'complete' | 'change') => {
    setUploadCell(cell);
    setUploadMode(mode);
    setIsUploadOpen(true);
  };

  // 내가 사진을 다룰 수 있는 칸인지 — 빈 칸(새 인증)은 항상, 완료 칸은 '내 칸'만.
  // 솔로 보드의 완료 칸은 모두 내 것이라 교체 가능, 함께 보드는 completedBy가 나일 때만.
  const canEditCell = (cell: BingoCell) => {
    if (!cell.completed) return true;
    if (!shared) return true;
    return myUid != null && cell.completedBy?.uid === myUid;
  };

  const handleCellClick = (cell: BingoCell) => {
    if (!cell.completed) {
      openUploadSheet(cell, 'complete');
      return;
    }
    if (canEditCell(cell)) {
      // 이미 인증한 내 칸 → 사진 교체(솔로/내 함께 칸).
      openUploadSheet(cell, 'change');
      return;
    }
    // 함께 보드에서 남이 이미 채운 칸.
    openToast(
      `이미 ${cell.completedBy?.nickname ?? '다른 분'}님이 인증한 칸이에요.`,
    );
  };

  const handleFabClick = () => {
    // Find first incomplete cell
    const firstIncomplete = board.cells.find(c => !c.completed);
    if (firstIncomplete) {
      openUploadSheet(firstIncomplete, 'complete');
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
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {shared ? '함께 빙고 보드' : '나의 빙고 보드'}
              </h2>
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

        {/* 공유 보드면 참가자 줄을 보여줘요 — 지금 이 한 판을 함께 채우는 사람들이에요. */}
        {shared && members.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-neutral-500">
              함께 {members.length}명
            </span>
            {members.map((m) => {
              const isMe = myUid != null && m.uid === myUid;
              // 내 칩은 눌러서 이 방에서 쓸 이름을 바꿀 수 있어요.
              if (isMe && onEditNickname != null) {
                return (
                  <button
                    key={m.uid}
                    onClick={() => setIsNickOpen(true)}
                    aria-label="내 이름 편집"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold active:scale-95 transition-transform"
                  >
                    {m.nickname}
                    <Pencil size={11} />
                  </button>
                );
              }
              return (
                <span
                  key={m.uid}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold"
                >
                  {m.nickname}
                </span>
              );
            })}
          </div>
        )}

        {/* 친구 초대 — 공유 보드면 같은 룸에 실시간 참가, 솔로면 각자 채우기 링크를 공유해요 */}
        <button
          onClick={handleInvite}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-blue-50 text-blue-600 text-sm font-bold hover:bg-blue-100 active:scale-[0.99] transition-all"
        >
          <UserPlus size={16} />
          {shared ? '함께 채울 친구 초대하기' : '이 챌린지에 친구 초대하기'}
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
                  {/* 공유 보드: 이 칸을 채운 사람 */}
                  {shared && cell.completedBy && (
                    <div className="absolute top-1.5 left-1.5 max-w-[80%] px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[9px] font-bold truncate">
                      {cell.completedBy.nickname}
                    </div>
                  )}
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

        {/* 함께 보드: 방장=삭제(모두에게서 제거), 참가자=나가기(내 목록에서만). 솔로=삭제. */}
        <section className="pt-1">
          {shared && !isOwner ? (
            <button
              onClick={handleLeave}
              className="w-full text-center text-xs font-semibold text-neutral-500 py-3 rounded-2xl! hover:bg-neutral-100/60 active:scale-[0.98] transition-all"
            >
              이 함께 보드에서 나가기
            </button>
          ) : (
            <button
              onClick={shared ? handleDeleteShared : handleDelete}
              className="w-full text-center text-xs font-semibold text-rose-500 py-3 rounded-2xl! hover:bg-rose-50/60 active:scale-[0.98] transition-all"
            >
              {shared ? '이 함께 챌린지 삭제하기' : '이 보드 삭제하기'}
            </button>
          )}
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
        title={
          uploadCell
            ? `${uploadCell.title} ${uploadMode === 'change' ? '사진 바꾸기' : '인증'}`
            : undefined
        }
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
              if (uploadMode === 'change') {
                onChangePhoto?.(board.id, uploadCell.id, photoUrl);
              } else {
                onCompleteCell(board.id, uploadCell.id, photoUrl);
              }
            }}
          />
        )}
      </BottomSheet>

      {/* 함께 방 — 내 이름(멤버 닉네임) 편집 시트 */}
      {onEditNickname != null && (
        <BottomSheet
          open={isNickOpen}
          onClose={() => setIsNickOpen(false)}
          title="이름 바꾸기"
        >
          <NicknameEditSheet
            currentNickname={
              members.find((m) => m.uid === myUid)?.nickname ?? ''
            }
            onSave={(nick) => {
              setIsNickOpen(false);
              onEditNickname(nick);
            }}
            onDismiss={() => setIsNickOpen(false)}
          />
        </BottomSheet>
      )}

    </div>
  );
}
