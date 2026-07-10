import { useState, useEffect, useRef } from 'react';
import { useBottomSheet } from '@toss/tds-mobile';
import { ViewState, BingoBoard, BingoCell, CompletionTier } from './types';
import { INITIAL_BOARDS, BOARD_TEMPLATES } from './data';
import { computeEarnedBadgeIds, countBingoLines } from './lib/badges';
import { getStorageItem, setStorageItem } from './lib/storage';
import { parseInvite, Invite } from './lib/invite';
import NewBoardForm from './components/NewBoardForm';
import InviteSheet from './components/InviteSheet';
import DashboardView from './components/DashboardView';
import BoardDetailView from './components/BoardDetailView';
import MissionCompleteView from './components/MissionCompleteView';
import BingoAchievementView from './components/BingoAchievementView';
import GalleryView from './components/GalleryView';
import './App.css';

// v3: cell.icon changed from Lucide icon names to emoji (테마 템플릿 도입) —
// bumping the key discards incompatible v2 data so it re-seeds cleanly.
const STORAGE_KEY = 'photo_bingo_boards_v3';

// 진입 시 딥링크 초대를 1회 복원해요. 프레임워크가 URL 쿼리를 지우기 전에
// index.html 인라인 스크립트가 저장해 둔 원본 쿼리스트링(window.__ENTRY_SEARCH)을 읽어요.
const INITIAL_INVITE: Invite | null = (() => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { __ENTRY_SEARCH?: string };
  const invite = parseInvite(w.__ENTRY_SEARCH ?? '');
  w.__ENTRY_SEARCH = ''; // 한 번만 소비해 새로고침/재마운트 시 재프롬프트를 막아요.
  return invite;
})();

export default function App() {
  const { open: openSheet, close: closeSheet } = useBottomSheet();
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
      setIsLoaded(true);
    })();
  }, []);

  // Persist on every update (fire-and-forget; UI already updated via setBoards)
  const saveBoards = (updatedBoards: BingoBoard[]) => {
    setBoards(updatedBoards);
    void setStorageItem(STORAGE_KEY, JSON.stringify(updatedBoards));
  };

  const handleSelectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    setViewState('board');
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

  const handleCreateNewBoard = () => {
    openSheet({
      header: '새 챌린지 만들기',
      children: (
        <NewBoardForm
          onSubmit={(draft) => {
            if (draft.type === 'custom') {
              createCustomBoard(draft.name, draft.missions);
            } else {
              createBoardFromTemplate(draft.templateId, draft.name);
            }
            closeSheet();
          }}
          onCancel={closeSheet}
        />
      ),
    });
  };

  // '같은 챌린지 함께 시작' — 친구가 공유한 딥링크로 들어오면 같은 보드를 내 폰에 만들지 물어봐요.
  const openInviteSheet = (invite: Invite) => {
    const preview =
      invite.kind === 'template'
        ? (() => {
            const template =
              BOARD_TEMPLATES.find((t) => t.id === invite.templateId) ??
              BOARD_TEMPLATES[0];
            return {
              title: invite.name || template.label,
              emoji: template.emoji,
              missions: template.cells.map((c) => c.title),
            };
          })()
        : {
            title: invite.name || '함께하는 챌린지',
            emoji: '📸',
            missions: invite.missions,
          };

    openSheet({
      header: '함께 하기 초대',
      children: (
        <InviteSheet
          title={preview.title}
          emoji={preview.emoji}
          missions={preview.missions}
          onAccept={() => {
            if (invite.kind === 'template') {
              createBoardFromTemplate(invite.templateId, preview.title);
            } else {
              createCustomBoard(preview.title, invite.missions);
            }
            closeSheet();
          }}
          onDismiss={closeSheet}
        />
      ),
    });
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

  const renderActiveView = () => {
    if (!activeBoard && boards.length > 0) return null;

    switch (viewState) {
      case 'dashboard':
        return (
          <DashboardView
            boards={boards}
            onSelectBoard={handleSelectBoard}
            onCreateNewBoard={handleCreateNewBoard}
            onNavigate={(view) => setViewState(view)}
          />
        );
      case 'board':
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
            boards={boards}
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
            boards={boards}
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
            boards={boards}
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
            boards={boards}
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
    </div>
  );
}
