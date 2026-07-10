import { getAnonymousKey } from '@apps-in-toss/web-framework';

import { requireSupabase } from './supabase';
import { getStorageItem, setStorageItem } from './storage';

// 공유 보드 신원 — 로그인 없이 동작해요.
//  - uid: Supabase 익명 인증(auth.uid())으로 얻는 안정적 식별자. RLS의 기준이에요.
//  - aitHash: AIT 익명 식별키(교차기기 식별용). dev 브라우저/구버전 앱에선 없을 수 있어요.
export interface Identity {
  uid: string;
  aitHash: string | null;
}

/**
 * 공유 기능에 쓸 신원을 보장해요. 기존 익명 세션이 있으면 재사용하고, 없으면 만들어요.
 * Supabase env가 없으면 requireSupabase()가 명확한 메시지로 던져요(공유 기능 미설정).
 */
export async function ensureIdentity(): Promise<Identity> {
  const supabase = requireSupabase();

  const { data: sessionData } = await supabase.auth.getSession();
  let uid = sessionData.session?.user.id ?? null;

  if (uid == null) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error != null || data.user == null) {
      throw new Error(
        `익명 인증에 실패했어요: ${error?.message ?? '알 수 없는 오류'}`,
      );
    }
    uid = data.user.id;
  }

  return { uid, aitHash: await tryGetAitHash() };
}

// AIT 익명 식별키(가능한 경우만). 순수 브라우저(브리지 없음)·구버전 앱에선 null.
async function tryGetAitHash(): Promise<string | null> {
  try {
    const result = await getAnonymousKey();
    if (result != null && result !== 'ERROR' && result.type === 'HASH') {
      return result.hash;
    }
    return null;
  } catch {
    return null;
  }
}

// 닉네임 — 첫 참가 시 UI에서 입력받아 저장해요. 토스 Storage(앱)/localStorage(브라우저) 폴백.
const NICKNAME_KEY = 'snapbingo_nickname';

export async function getNickname(): Promise<string | null> {
  const value = await getStorageItem(NICKNAME_KEY);
  return value != null && value.trim() !== '' ? value : null;
}

export async function setNickname(nickname: string): Promise<void> {
  const trimmed = nickname.trim();
  if (trimmed === '') {
    return;
  }
  await setStorageItem(NICKNAME_KEY, trimmed.slice(0, 12));
}
