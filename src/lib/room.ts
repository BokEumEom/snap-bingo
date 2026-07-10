import { requireSupabase } from './supabase';
import { ensureUid } from './identity';

// 공유(함께) 보드의 Supabase 데이터 계층이에요.
// 1 룸 = 1 공유 보드. 칸(cells)은 (room_id, cell_index) 유니크라 **선착순 1인 소유**예요.

// ── DB 행 타입(스키마 그대로, snake_case) ─────────────────────────────
export interface RoomRow {
  id: string;
  title: string;
  emoji: string;
  template_id: string | null;
  missions: string[] | null;
  created_by: string;
  created_at: string;
}
export interface MemberRow {
  room_id: string;
  uid: string;
  nickname: string;
  joined_at: string;
}
export interface CellRow {
  room_id: string;
  cell_index: number;
  completed_by_uid: string;
  completed_by_nick: string;
  thumb_url: string | null;
  completed_at: string;
}
export interface RoomState {
  room: RoomRow;
  members: MemberRow[];
  cells: CellRow[];
}

export interface CreateRoomInput {
  title: string;
  emoji: string;
  templateId?: string;
  missions?: string[];
}

// 룸 생성 + 생성자를 첫 멤버로 등록. 룸 id를 반환해요.
export async function createRoom(
  input: CreateRoomInput,
  nickname: string,
): Promise<string> {
  const supabase = requireSupabase();
  const uid = await ensureUid();

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      title: input.title,
      emoji: input.emoji,
      template_id: input.templateId ?? null,
      missions: input.missions ?? null,
      created_by: uid,
    })
    .select()
    .single();

  if (error != null || data == null) {
    throw new Error(`룸 생성에 실패했어요: ${error?.message ?? '알 수 없는 오류'}`);
  }

  const room = data as RoomRow;
  await joinRoom(room.id, nickname);
  return room.id;
}

// 룸 참가(멤버 등록). 이미 멤버면 조용히 넘어가요(닉네임은 최초 값 유지).
export async function joinRoom(roomId: string, nickname: string): Promise<void> {
  const supabase = requireSupabase();
  const uid = await ensureUid();

  const { error } = await supabase
    .from('members')
    .upsert(
      { room_id: roomId, uid, nickname },
      { onConflict: 'room_id,uid', ignoreDuplicates: true },
    );

  if (error != null) {
    throw new Error(`룸 참가에 실패했어요: ${error.message}`);
  }
}

// 룸 전체 상태(룸·멤버·칸)를 한 번에 읽어요.
export async function fetchRoomState(roomId: string): Promise<RoomState> {
  const supabase = requireSupabase();

  const [roomRes, membersRes, cellsRes] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', roomId).single(),
    supabase.from('members').select('*').eq('room_id', roomId),
    supabase.from('cells').select('*').eq('room_id', roomId),
  ]);

  if (roomRes.error != null || roomRes.data == null) {
    throw new Error(
      `룸을 불러오지 못했어요: ${roomRes.error?.message ?? '없음'}`,
    );
  }

  return {
    room: roomRes.data as RoomRow,
    members: (membersRes.data ?? []) as MemberRow[],
    cells: (cellsRes.data ?? []) as CellRow[],
  };
}

// 칸 인증(선착순). 이미 남이 채웠으면 claimed=false + 그 사람의 칸을 반환해요.
// 썸네일은 여기서 올리지 않아요 — 이겼을 때만 setCellThumb로 올려 남의 사진을 덮지 않게 해요.
export async function claimCell(
  roomId: string,
  cellIndex: number,
  nickname: string,
): Promise<{ claimed: boolean; cell: CellRow }> {
  const supabase = requireSupabase();
  const uid = await ensureUid();

  const { data, error } = await supabase
    .from('cells')
    .upsert(
      {
        room_id: roomId,
        cell_index: cellIndex,
        completed_by_uid: uid,
        completed_by_nick: nickname,
        thumb_url: null,
      },
      { onConflict: 'room_id,cell_index', ignoreDuplicates: true },
    )
    .select();

  if (error != null) {
    throw new Error(`칸 인증에 실패했어요: ${error.message}`);
  }

  if (data != null && data.length > 0) {
    return { claimed: true, cell: data[0] as CellRow };
  }

  // 0행 = 충돌 = 이미 남이 채운 칸. 기존 칸을 가져와 누가 채웠는지 보여줘요.
  const existing = await fetchCell(roomId, cellIndex);
  if (existing == null) {
    throw new Error('칸 상태를 확인하지 못했어요.');
  }
  return { claimed: false, cell: existing };
}

async function fetchCell(
  roomId: string,
  cellIndex: number,
): Promise<CellRow | null> {
  const supabase = requireSupabase();
  const { data } = await supabase
    .from('cells')
    .select('*')
    .eq('room_id', roomId)
    .eq('cell_index', cellIndex)
    .maybeSingle();
  return (data as CellRow | null) ?? null;
}

// 내가 인증한 칸의 썸네일을 Storage에 올리고, 그 URL을 칸에 기록해요(내 칸만 수정 가능).
export async function uploadThumb(
  roomId: string,
  cellIndex: number,
  thumbDataUrl: string,
): Promise<string> {
  const supabase = requireSupabase();
  const blob = await (await fetch(thumbDataUrl)).blob();
  const path = `${roomId}/${cellIndex}.jpg`;

  const { error } = await supabase.storage
    .from('cell-photos')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error != null) {
    throw new Error(`사진 업로드에 실패했어요: ${error.message}`);
  }

  return supabase.storage.from('cell-photos').getPublicUrl(path).data.publicUrl;
}

export async function setCellThumb(
  roomId: string,
  cellIndex: number,
  thumbUrl: string,
): Promise<void> {
  const supabase = requireSupabase();
  const uid = await ensureUid();
  const { error } = await supabase
    .from('cells')
    .update({ thumb_url: thumbUrl })
    .eq('room_id', roomId)
    .eq('cell_index', cellIndex)
    .eq('completed_by_uid', uid);
  if (error != null) {
    throw new Error(`썸네일 저장에 실패했어요: ${error.message}`);
  }
}

// 룸의 칸·멤버 변경을 실시간 구독해요. 변경이 오면 onChange()가 호출돼요(호출부에서 재조회).
// 구독 해제 함수를 반환해요.
export function subscribeRoom(
  roomId: string,
  onChange: () => void,
): () => void {
  const supabase = requireSupabase();
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cells',
        filter: `room_id=eq.${roomId}`,
      },
      onChange,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `room_id=eq.${roomId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
