-- 썸네일 업로드 400 수정: cell-photos 버킷에 멤버 SELECT 정책 추가.
-- ------------------------------------------------------------------
-- 증상: 칸 인증 후 사진 업로드가 400(본문 403 "new row violates row-level security policy")로 실패.
--       POST /storage/v1/object/cell-photos/<room>/<cell>.jpg
--
-- 원인: 클라이언트가 .upload(..., { upsert: true })를 사용하는데, storage-api의 upsert
--       경로는 대상 행에 SELECT 정책을 적용해요. 기존엔 cell-photos에 INSERT/UPDATE 정책만
--       있고 SELECT 정책이 없어 upsert가 RLS로 막혔어요.
--       (upsert 없는 순수 insert는 200으로 통과하지만, 재업로드 안전성을 위해 upsert 유지가 나아요.)
--
-- 안전성: public 버킷이라 이미지는 public URL로 이미 열람 가능. 이 SELECT 정책은 인증 API의
--         메타데이터 조회를 "그 방의 멤버"로만 한정할 뿐 추가 노출이 없어요.
--
-- 검증: 실제 멤버 JWT로 upsert=true 업로드 → 200(수정 전 400).
-- ------------------------------------------------------------------

create policy "cell_photos_select_member" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cell-photos'
    and private.is_room_member(((storage.foldername(name))[1])::uuid)
  );
