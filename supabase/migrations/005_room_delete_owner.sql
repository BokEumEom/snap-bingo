-- 방장 삭제: 함께 방을 만든 사람만 방 전체를 삭제할 수 있게 해요.
-- ------------------------------------------------------------------
-- 배경: 지금까지 함께 보드엔 삭제 수단이 아예 없었어요. 참가자든 방장이든 '나가기'(로컬
--       목록에서만 제거)뿐이라, 방·멤버·칸·사진이 Supabase에 영구히 남았어요.
--       방장이 자기가 만든 챌린지를 정리할 수 있어야 하므로, 방장(created_by)만
--       방을 삭제하도록 DELETE 정책을 추가해요.
--
-- 정리 범위:
--   - members / cells: rooms(id) FK가 `on delete cascade`라 방을 지우면 자동으로 함께 사라져요.
--   - Storage(cell-photos): FK로 엮이지 않아 cascade가 안 돼요. 그래서 방장이 자기 방 폴더의
--     썸네일을 지울 수 있는 DELETE 정책을 추가하고, 앱에서 "썸네일 삭제 → 방 삭제" 순서로 정리해요.
--     (방을 먼저 지우면 소유 판정(is_room_owner)이 false가 돼 orphan 이미지가 남아요.)
--
-- 안전성: is_room_owner는 private 스키마의 SECURITY DEFINER 함수라 /rpc/ 직접호출이 막혀요
--         (is_room_member와 동일한 하드닝). RLS 정책 참조 용도로만 써요.
-- ------------------------------------------------------------------

-- 방 소유(방장) 판정 헬퍼 — RLS 재귀를 피하려고 SECURITY DEFINER로 rooms를 조회해요.
create or replace function private.is_room_owner(p_room uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room and r.created_by = auth.uid()
  );
$$;
revoke execute on function private.is_room_owner(uuid) from public;
grant execute on function private.is_room_owner(uuid) to authenticated;

-- rooms: 방장만 삭제(멤버·칸은 on delete cascade로 함께 삭제됨).
create policy "rooms_delete_owner" on public.rooms
  for delete to authenticated
  using (created_by = auth.uid());

-- storage(cell-photos): 방장이 자기 방 폴더(<roomId>/…)의 썸네일을 삭제할 수 있어요.
-- 앱은 방을 지우기 전에 이 정책으로 폴더를 먼저 비워요.
create policy "cell_photos_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cell-photos'
    and private.is_room_owner(((storage.foldername(name))[1])::uuid)
  );
