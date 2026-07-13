import { supabase, requireSupabase } from './supabase';
import { getStorageItem, setStorageItem } from './storage';

// 공유 보드 신원 — 로그인 없이 동작해요.
// Supabase 익명 인증(auth.uid())으로 안정적 uid를 확보하고, 이 uid가 RLS의 기준이에요.
// 익명 세션은 브라우저/웹뷰에 지속되어 새로고침 후에도 같은 uid를 유지해요.

/**
 * 공유 기능에 쓸 uid를 보장해요. 기존 익명 세션이 있으면 재사용하고, 없으면 만들어요.
 * Supabase env가 없으면 requireSupabase()가 명확한 메시지로 던져요(공유 기능 미설정).
 */
export async function ensureUid(): Promise<string> {
  const supabase = requireSupabase();

  const { data: sessionData } = await supabase.auth.getSession();
  const existing = sessionData.session?.user.id;
  if (existing != null) {
    return existing;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error != null || data.user == null) {
    throw new Error(
      `익명 인증에 실패했어요: ${error?.message ?? '알 수 없는 오류'}`,
    );
  }
  return data.user.id;
}

/**
 * "이미 있는" 익명 세션의 uid만 반환해요(없으면 null). 새 세션을 만들지 않아요.
 * 앱 시작 시 공유 보드 목록을 현재 신원 기준으로 걸러낼 때 써요 —
 * ensureUid()와 달리 익명 가입을 유발하지 않아, 함께 기능을 안 쓴 사용자에게 불필요한 가입/네트워크가 없어요.
 */
export async function getExistingUid(): Promise<string | null> {
  if (supabase == null) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// 닉네임 — 첫 참가 시 UI에서 입력받아 저장해요. 토스 Storage(앱)/localStorage(브라우저) 폴백.
const NICKNAME_KEY = 'snapbingo_nickname';

export async function getNickname(): Promise<string | null> {
  const value = await getStorageItem(NICKNAME_KEY);
  return value != null && value.trim() !== '' ? value : null;
}

export async function setNickname(nickname: string): Promise<string | null> {
  const trimmed = nickname.trim().slice(0, 12);
  if (trimmed === '') {
    return null;
  }
  await setStorageItem(NICKNAME_KEY, trimmed);
  return trimmed;
}
