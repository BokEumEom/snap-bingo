import { BingoBoard } from '../types';
import { isSharedEnabled } from './supabase';
import { getExistingUid } from './identity';
import { fetchAccessibleRoomIds } from './room';

// 대시보드에 저장된 "공유 보드 참조(sharedRefs)"를 현재 신원(uid) 기준으로 정리해요.
//
// 배경(leak A·B): sharedRefs는 기기 전역(uid 무관)으로 localStorage에 저장돼요. 그래서
//   - (B) 익명 uid가 바뀌면(anon wipe·JWT 만료 재발급) 이전 uid의 방이 그대로 보이고,
//   - (A) 삭제된/나간 방도 좀비 카드로 남아요.
// RLS(rooms_select_member_or_creator)는 "현재 uid가 멤버 또는 생성자"인 방만 돌려주므로,
// 저장된 roomId들을 DB로 확인하면 접근 불가·삭제된 방을 한 번에 걸러낼 수 있어요.
//
// 규칙:
//   - 공유 기능 미설정 or 참조 없음 → 그대로 둬요.
//   - 세션(익명 신원)이 없으면 → 어떤 방에도 속할 수 없으니 빈 목록으로 숨겨요.
//     (저장소는 지우지 않아 세션이 돌아오면 다시 검증돼요.)
//   - 세션이 있으면 → DB로 검증해 접근 가능한 방만 남겨요.
//   - 검증이 실패(네트워크 등)하면 → 기존 목록을 그대로 둬요(일시 오류로 카드가 사라지지 않게).
//
// changed=true면 호출부가 정리된 목록을 다시 저장(persist)해요.
export async function scopeSharedRefs(
  refs: BingoBoard[],
): Promise<{ refs: BingoBoard[]; changed: boolean }> {
  if (!isSharedEnabled || refs.length === 0) {
    return { refs, changed: false };
  }

  const uid = await getExistingUid();
  if (uid == null) {
    // 익명 신원이 없으면 접근 가능한 공유 방이 없어요. 숨기되 저장소는 유지해요.
    return { refs: [], changed: false };
  }

  const roomIds = refs
    .map((r) => r.roomId)
    .filter((id): id is string => id != null);

  try {
    const accessible = new Set(await fetchAccessibleRoomIds(roomIds));
    const kept = refs.filter(
      (r) => r.roomId != null && accessible.has(r.roomId),
    );
    return { refs: kept, changed: kept.length !== refs.length };
  } catch {
    // 일시적 확인 실패 — 다음 로드에서 다시 정리돼요.
    return { refs, changed: false };
  }
}
