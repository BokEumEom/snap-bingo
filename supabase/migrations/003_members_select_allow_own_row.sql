-- 참가(join) 불가 버그 수정: members SELECT 정책에 "본인 행은 항상 조회 가능" 추가.
-- ------------------------------------------------------------------
-- 증상: 방 참가 시 members upsert가 403(42501 "new row violates RLS")로 실패해
--       아무도 방에 참가할 수 없었고, 그로 인해 칸 인증/썸네일 등 함께 기능 전체가 막혔어요.
--
-- 원인(닭-달걀): 최초 참가자(방 생성자 포함)가 자신을 members에 insert할 때,
--   PostgREST의 upsert(ON CONFLICT)·return=representation 경로가 "새로 들어간 행"에도
--   SELECT 정책을 적용해요. 기존 USING은 private.is_room_member(room_id) 뿐이라
--   "이미 멤버여야 조회 가능"인데, 그 멤버십 행 자체가 지금 막 insert되는 중이라
--   SECURITY DEFINER 함수가 in-flight 행을 못 봐 false → 42501.
--   (rooms insert는 return이 걸려도 rooms엔 이런 SELECT 종속이 없어 통과했고,
--    cells는 이미 멤버가 된 뒤라 통과 → 오직 "첫 members 행"만 막혔어요.)
--
-- 검증: 실제 익명 JWT로 A생성/참가·B참가·선착순 칸 인증까지 REST 경로로 재현 → 전부 통과.
-- ------------------------------------------------------------------

drop policy "members_select_same_room" on public.members;
create policy "members_select_same_room" on public.members
  for select to authenticated
  using (private.is_room_member(room_id) or uid = auth.uid());
