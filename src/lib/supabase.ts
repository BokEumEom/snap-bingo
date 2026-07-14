import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

// Supabase는 "함께(실시간 공동 빙고판)" 기능에만 필요해요.
// 환경변수가 없으면(솔로 전용 빌드) 클라이언트를 만들지 않고 null을 반환해,
// 공유 기능만 비활성화되고 솔로 앱은 그대로 동작하게 해요.
//
// ⚠️ anon 키만 사용해요(공개용, RLS로 보호). service_role 키는 절대 클라이언트/레포에 넣지 마세요.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 익명 세션(= uid, 함께 보드 소유권)을 저장할 매체예요. supabase-js 기본값은 웹뷰 localStorage인데,
// 이건 토스 앱 캐시 삭제·웹뷰 데이터 초기화·OS eviction에 가장 취약해요. 그래서 보드·닉네임과 같은
// **토스 네이티브 Storage(앱 단위 지속, origin 무관)** 에 세션을 얹어 uid 지속성을 끌어올려요.
// supabase-js v2는 async storage 어댑터를 지원해요(React Native가 AsyncStorage를 같은 방식으로 넘김).
// 브라우저(dev/preview 등 네이티브 브리지 없음)에선 storage.ts가 localStorage로 폴백하므로 기존과 동일해요.
const tossAuthStorage = {
  getItem: (key: string) => getStorageItem(key),
  setItem: (key: string, value: string) => setStorageItem(key, value),
  removeItem: (key: string) => removeStorageItem(key),
};

export const supabase: SupabaseClient | null =
  url != null && url !== '' && anonKey != null && anonKey !== ''
    ? createClient(url, anonKey, {
        auth: {
          // 익명 세션을 토스 Storage에 지속시켜 새로고침·재진입 후에도 같은 uid를 유지해요.
          storage: tossAuthStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

// 공유 기능이 설정되어 있는지(=Supabase env가 주입됐는지) 여부예요.
export const isSharedEnabled = supabase != null;

// 공유 기능 코드에서 클라이언트가 반드시 필요할 때 사용해요.
// env가 없으면 명확한 메시지로 던져, 호출부에서 폴백/안내를 할 수 있게 해요.
export function requireSupabase(): SupabaseClient {
  if (supabase == null) {
    throw new Error(
      '함께(공유 보드) 기능을 쓰려면 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 환경변수가 필요해요.',
    );
  }
  return supabase;
}
