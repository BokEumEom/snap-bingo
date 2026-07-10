import { useState, useEffect, useCallback } from 'react';

import { BingoBoard, BingoCell } from '../types';
import { BOARD_TEMPLATES } from '../data';
import { ensureUid, getNickname } from '../lib/identity';
import {
  fetchRoomState,
  joinRoom,
  claimCell,
  uploadThumb,
  setCellThumb,
  subscribeRoom,
  type RoomState,
  type RoomRow,
} from '../lib/room';

export interface SharedMember {
  uid: string;
  nickname: string;
}

export interface SharedBoardState {
  board: BingoBoard | null;
  members: SharedMember[];
  myUid: string | null;
  loading: boolean;
  error: string | null;
  // 칸 인증(선착순). 이겼으면 썸네일까지 올려요. 반환값으로 승패·누가 채웠는지 알려줘요.
  claim: (
    cellId: number,
    thumbDataUrl: string,
  ) => Promise<{ claimed: boolean; byNickname: string }>;
}

const FALLBACK_NICKNAME = '익명';

// 룸의 템플릿/미션으로 9칸의 기본(제목·아이콘)을 만들어요.
function roomBaseCells(room: RoomRow): BingoCell[] {
  if (room.template_id != null) {
    const template =
      BOARD_TEMPLATES.find((t) => t.id === room.template_id) ??
      BOARD_TEMPLATES[0];
    return template.cells.map((cell, i) => ({
      id: i + 1,
      title: cell.title,
      icon: cell.icon,
      completed: false,
    }));
  }

  const missions = room.missions ?? [];
  return Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    title: (missions[i] ?? '').trim() || `미션 ${i + 1}`,
    icon: '📸',
    completed: false,
  }));
}

// 룸 상태(룸+칸)를 앱의 BingoBoard 모양으로 합쳐요.
function buildBoard(state: RoomState): BingoBoard {
  const { room, cells } = state;
  const byIndex = new Map(cells.map((cell) => [cell.cell_index, cell]));

  const merged: BingoCell[] = roomBaseCells(room).map((base, index) => {
    const claim = byIndex.get(index);
    if (claim == null) {
      return base;
    }
    return {
      ...base,
      completed: true,
      photoUrl: claim.thumb_url ?? undefined,
      dateCompleted: claim.completed_at.split('T')[0],
      completedBy: {
        uid: claim.completed_by_uid,
        nickname: claim.completed_by_nick,
      },
    };
  });

  return {
    id: `room-${room.id}`,
    title: room.title,
    emoji: room.emoji,
    eyebrow: '함께하는 챌린지',
    templateId: room.template_id ?? undefined,
    roomId: room.id,
    shared: true,
    cells: merged,
  };
}

/**
 * 공유(함께) 보드 훅. roomId가 있으면 참가 후 실시간 구독하고, 라이브 보드/멤버를 반환해요.
 * roomId가 null이면 아무것도 하지 않아요(솔로 화면).
 */
export function useSharedBoard(roomId: string | null): SharedBoardState {
  const [state, setState] = useState<RoomState | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roomId == null) {
      setState(null);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | null = null;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const uid = await ensureUid();
        const nickname = (await getNickname()) ?? FALLBACK_NICKNAME;
        await joinRoom(roomId, nickname);
        const fresh = await fetchRoomState(roomId);
        if (!active) {
          return;
        }
        setMyUid(uid);
        setState(fresh);

        unsubscribe = subscribeRoom(roomId, () => {
          void (async () => {
            try {
              const next = await fetchRoomState(roomId);
              if (active) {
                setState(next);
              }
            } catch {
              // 일시적 재조회 실패는 무시해요 — 다음 변경 이벤트에 다시 맞춰져요.
            }
          })();
        });
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : '알 수 없는 오류예요.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      if (unsubscribe != null) {
        unsubscribe();
      }
    };
  }, [roomId]);

  const claim = useCallback(
    async (cellId: number, thumbDataUrl: string) => {
      if (roomId == null) {
        throw new Error('참가 중인 룸이 없어요.');
      }
      const nickname = (await getNickname()) ?? FALLBACK_NICKNAME;
      const cellIndex = cellId - 1;

      const result = await claimCell(roomId, cellIndex, nickname);
      if (result.claimed) {
        const url = await uploadThumb(roomId, cellIndex, thumbDataUrl);
        await setCellThumb(roomId, cellIndex, url);
      }

      const next = await fetchRoomState(roomId);
      setState(next);
      return { claimed: result.claimed, byNickname: result.cell.completed_by_nick };
    },
    [roomId],
  );

  return {
    board: state != null ? buildBoard(state) : null,
    members:
      state != null
        ? state.members.map((m) => ({ uid: m.uid, nickname: m.nickname }))
        : [],
    myUid,
    loading,
    error,
    claim,
  };
}
