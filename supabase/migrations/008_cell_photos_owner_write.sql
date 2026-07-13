-- 함께 보드 사진 파일 쓰기를 '그 칸의 소유자'로 제한 (방어 강화)
-- ------------------------------------------------------------------
-- 배경: cell_photos_insert/update_member 정책은 방 멤버 '누구나'
--       <roomId>/<cellIndex>.jpg 를 upsert(덮어쓰기)할 수 있었어요.
--       DB 행(public.cells)은 cells_update_owner로 소유자만 바꾸게 보호되지만,
--       파일은 고정 경로라 멤버가 '남의 칸 사진 바이트'를 덮어써 훼손할 수 있었음
--       (앱 UI로는 불가, 조작된 스토리지 API 호출로만 가능한 무결성 갭).
-- 조치: 파일 쓰기(INSERT/UPDATE)를 '그 칸을 인증한 소유자(auth.uid())'로 좁혀요.
-- 경로: <roomId>/<cellIndex>.jpg
--       roomId    = (storage.foldername(name))[1]
--       cellIndex = split_part(split_part(name, '/', 2), '.', 1)
-- 참고: SELECT(cell_photos_select_member, 멤버 전체 열람)와
--       DELETE(cell_photos_delete_owner, 방장/서버 Edge)는 그대로 유지해요.
-- ------------------------------------------------------------------

-- 칸 소유 판정 헬퍼: is_room_member와 동일 패턴(private, SECURITY DEFINER).
-- SECURITY DEFINER라 cells RLS를 우회해 판정하되, auth.uid()는 호출자 JWT를 그대로 읽어요.
create or replace function private.is_cell_owner(p_room uuid, p_cell_index int)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cells c
    where c.room_id = p_room
      and c.cell_index = p_cell_index
      and c.completed_by_uid = auth.uid()
  );
$$;
revoke execute on function private.is_cell_owner(uuid, int) from public;
grant execute on function private.is_cell_owner(uuid, int) to authenticated;

-- INSERT: 첫 인증(claimCell이 cells에 내 소유 행을 만든 뒤 uploadThumb) — 소유자만.
drop policy if exists "cell_photos_insert_member" on storage.objects;
create policy "cell_photos_insert_owner" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cell-photos'
    and private.is_cell_owner(
      ((storage.foldername(name))[1])::uuid,
      split_part(split_part(name, '/', 2), '.', 1)::int
    )
  );

-- UPDATE: 사진 교체 — 소유자만. 남의 칸 파일 덮어쓰기(upsert)를 차단해요.
drop policy if exists "cell_photos_update_member" on storage.objects;
create policy "cell_photos_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cell-photos'
    and private.is_cell_owner(
      ((storage.foldername(name))[1])::uuid,
      split_part(split_part(name, '/', 2), '.', 1)::int
    )
  );
