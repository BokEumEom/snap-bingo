import { BingoBoard } from '../types';

// '같은 챌린지 함께 시작' 초대 — 보드 설정을 딥링크 쿼리 파라미터로 실어 보내고,
// 받은 사람의 앱이 그걸 읽어 자기 폰에 같은 보드를 만들어요. 서버 없이 링크 하나로 동작해요.
// 솔로(각자 채우기) 초대 — 받은 사람이 자기 폰에 같은 보드를 만들어요.
export type Invite =
  | { kind: 'template'; templateId: string; name: string }
  | { kind: 'custom'; missions: string[]; name: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 공유(함께) 보드 초대를 쿼리스트링으로 인코딩해요. room=<룸 uuid> 하나만 실어요.
export function encodeRoomInviteParams(roomId: string): string {
  const params = new URLSearchParams();
  params.set('room', roomId);
  return params.toString();
}

// 진입 URL에서 공유 보드 초대(room=<uuid>)를 감지해 룸 id를 돌려줘요. 없거나 형식이 어긋나면 null.
// 솔로 초대(parseInvite)와 분리돼 있어, 공유 초대가 우선하는지는 호출부(App)에서 결정해요.
export function parseRoomId(search: string): string | null {
  try {
    const roomId = new URLSearchParams(search).get('room');
    return roomId != null && UUID_RE.test(roomId) ? roomId : null;
  } catch {
    return null;
  }
}

// 보드를 초대 파라미터(쿼리스트링)로 인코딩해요.
// - 템플릿 보드: t=<templateId> 로 원본을 온전히 재현(칸 이모지·부제까지)
// - 커스텀 보드: m=<JSON 미션배열> 로 미션 문구를 그대로 전달
export function encodeInviteParams(board: BingoBoard): string {
  const params = new URLSearchParams();
  params.set('n', board.title);
  if (board.templateId) {
    params.set('t', board.templateId);
  } else {
    params.set('m', JSON.stringify(board.cells.map((c) => c.title)));
  }
  return params.toString();
}

// 앱 진입 URL의 쿼리스트링에서 초대 정보를 복원해요. 초대가 없거나 형식이 어긋나면 null.
export function parseInvite(search: string): Invite | null {
  try {
    const params = new URLSearchParams(search);
    const name = (params.get('n') ?? '').trim();

    const templateId = params.get('t');
    if (templateId) {
      return { kind: 'template', templateId, name };
    }

    const rawMissions = params.get('m');
    if (rawMissions != null) {
      const missions = JSON.parse(rawMissions);
      if (
        Array.isArray(missions) &&
        missions.length > 0 &&
        missions.every((m) => typeof m === 'string')
      ) {
        return { kind: 'custom', missions, name };
      }
    }

    return null;
  } catch {
    return null;
  }
}
