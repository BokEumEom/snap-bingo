import { useState, useEffect, useRef } from 'react';
import { useToast } from '@toss/tds-mobile';
import {
  ViewState,
  BingoBoard,
  BingoCell,
  CompletionTier,
  NewBoardDraft,
} from './types';
import { INITIAL_BOARDS, BOARD_TEMPLATES } from './data';
import { computeEarnedBadgeIds, countBingoLines } from './lib/badges';
import { getStorageItem, setStorageItem } from './lib/storage';
import { parseInvite, parseRoomId, Invite } from './lib/invite';
import { createRoom } from './lib/room';
import { setNickname } from './lib/identity';
import { useSharedBoard } from './hooks/useSharedBoard';
import NewBoardForm from './components/NewBoardForm';
import InviteSheet from './components/InviteSheet';
import RoomJoinSheet from './components/RoomJoinSheet';
import BottomSheet from './components/BottomSheet';
import DashboardView from './components/DashboardView';
import BoardDetailView from './components/BoardDetailView';
import MissionCompleteView from './components/MissionCompleteView';
import BingoAchievementView from './components/BingoAchievementView';
import GalleryView from './components/GalleryView';
import './App.css';

// v3: cell.icon changed from Lucide icon names to emoji (테마 템플릿 도입) —
// bumping the key discards incompatible v2 data so it re-seeds cleanly.
const STORAGE_KEY = 'photo_bingo_boards_v3';
// 참가/생성한 공유(함께) 룸의 가벼운 참조(대시보드 카드용). 라이브 상태는 룸에서 실시간으로 받아요.
const SHARED_REFS_KEY = 'photo_bingo_shared_refs_v1';

// 진입 시 딥링크를 1회 캡처해요. 프레임워크가 URL 쿼리를 지우기 전에 index.html 인라인
// 스크립트가 저장해 둔 원본 쿼리스트링(window.__ENTRY_SEARCH)을 읽어요.
// 공유(room=) 초대가 최우선이고, 없으면 솔로 초대(t/m)를 읽어요.
const ENTRY: { roomId: string | null; invite: Invite | null } = (() => {
  if (typeof window === 'undefined') {
    return { roomId: null, invite: null };
  }
  const w = window as unknown as { __ENTRY_SEARCH?: string };
  const search = w.__ENTRY_SEARCH ?? '';
  w.__ENTRY_SEARCH = ''; // 한 번만 소비해 새로고침/재마운트 시 재프롬프트를 막아요.
  const roomId = parseRoomId(search);
  return { roomId, invite: roomId != null ? null : parseInvite(search) };
})();
const INITIAL_ROOM_ID = ENTRY.roomId;
const INITIAL_INVITE = ENTRY.invite;

