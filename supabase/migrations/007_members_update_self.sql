-- 함께 방 안에서 본인 닉네임(멤버 이름)을 바꿀 수 있게 해요.
-- ------------------------------------------------------------------
-- 배경: members.nickname은 최초 참가 시 1회 설정(joinRoom의 upsert ignoreDuplicates) 후
--       불변이라, 방 안에서 이름을 고칠 수단이 없었어요. 본인 member 행만 UPDATE를 허용해요.
--
-- 범위: uid = auth.uid() 인 "본인 행"만 수정 가능(using + with check 둘 다). 남의 이름은 못 바꿔요.
--       칸 인증자 표시 이름은 buildBoard가 members(uid→nickname) 맵 기준으로 보여주므로,
--       이름을 바꾸면 내가 인증한 칸의 칩도 자동으로 갱신돼요(멤버가 나가면 cells.completed_by_nick로 폴백).
--       앱은 나간 뒤에도 일관되게 보이도록 이름 변경 시 내 cells.completed_by_nick도 함께 갱신해요
--       (기존 cells_update_owner 정책으로 본인 칸만 수정 가능).
--
-- Realtime: members UPDATE가 구독 이벤트를 발생시켜 다른 참가자 화면의 이름도 즉시 갱신돼요.
-- ------------------------------------------------------------------

create policy "members_update_self" on public.members
  for update to authenticated
  using (uid = auth.uid())
  with check (uid = auth.uid());
