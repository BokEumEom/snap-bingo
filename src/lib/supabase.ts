import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase는 "함께(실시간 공동 빙고판)" 기능에만 필요해요.
// 환경변수가 없으면(솔로 전용 빌드) 클라이언트를 만들지 않고 null을 반환해,
// 공유 기능만 비활성화되고 솔로 앱은 그대로 동작하게 해요.
//
// ⚠️ anon 키만 사용해요(공개용, RLS로 보호). service_role 키는 절대 클라이언트/레포에 넣지 마세요.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url != null && url !== '' && anonKey != null && anonKey !== ''
    ? createClient(url, anonKey, {
        auth: {
          // 익명 세션을 브라우저/웹뷰에 지속시켜 새로고침 후에도 같은 uid를 유지해요.
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
