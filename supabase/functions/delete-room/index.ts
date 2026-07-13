// 함께(공유) 방을 "확실하게" 삭제하는 Edge Function이에요.
//
// 왜 Edge Function인가:
//   클라이언트 deleteRoom은 Storage 정리를 베스트에포트(try/catch로 에러 무시)로 하던 터라,
//   실패하면 방은 지워지되 썸네일만 orphan으로 남고 아무도 그 사실을 몰랐어요.
//   또한 Postgres 트리거로는 Storage 객체를 못 지워요(protect_delete 트리거가 storage.objects
//   직접 DELETE를 막음 — Storage API로만 삭제 가능). 그래서 service_role로 Storage API를 호출하는
//   서버 측 함수에서 "썸네일 삭제 → 방 삭제(cascade)"를 한 번에 처리해 신뢰도를 높였어요.
//
// 보안:
//   service_role 키는 RLS를 우회하므로, 삭제 전에 반드시 호출자가 방장(created_by)인지 검증해요.
//   키는 Edge 런타임이 주입하는 SUPABASE_SERVICE_ROLE_KEY 환경변수에서만 읽고, 응답에 절대 노출하지 않아요.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  // 브라우저/웹뷰 프리플라이트 처리.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'POST만 허용돼요.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (supabaseUrl == null || serviceRoleKey == null || anonKey == null) {
    return json({ error: '서버 설정이 올바르지 않아요.' }, 500);
  }

  // 1) 입력 파싱.
  let roomId: string | null = null;
  try {
    const body = (await req.json()) as { roomId?: unknown };
    roomId = typeof body.roomId === 'string' ? body.roomId : null;
  } catch {
    return json({ error: '요청 형식이 올바르지 않아요.' }, 400);
  }
  if (roomId == null || roomId === '') {
    return json({ error: 'roomId가 필요해요.' }, 400);
  }

  // 2) 호출자 신원 확인 — 사용자의 Authorization(JWT)로 익명 세션 uid를 알아내요.
  const authHeader = req.headers.get('Authorization');
  if (authHeader == null) {
    return json({ error: '인증이 필요해요.' }, 401);
  }
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();
  if (userError != null || user == null) {
    return json({ error: '인증에 실패했어요.' }, 401);
  }

  // 3) service_role 클라이언트(RLS 우회) — 이후엔 우리가 직접 소유권을 검증해요.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 4) 소유권 검증 — 방장(created_by)만 삭제할 수 있어요.
  const { data: room, error: roomError } = await admin
    .from('rooms')
    .select('id, created_by')
    .eq('id', roomId)
    .maybeSingle();
  if (roomError != null) {
    return json({ error: '방을 확인하지 못했어요.' }, 500);
  }
  if (room == null) {
    // 이미 삭제된 방 — 멱등하게 성공 처리(중복 호출·경쟁 상황에서 안전).
    return json({ success: true, alreadyDeleted: true }, 200);
  }
  if (room.created_by !== user.id) {
    return json({ error: '방장만 삭제할 수 있어요.' }, 403);
  }

  // 5) Storage 정리 — cell-photos/<roomId>/ 아래 객체를 전부 삭제해요(에러를 삼키지 않아요).
  const { data: files, error: listError } = await admin.storage
    .from('cell-photos')
    .list(roomId);
  if (listError != null) {
    return json({ error: '사진 정리에 실패했어요. 다시 시도해 주세요.' }, 500);
  }
  if (files != null && files.length > 0) {
    const paths = files.map((f: { name: string }) => `${roomId}/${f.name}`);
    const { error: removeError } = await admin.storage
      .from('cell-photos')
      .remove(paths);
    if (removeError != null) {
      // 사진을 못 지웠으면 방도 지우지 않아요 — orphan이 생기지 않게 원자성을 지켜요.
      return json({ error: '사진 정리에 실패했어요. 다시 시도해 주세요.' }, 500);
    }
  }

  // 6) 방 삭제(members·cells는 FK cascade).
  const { error: deleteError } = await admin
    .from('rooms')
    .delete()
    .eq('id', roomId);
  if (deleteError != null) {
    return json({ error: '방 삭제에 실패했어요.' }, 500);
  }

  return json({ success: true }, 200);
});
