-- 참가자 진짜 나가기: 본인 member 행만 삭제할 수 있게 해요.
-- ------------------------------------------------------------------
-- 배경: 지금까지 참가자 "나가기"는 로컬 목록(sharedRefs)에서만 제거하고 DB의 members 행은
--       그대로 남겨서, 실제로는 방에 계속 소속돼 있었어요(멤버 칩·멤버 수에 계속 잡힘).
--       이 정책으로 참가자가 자기 자신을 방에서 실제로 빼도록 members DELETE를 허용해요.
--
-- 범위: uid = auth.uid() 인 "본인 행"만 삭제 가능. 남의 멤버십은 못 지워요.
--       방장이 방 전체를 지우는 것과는 별개예요(그건 rooms_delete_owner + cascade).
--       참가자가 이미 인증한 칸(cells.completed_by_uid)은 그대로 둬요(기여 기록 유지).
--
-- Realtime: members DELETE가 구독 이벤트를 발생시켜 다른 참가자 화면의 멤버 목록이 즉시 갱신돼요.
-- ------------------------------------------------------------------

create policy "members_delete_self" on public.members
  for delete to authenticated
  using (uid = auth.uid());
