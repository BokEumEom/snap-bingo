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
import { createRoom, deleteRoom, leaveRoom, joinRoom } from './lib/room';
import { scopeSharedRefs } from './lib/sharedRefs';
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
    isOwner: sharedIsOwner,
    myUid: sharedMyUid,
    deleted: sharedDeleted,
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
        let parsed: BingoBoard[] = [];
        try {
          parsed = JSON.parse(savedRefs);
        } catch {
          // 손상된 참조는 무시 — 룸을 다시 열면 재생성돼요.
        }
        // 현재 신원(uid) 기준으로 검증해 좀비·남의 uid 방을 걸러내요(leak A·B 정리).
        const scoped = await scopeSharedRefs(parsed);
        setSharedRefs(scoped.refs);
        if (scoped.changed) {
          void setStorageItem(SHARED_REFS_KEY, JSON.stringify(scoped.refs));
        }
      }

      setIsLoaded(true);
    })();
  }, []);

  // 공유 보드를 열면 대시보드 카드용 참조를 저장하고, 라이브 변경 때마다
  // "내가 인증한 사진 칸"을 참조에 동기화해요(갤러리에서 함께 보드 사진도 보이게).
  useEffect(() => {
    // 방이 삭제됐으면 참조를 되살리지 않아요(삭제 처리 이펙트가 참조를 지우는 걸 덮어쓰지 않게).
    if (sharedBoard == null || sharedBoard.roomId == null || sharedDeleted) {
      return;
    }
    const roomId = sharedBoard.roomId;
    // 갤러리는 "나의 여름 조각들"이라 내가 인증한 칸만 담아요(남의 사진은 제외).
    const myCells = sharedBoard.cells.filter(
      (c) =>
        c.completed && c.photoUrl != null && c.completedBy?.uid === sharedMyUid,
    );
    setSharedRefs((prev) => {
      const ref: BingoBoard = {
        id: `room-${roomId}`,
        title: sharedBoard.title,
        emoji: sharedBoard.emoji,
        cells: myCells,
        shared: true,
        roomId,
      };
      const idx = prev.findIndex((r) => r.roomId === roomId);
      if (idx !== -1 && JSON.stringify(prev[idx]) === JSON.stringify(ref)) {
        return prev; // 변화 없음 — 불필요한 저장/리렌더를 피해요.
      }
      const next =
        idx === -1
          ? [ref, ...prev]
          : prev.map((r) => (r.roomId === roomId ? ref : r));
      void setStorageItem(SHARED_REFS_KEY, JSON.stringify(next));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBoard, sharedMyUid, sharedDeleted]);

  // 방장이 함께 방을 삭제하면(또는 방이 사라지면) 참가자 화면에 stale 보드를 남기지 않아요.
  // 안내 토스트를 띄우고, 로컬 참조를 지우고, 대시보드로 돌아가요.
  // (sharedRoomId를 null로 만들면 훅이 deleted를 다시 false로 리셋해요.)
  useEffect(() => {
    if (!sharedDeleted || sharedRoomId == null) {
      return;
    }
    const rid = sharedRoomId;
    openToast('방장이 이 함께 챌린지를 삭제했어요.');
    setSharedRefs((prev) => {
      const next = prev.filter((r) => r.roomId !== rid);
      void setStorageItem(SHARED_REFS_KEY, JSON.stringify(next));
      return next;
    });
    setSharedRoomId(null);
    setViewState('dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedDeleted, sharedRoomId]);

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

  // 공유 보드 칸 인증 — 선착순. 이기면 솔로와 동일하게 등급별 축하 화면을 보여주고,
  // 지면 누가 먼저 채웠는지 토스트로 알려줘요.
  const handleSharedComplete = (
    _boardId: string,
    cellId: number,
    photoUrl: string,
  ) => {
    // 인증 직전 보드(내 클릭 시점 상태)로 등급을 계산해요.
    const beforeBoard = sharedBoard;
    void (async () => {
      try {
        const result = await claim(cellId, photoUrl);
        if (!result.claimed) {
          openToast(`이미 ${result.byNickname}님이 인증한 칸이에요.`);
          return;
        }
        if (beforeBoard == null) {
          return;
        }
        // 이번 인증이 새 빙고 줄/보드 완성을 만들었는지 판정해요(솔로와 동일 로직).
        const updatedCells = beforeBoard.cells.map((cell) =>
          cell.id === cellId ? { ...cell, completed: true, photoUrl } : cell,
        );
        const updatedBoard: BingoBoard = {
          ...beforeBoard,
          cells: updatedCells,
        };
        const wasComplete =
          beforeBoard.cells.length > 0 &&
          beforeBoard.cells.every((c) => c.completed);
        const nowComplete =
          updatedBoard.cells.length > 0 &&
          updatedBoard.cells.every((c) => c.completed);
        const tier: CompletionTier =
          nowComplete && !wasComplete
            ? 'board'
            : countBingoLines(updatedBoard) > countBingoLines(beforeBoard)
              ? 'bingo'
              : 'cell';
        const justCompleted = updatedCells.find((c) => c.id === cellId);
        setCompletedCell({
          cellTitle: justCompleted?.title ?? '',
          photoUrl,
          tier,
        });
        setViewState('complete');
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
    try {
      await setNickname(nick);
      // 참가는 여기서만 명시적으로 이뤄져요(leak C 방지 — '열기'와 '참가'를 분리).
      await joinRoom(pendingRoomId, nick);
    } catch (e) {
      openToast(e instanceof Error ? e.message : '함께 보드에 참가하지 못했어요.');
      return;
    }
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

  // 함께 보드 나가기(참가자) — DB에서 본인 멤버 행을 실제로 제거하고(멤버 수·칩에서 빠짐),
  // 내 로컬 목록에서도 빼고 대시보드로 돌아가요. 초대 링크로 다시 참가할 수 있어요.
  const handleLeaveSharedBoard = async (roomId: string) => {
    try {
      await leaveRoom(roomId);
    } catch (e) {
      openToast(e instanceof Error ? e.message : '함께 보드를 나가지 못했어요.');
      return;
    }
    setSharedRefs((prev) => {
      const next = prev.filter((r) => r.roomId !== roomId);
      void setStorageItem(SHARED_REFS_KEY, JSON.stringify(next));
      return next;
    });
    setSharedRoomId(null);
    setViewState('dashboard');
  };

  // 함께 보드 삭제(방장 전용) — DB에서 방·멤버·칸·사진을 전부 지우고(모든 참가자에게서 사라짐)
  // 내 로컬 목록에서도 제거한 뒤 대시보드로 돌아가요.
  const handleDeleteSharedBoard = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
    } catch (e) {
      openToast(e instanceof Error ? e.message : '함께 보드를 삭제하지 못했어요.');
      return;
    }
    setSharedRefs((prev) => {
      const next = prev.filter((r) => r.roomId !== roomId);
      void setStorageItem(SHARED_REFS_KEY, JSON.stringify(next));
      return next;
    });
    setSharedRoomId(null);
    setViewState('dashboard');
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];
  // 대시보드 목록 = 공유 룸 참조(맨 위) + 로컬(솔로) 보드.
  const allBoards = [...sharedRefs, ...boards];
  // 뱃지는 솔로 보드 + 지금 열려 있는 함께 보드에서 "내가 인증한 칸"을 반영해요.
  // (갤러리와 동일하게 개인 기여 기준 — 남이 채운 칸은 내 뱃지에 포함하지 않아요.
  //  그리드 위치는 유지해 내가 한 줄을 직접 완성하면 빙고 뱃지도 정상 판정돼요.)
  const myShareBoard =
    sharedBoard != null
      ? {
          ...sharedBoard,
          cells: sharedBoard.cells.map((c) =>
            c.completedBy?.uid === sharedMyUid ? c : { ...c, completed: false },
          ),
        }
      : null;
  const earnedBadgeIds = computeEarnedBadgeIds(
    myShareBoard != null ? [...boards, myShareBoard] : boards,
  );

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
          const rid = sharedRoomId;
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
              isOwner={sharedIsOwner}
              earnedBadgeIds={earnedBadgeIds}
              onBack={() => {
                setSharedRoomId(null);
                setViewState('dashboard');
              }}
              onCompleteCell={handleSharedComplete}
              onDeleteBoard={() => {}}
              onLeaveBoard={() => handleLeaveSharedBoard(rid)}
              onDeleteSharedBoard={() => handleDeleteSharedBoard(rid)}
              onNavigate={(view) => setViewState(view)}
            />
          );
        }
        return activeBoard ? (
          <BoardDetailView
            board={activeBoard}
            earnedBadgeIds={earnedBadgeIds}
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
      case 'achievement': {
        // 인증 현황(기념 카드)은 공유(함께) 보드와 솔로 보드 모두 지원해요.
        // 공유 보드를 보는 중이면 그 보드를 쓰고(솔로 activeBoard가 없어 홈으로
        // 튕기던 버그 수정), 아니면 솔로 activeBoard를 써요.
        const achievementBoard =
          sharedRoomId != null ? sharedBoard : activeBoard;
        return achievementBoard ? (
          <BingoAchievementView
            board={achievementBoard}
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
      }
      case 'gallery':
        return (
          <GalleryView
            boards={allBoards}
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
