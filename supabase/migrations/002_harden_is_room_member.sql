-- 보안 하드닝: is_room_member 헬퍼를 PostgREST 미노출 `private` 스키마로 이동.
-- ------------------------------------------------------------------
-- 이유: public 스키마의 SECURITY DEFINER 함수는 /rest/v1/rpc/ 로 직접 호출 가능해
--       Supabase security advisor가 WARN(0028/0029)을 냈어요. private 스키마는
--       API에 노출되지 않으므로 RPC 직접호출이 막히고, RLS 정책은 그대로 이 함수를
--       참조해 참가자 판정을 SECURITY DEFINER 로 계속 수행해요.
-- ------------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_room_member(p_room uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.room_id = p_room and m.uid = auth.uid()
  );
$$;
revoke execute on function private.is_room_member(uuid) from public;
grant execute on function private.is_room_member(uuid) to authenticated;

-- is_room_member 를 참조하던 6개 정책을 private. 버전으로 재생성
drop policy "rooms_select_member_or_creator" on public.rooms;
create policy "rooms_select_member_or_creator" on public.rooms
  for select to authenticated
  using (private.is_room_member(id) or created_by = auth.uid());

drop policy "members_select_same_room" on public.members;
create policy "members_select_same_room" on public.members
  for select to authenticated
  using (private.is_room_member(room_id));

drop policy "cells_select_member" on public.cells;
create policy "cells_select_member" on public.cells
  for select to authenticated
  using (private.is_room_member(room_id));

drop policy "cells_insert_member_self" on public.cells;
create policy "cells_insert_member_self" on public.cells
  for insert to authenticated
  with check (private.is_room_member(room_id) and completed_by_uid = auth.uid());

drop policy "cell_photos_insert_member" on storage.objects;
create policy "cell_photos_insert_member" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cell-photos'
    and private.is_room_member(((storage.foldername(name))[1])::uuid)
  );

drop policy "cell_photos_update_member" on storage.objects;
create policy "cell_photos_update_member" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cell-photos'
    and private.is_room_member(((storage.foldername(name))[1])::uuid)
  );

drop function public.is_room_member(uuid);
