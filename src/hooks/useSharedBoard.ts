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
  roomStillExists,
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
  // 내가 이 방을 만든 사람(방장)인지. 방장만 방 전체를 삭제할 수 있어요.
  isOwner: boolean;
  // 방장이 방을 삭제했거나 방이 사라져 더는 접근할 수 없을 때 true예요.
  // (실시간 재조회가 "방 없음"으로 실패하면 stale 보드 대신 이 값으로 알려요.)
  deleted: boolean;
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
  const { room, cells, members } = state;
  const byIndex = new Map(cells.map((cell) => [cell.cell_index, cell]));
  // 칸 인증자 이름은 이 방의 members(방·uid별) 기준으로 보여줘요.
  // 기기 전역 닉네임이 바뀌어도 방마다 각자의 이름이 그대로 유지돼요.
  // (멤버가 나가서 members에 없으면 인증 당시 저장된 이름으로 폴백.)
  const nickByUid = new Map(members.map((m) => [m.uid, m.nickname]));

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
        nickname: nickByUid.get(claim.completed_by_uid) ?? claim.completed_by_nick,
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
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (roomId == null) {
      setState(null);
      setDeleted(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | null = null;

    setLoading(true);
    setError(null);
    setDeleted(false);

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
              // 재조회 실패 — 방이 삭제된 건지(방장이 지움) 일시적 오류인지 구분해요.
              // 삭제됐으면 '삭제됨'으로 알려 stale 보드를 남기지 않고, 일시 오류면
              // 무시해요(다음 변경 이벤트에 다시 맞춰져요).
              if (!active) {
                return;
              }
              const exists = await roomStillExists(roomId);
              if (active && exists === false) {
                setDeleted(true);
              }
            }
          })();
        });
      } catch (e) {
        // 초대 후 열기 전에 방이 이미 삭제된 경우도 '삭제됨'으로 처리해요(무한 로딩 방지).
        // 그 외(네트워크 등)면 일반 오류로 둬요.
        if (!active) {
          return;
        }
        const exists = await roomStillExists(roomId);
        if (!active) {
          return;
        }
        if (exists === false) {
          setDeleted(true);
        } else {
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
      // 내 이름은 이 방의 member 행(방·uid별)을 기준으로 해요.
      // 기기 전역 닉네임이 다른 방/역할에서 바뀌어도 이 방의 내 이름은 그대로예요.
      const myNickname =
        state?.members.find((m) => m.uid === myUid)?.nickname ??
        (await getNickname()) ??
        FALLBACK_NICKNAME;
      const cellIndex = cellId - 1;

      const result = await claimCell(roomId, cellIndex, myNickname);
      if (result.claimed) {
        const url = await uploadThumb(roomId, cellIndex, thumbDataUrl);
        await setCellThumb(roomId, cellIndex, url);
      }

      const next = await fetchRoomState(roomId);
      setState(next);
      return { claimed: result.claimed, byNickname: result.cell.completed_by_nick };
    },
    [roomId, state, myUid],
  );

  return {
    board: state != null ? buildBoard(state) : null,
    members:
      state != null
        ? state.members.map((m) => ({ uid: m.uid, nickname: m.nickname }))
        : [],
    myUid,
    isOwner:
      state != null && myUid != null && state.room.created_by === myUid,
    deleted,
    loading,
    error,
    claim,
  };
}
