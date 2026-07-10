-- 찍고빙고 "함께(실시간 공동 빙고판)" 백엔드 초기 스키마
-- ------------------------------------------------------------------
-- 실행 방법: Supabase 콘솔 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- (또는 supabase CLI: `supabase db push`)
--
-- 설계 요지
--  - 1 룸 = 1 공유 보드. 칸(cells)은 (room_id, cell_index) 유니크 → **선착순 1인 소유**.
--  - 신원: Supabase 익명 인증(auth.uid()) 기준으로 RLS. 로그인 없이 안전.
--  - Realtime: cells/members 를 publication 에 추가해 실시간 동기화.
--  - Storage: 압축 썸네일을 cell-photos 버킷의 <roomId>/<cellIndex>.jpg 에 저장.
-- ------------------------------------------------------------------

-- gen_random_uuid() (Supabase 기본 제공, 안전상 명시)
create extension if not exists pgcrypto;

-- 룸 = 하나의 공유 보드 -----------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  emoji       text not null,
  template_id text,                 -- 템플릿 보드면 원본 id(칸 재현용)
  missions    jsonb,                -- 커스텀 보드면 9칸 제목 배열
  created_by  uuid not null,        -- auth.uid()
  created_at  timestamptz not null default now()
);

-- 룸 참가자 --------------------------------------------------------
create table if not exists public.members (
  room_id   uuid not null references public.rooms(id) on delete cascade,
  uid       uuid not null,          -- auth.uid()
  nickname  text not null,
  joined_at timestamptz not null default now(),
  primary key (room_id, uid)
);

-- 칸 = 공유 보드의 9칸. (room_id, cell_index) PK 로 선착순 1인 소유 강제 ----
create table if not exists public.cells (
  room_id           uuid not null references public.rooms(id) on delete cascade,
  cell_index        int  not null check (cell_index between 0 and 8),
  completed_by_uid  uuid not null,  -- auth.uid()
  completed_by_nick text not null,
  thumb_url         text,           -- Storage 공유 썸네일 URL
  completed_at      timestamptz not null default now(),
  primary key (room_id, cell_index)
);

-- RLS 재귀를 피하기 위한 멤버십 판정 함수(security definer 로 RLS 우회) --------
create or replace function public.is_room_member(p_room uuid)
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

-- RLS 활성화 -------------------------------------------------------
alter table public.rooms   enable row level security;
alter table public.members enable row level security;
alter table public.cells   enable row level security;

-- rooms 정책
create policy "rooms_select_member_or_creator" on public.rooms
  for select to authenticated
  using (public.is_room_member(id) or created_by = auth.uid());
create policy "rooms_insert_self_as_creator" on public.rooms
  for insert to authenticated
  with check (created_by = auth.uid());

-- members 정책
create policy "members_select_same_room" on public.members
  for select to authenticated
  using (public.is_room_member(room_id));
create policy "members_insert_self" on public.members
  for insert to authenticated
  with check (uid = auth.uid());

-- cells 정책 (읽기=멤버, 인증=멤버 본인, 수정=내 칸 재업로드만) --------------
create policy "cells_select_member" on public.cells
  for select to authenticated
  using (public.is_room_member(room_id));
create policy "cells_insert_member_self" on public.cells
  for insert to authenticated
  with check (public.is_room_member(room_id) and completed_by_uid = auth.uid());
create policy "cells_update_owner" on public.cells
  for update to authenticated
  using (completed_by_uid = auth.uid())
  with check (completed_by_uid = auth.uid());

-- Realtime: 변경 구독 대상 테이블 등록 ---------------------------------
alter publication supabase_realtime add table public.cells;
alter publication supabase_realtime add table public.members;

-- Storage: 공유 썸네일 버킷 -------------------------------------------
insert into storage.buckets (id, name, public)
values ('cell-photos', 'cell-photos', true)
on conflict (id) do nothing;

-- 업로드는 그 룸의 멤버만(경로 첫 세그먼트 = roomId). 읽기는 public 버킷이라 URL로 열림.
create policy "cell_photos_insert_member" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cell-photos'
    and public.is_room_member(((storage.foldername(name))[1])::uuid)
  );
create policy "cell_photos_update_member" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cell-photos'
    and public.is_room_member(((storage.foldername(name))[1])::uuid)
  );