export default function App() {
  // 커스텀 BottomSheet(바닥 연결 슬라이드업)로 여는 시트들의 열림/데이터 상태.
  // 데이터(pendingInvite)는 닫힘 애니메이션 동안 유지되도록 open 플래그와 분리해요.
  const [isNewBoardOpen, setIsNewBoardOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<Invite | null>(null);
  const [boards, setBoards] = useState<BingoBoard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // 첫 보드 생성/선택 전까지의 플레이스홀더. 어떤 보드 id와도 매칭되지 않아
  // activeBoard는 boards[0](없으면 undefined)로 폴백돼요.
  const [activeBoardId, setActiveBoardId] = useState<string>('');
  const [viewState, setViewState] = useState<ViewState>('dashboard');
  const [completedCell, setCompletedCell] = useState<{
    cellTitle: string;
    photoUrl: string;
    tier: CompletionTier;
  } | null>(null);

  // 공유(함께) 보드 상태. sharedRoomId가 있으면 그 룸을 실시간 구독해요.
  const { openToast } = useToast();
  const [sharedRoomId, setSharedRoomId] = useState<string | null>(null);
  const [sharedRefs, setSharedRefs] = useState<BingoBoard[]>([]);
  const [isRoomJoinOpen, setIsRoomJoinOpen] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const {
    board: sharedBoard,
    members: sharedMembers,
    claim,
  } = useSharedBoard(sharedRoomId);

  // Load persisted boards (Toss Storage in-app, localStorage fallback in browser)
  useEffect(() => {
    (async () => {
      const saved = await getStorageItem(STORAGE_KEY);
      if (saved) {
        try {
          setBoards(JSON.parse(saved));
        } catch {
          setBoards(INITIAL_BOARDS);
        }
      } else {
        setBoards(INITIAL_BOARDS);
      }

      const savedRefs = await getStorageItem(SHARED_REFS_KEY);
      if (savedRefs) {
        try {
          setSharedRefs(JSON.parse(savedRefs));
        } catch {
          // 손상된 참조는 무시 — 룸을 다시 열면 재생성돼요.
        }
      }

      setIsLoaded(true);
    })();
  }, []);

  // 공유 보드를 열어 로드되면(생성/참가 둘 다) 대시보드 카드용 참조를 한 번 저장해요.
  useEffect(() => {
    if (sharedBoard == null || sharedBoard.roomId == null) {
      return;
    }
    const roomId = sharedBoard.roomId;
    const title = sharedBoard.title;
    const emoji = sharedBoard.emoji;
    setSharedRefs((prev) => {
      if (prev.some((r) => r.roomId === roomId)) {
        return prev;
      }
      const ref: BingoBoard = {
        id: `room-${roomId}`,
        title,
        emoji,
        cells: [],
        shared: true,
        roomId,
      };
      const next = [ref, ...prev];
      void setStorageItem(SHARED_REFS_KEY, JSON.stringify(next));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBoard?.roomId]);

  // Persist on every update (fire-and-forget; UI already updated via setBoards)
  const saveBoards = (updatedBoards: BingoBoard[]) => {
    setBoards(updatedBoards);
    void setStorageItem(STORAGE_KEY, JSON.stringify(updatedBoards));
  };

  const handleSelectBoard = (boardId: string) => {
    // 공유 보드 카드(id가 'room-<uuid>')면 그 룸을 실시간으로 열어요.
    if (boardId.startsWith('room-')) {
      setSharedRoomId(boardId.slice('room-'.length));
      setViewState('board');
      return;
    }
    setSharedRoomId(null);
    setActiveBoardId(boardId);
    setViewState('board');
  };

  // 공유 보드 칸 인증 — 선착순. 지면 누가 채웠는지 토스트로 알려줘요.
  const handleSharedComplete = (
    _boardId: string,
    cellId: number,
    photoUrl: string,
  ) => {
    void (async () => {
      try {
        const result = await claim(cellId, photoUrl);
        if (!result.claimed) {
          openToast(`이미 ${result.byNickname}님이 인증한 칸이에요.`);
        }
      } catch {
        openToast('인증에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    })();
  };

  const handleCompleteCell = (
    boardId: string,
    cellId: number,
    photoUrl: string,
  ) => {
    const targetBoard = boards.find((b) => b.id === boardId);
    if (!targetBoard) return;

    const updatedCells = targetBoard.cells.map((cell) =>
      cell.id === cellId
        ? {
            ...cell,
            completed: true,
            photoUrl,
            dateCompleted: new Date().toISOString().split('T')[0],
          }
        : cell,
    );
    const updatedBoard: BingoBoard = { ...targetBoard, cells: updatedCells };
    const updated = boards.map((b) => (b.id === boardId ? updatedBoard : b));

    saveBoards(updated);

    // 이번 인증이 "새 빙고 줄" 또는 "보드 전면 완성"을 만들었는지 판정해요.
    // 보드 완성이 최상위, 그다음 새 빙고 줄, 아니면 일반 칸 완료예요.
    const beforeLines = countBingoLines(targetBoard);
    const afterLines = countBingoLines(updatedBoard);
    const wasComplete =
      targetBoard.cells.length > 0 &&
      targetBoard.cells.every((c) => c.completed);
    const nowComplete =
      updatedBoard.cells.length > 0 &&
      updatedBoard.cells.every((c) => c.completed);

    const tier: CompletionTier =
      nowComplete && !wasComplete
        ? 'board'
        : afterLines > beforeLines
          ? 'bingo'
          : 'cell';

    const justCompleted = updatedCells.find((c) => c.id === cellId);
    if (justCompleted) {
      setCompletedCell({ cellTitle: justCompleted.title, photoUrl, tier });
      setViewState('complete');
    }
  };

  const handleConfirmCompletion = () => {
    setCompletedCell(null);
    setViewState('board');
  };

  // 빙고 줄/보드 완성 축하에서 바로 기념 카드(인증 현황)로 이동해요.
  const handleViewCard = () => {
    setCompletedCell(null);
    setViewState('achievement');
  };

  const createBoardFromTemplate = (templateId: string, name: string) => {
    const template =
      BOARD_TEMPLATES.find((t) => t.id === templateId) ?? BOARD_TEMPLATES[0];
    const newBoard: BingoBoard = {
      id: `custom-${Date.now()}`,
      title: name,
      emoji: template.emoji,
      eyebrow: template.eyebrow,
      templateId: template.id,
      cells: template.cells.map((cell, index) => ({
        id: index + 1,
        title: cell.title,
        icon: cell.icon,
        completed: false,
      })),
    };

    const updated = [newBoard, ...boards];
    saveBoards(updated);
    setActiveBoardId(newBoard.id);
    setViewState('board');
  };

  // 템플릿 없이 사용자가 직접 입력한 미션으로 보드를 만들어요.
  // 빈 칸은 '미션 N'으로 채우고, 칸 아이콘은 중립적인 📸를 써요.
  const createCustomBoard = (name: string, missions: string[]) => {
    const cells: BingoCell[] = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      title: (missions[i] ?? '').trim() || `미션 ${i + 1}`,
      icon: '📸',
      completed: false,
    }));

    const newBoard: BingoBoard = {
      id: `custom-${Date.now()}`,
      title: name,
      emoji: '📸',
      eyebrow: '나만의 챌린지',
      cells,
    };

    const updated = [newBoard, ...boards];
    saveBoards(updated);
    setActiveBoardId(newBoard.id);
    setViewState('board');
  };

  const handleCreateNewBoard = () => setIsNewBoardOpen(true);

  // '함께' 룸을 만들고 바로 공유 보드를 열어요.
  const createSharedRoom = async (draft: NewBoardDraft) => {
    const nickname = (draft.nickname ?? '').trim() || '익명';
    try {
      await setNickname(nickname);
      const input =
        draft.type === 'custom'
          ? { title: draft.name, emoji: '📸', missions: draft.missions }
          : {
              title: draft.name,
              emoji: (
                BOARD_TEMPLATES.find((t) => t.id === draft.templateId) ??
                BOARD_TEMPLATES[0]
              ).emoji,
              templateId: draft.templateId,
            };
      const roomId = await createRoom(input, nickname);
      setSharedRoomId(roomId);
      setViewState('board');
    } catch (e) {
      openToast(e instanceof Error ? e.message : '함께 보드를 만들지 못했어요.');
    }
  };

  // 새 보드 생성 — 함께면 룸 생성, 혼자면 로컬 보드 생성으로 분기해요.
  const handleSubmitNewBoard = async (draft: NewBoardDraft) => {
    setIsNewBoardOpen(false);
    if (draft.shared === true) {
      await createSharedRoom(draft);
      return;
    }
    if (draft.type === 'custom') {
      createCustomBoard(draft.name, draft.missions);
    } else {
      createBoardFromTemplate(draft.templateId, draft.name);
    }
  };

  // 룸 초대(room=) 링크로 들어와 참가 — 닉네임을 저장하고 공유 보드를 열어요(훅이 참가 처리).
  const handleJoinRoom = async (nickname: string) => {
    if (pendingRoomId == null) {
      return;
    }
    const nick = nickname.trim() || '익명';
    await setNickname(nick);
    setIsRoomJoinOpen(false);
    setSharedRoomId(pendingRoomId);
    setViewState('board');
  };

  // '같은 챌린지 함께 시작' — 친구가 공유한 딥링크로 들어오면 같은 보드를 내 폰에 만들지 물어봐요.
  const openInviteSheet = (invite: Invite) => {
    setPendingInvite(invite);
    setIsInviteOpen(true);
  };

  // 초대 시트에 보여줄 미리보기(제목·이모지·미션). 닫힘 애니메이션 동안에도 pendingInvite를
  // 유지하므로 시트가 내려가는 중에도 내용이 사라지지 않아요.
  const invitePreview =
    pendingInvite == null
      ? null
      : pendingInvite.kind === 'template'
        ? (() => {
            const template =
              BOARD_TEMPLATES.find((t) => t.id === pendingInvite.templateId) ??
              BOARD_TEMPLATES[0];
            return {
              title: pendingInvite.name || template.label,
              emoji: template.emoji,
              missions: template.cells.map((c) => c.title),
            };
          })()
        : {
            title: pendingInvite.name || '함께하는 챌린지',
            emoji: '📸',
            missions: pendingInvite.missions,
          };

  const handleAcceptInvite = () => {
    if (pendingInvite == null || invitePreview == null) {
      return;
    }
    if (pendingInvite.kind === 'template') {
      createBoardFromTemplate(pendingInvite.templateId, invitePreview.title);
    } else {
      createCustomBoard(invitePreview.title, pendingInvite.missions);
    }
    setIsInviteOpen(false);
  };

  // 보드 로드 후, 진입 딥링크에 초대가 있으면 시트를 한 번만 띄워요.
  // 참고: 실제 토스 딥링크의 파라미터 전달 방식은 실기기/콘솔 등록 후 확정이 필요해요.
  const invitePromptedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || INITIAL_INVITE == null || invitePromptedRef.current) {
      return;
    }
    invitePromptedRef.current = true;
    openInviteSheet(INITIAL_INVITE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // 진입 딥링크에 공유 룸 초대(room=)가 있으면 참가 시트를 한 번만 띄워요.
  const roomPromptedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || INITIAL_ROOM_ID == null || roomPromptedRef.current) {
      return;
    }
    roomPromptedRef.current = true;
    setPendingRoomId(INITIAL_ROOM_ID);
    setIsRoomJoinOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleClearGallery = () => {
    saveBoards(INITIAL_BOARDS);
    setViewState('dashboard');
  };

  const handleDeleteBoard = (boardId: string) => {
    const remaining = boards.filter((b) => b.id !== boardId);
    saveBoards(remaining);
    if (boardId === activeBoardId && remaining.length > 0) {
      setActiveBoardId(remaining[0].id);
    }
    setViewState('dashboard');
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];
  // 대시보드 목록 = 공유 룸 참조(맨 위) + 로컬(솔로) 보드.
  const allBoards = [...sharedRefs, ...boards];

  const renderActiveView = () => {
    if (!activeBoard && boards.length > 0) return null;

    switch (viewState) {
      case 'dashboard':
        return (
          <DashboardView
            boards={allBoards}
            onSelectBoard={handleSelectBoard}
            onCreateNewBoard={handleCreateNewBoard}
            onNavigate={(view) => setViewState(view)}
          />
        );
      case 'board':
        if (sharedRoomId != null) {
          if (sharedBoard == null) {
            return (
              <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <div className="animate-spin text-blue-600 font-bold">
                  함께 보드 여는 중...
                </div>
              </div>
            );
          }
          return (
            <BoardDetailView
              board={sharedBoard}
              members={sharedMembers}
              earnedBadgeIds={computeEarnedBadgeIds(boards)}
              onBack={() => {
                setSharedRoomId(null);
                setViewState('dashboard');
              }}
              onCompleteCell={handleSharedComplete}
              onDeleteBoard={() => {}}
              onNavigate={(view) => setViewState(view)}
            />
          );
        }
        return activeBoard ? (
          <BoardDetailView
            board={activeBoard}
            earnedBadgeIds={computeEarnedBadgeIds(boards)}
            onBack={() => setViewState('dashboard')}
            onCompleteCell={handleCompleteCell}
            onDeleteBoard={handleDeleteBoard}
            onNavigate={(view) => setViewState(view)}
          />
        ) : (
          <DashboardView
            boards={allBoards}
            onSelectBoard={handleSelectBoard}
            onCreateNewBoard={handleCreateNewBoard}
            onNavigate={(view) => setViewState(view)}
          />
        );
      case 'complete':
        return completedCell ? (
          <MissionCompleteView
            cellTitle={completedCell.cellTitle}
            photoUrl={completedCell.photoUrl}
            tier={completedCell.tier}
            onConfirm={handleConfirmCompletion}
            onViewCard={handleViewCard}
          />
        ) : (
          <DashboardView
            boards={allBoards}
            onSelectBoard={handleSelectBoard}
            onCreateNewBoard={handleCreateNewBoard}
            onNavigate={(view) => setViewState(view)}
          />
        );
      case 'achievement':
        return activeBoard ? (
          <BingoAchievementView
            board={activeBoard}
            onBack={() => setViewState('board')}
            onClose={() => setViewState('board')}
          />
        ) : (
          <DashboardView
            boards={allBoards}
            onSelectBoard={handleSelectBoard}
            onCreateNewBoard={handleCreateNewBoard}
            onNavigate={(view) => setViewState(view)}
          />
        );
      case 'gallery':
        return (
          <GalleryView
            boards={boards}
            onNavigate={(view) => setViewState(view)}
            onClearGallery={handleClearGallery}
          />
        );
      default:
        return (
          <DashboardView
            boards={allBoards}
            onSelectBoard={handleSelectBoard}
            onCreateNewBoard={handleCreateNewBoard}
            onNavigate={(view) => setViewState(view)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-page font-sans">
      {isLoaded ? (
        renderActiveView()
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
          <div className="animate-spin text-blue-600 font-bold">로딩 중...</div>
        </div>
      )}

      <BottomSheet
        open={isNewBoardOpen}
        onClose={() => setIsNewBoardOpen(false)}
        title="새 챌린지 만들기"
      >
        <NewBoardForm
          onSubmit={(draft) => {
            void handleSubmitNewBoard(draft);
          }}
          onCancel={() => setIsNewBoardOpen(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="함께 하기 초대"
      >
        {invitePreview && (
          <InviteSheet
            title={invitePreview.title}
            emoji={invitePreview.emoji}
            missions={invitePreview.missions}
            onAccept={handleAcceptInvite}
            onDismiss={() => setIsInviteOpen(false)}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={isRoomJoinOpen}
        onClose={() => setIsRoomJoinOpen(false)}
        title="함께 하기 초대"
      >
        <RoomJoinSheet
          onJoin={(nick) => {
            void handleJoinRoom(nick);
          }}
          onDismiss={() => setIsRoomJoinOpen(false)}
        />
      </BottomSheet>
    </div>
  );
}
