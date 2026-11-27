-- 운영 어드민(apps/admin)용 운영 컬럼·테이블·정책입니다.
-- 관리자는 API에 노출되지 않는 private.admins에 서비스 키(또는 SQL 편집기)로만 넣고,
-- 쓰기는 public.is_admin()이 참인 계정만 RLS로 허용합니다. 일반 회원의 기존 권한은 그대로입니다.
-- 입력 길이 상한은 어드민 검증(apps/admin/src/shared/api/types.ts의 LIMITS)과 같은 값입니다.

create schema if not exists private;

create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 로그인한 계정이 관리자인지. 정책 안에서 쓰고, 어드민 화면이 로그인 직후 확인합니다.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admins where user_id = (select auth.uid()))
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 수록 여행지. 앱 카탈로그(src/entities/destination/model)와 같은 ID를 씁니다.
create table public.catalog_destinations (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 64),
  realm text not null check (realm in ('real', 'fantasy')),
  lore text not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  original_name text not null default '' check (char_length(original_name) <= 100),
  tagline text not null check (char_length(btrim(tagline)) between 1 and 80),
  group_name text not null check (char_length(btrim(group_name)) between 1 and 40),
  location text not null default '' check (char_length(location) <= 60),
  era text not null default '' check (char_length(era) <= 60),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  overview text not null default '' check (char_length(overview) <= 2000),
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- 실존 유적은 역사·사실, 환상 세계는 신화·전설로만 나눕니다.
  constraint catalog_destinations_lore_check check (
    (realm = 'real' and lore in ('history', 'fact')) or (realm = 'fantasy' and lore in ('myth', 'legend'))
  )
);

-- 전설의 현장 코스. 코스를 모두 인증하면 앱이 'course-{id}' 뱃지를 줍니다.
create table public.catalog_courses (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 64),
  title text not null check (char_length(btrim(title)) between 1 and 40),
  summary text not null check (char_length(btrim(summary)) between 1 and 200),
  stops text[] not null check (cardinality(stops) between 2 and 12),
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

-- 기념 뱃지의 이름·설명·공개 여부. 획득 조건은 앱 코드(features/badges)가 계산합니다.
create table public.catalog_badges (
  id text primary key check (char_length(id) between 1 and 64),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  description text not null check (char_length(btrim(description)) between 1 and 120),
  tone text not null check (tone in ('real', 'fantasy')),
  rule text not null default '' check (char_length(rule) <= 60),
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

create trigger catalog_destinations_touch before update on public.catalog_destinations
  for each row execute function public.touch_updated_at();
create trigger catalog_courses_touch before update on public.catalog_courses
  for each row execute function public.touch_updated_at();
create trigger catalog_badges_touch before update on public.catalog_badges
  for each row execute function public.touch_updated_at();

alter table public.catalog_destinations enable row level security;
alter table public.catalog_courses enable row level security;
alter table public.catalog_badges enable row level security;

-- 회원에게는 숨기지 않은 항목만 보이고, 관리자는 모두 보고 고칩니다.
create policy "catalog_destinations_read" on public.catalog_destinations for select to authenticated
  using (not hidden or (select public.is_admin()));
create policy "catalog_destinations_admin_write" on public.catalog_destinations for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "catalog_courses_read" on public.catalog_courses for select to authenticated
  using (not hidden or (select public.is_admin()));
create policy "catalog_courses_admin_write" on public.catalog_courses for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "catalog_badges_read" on public.catalog_badges for select to authenticated
  using (not hidden or (select public.is_admin()));
create policy "catalog_badges_admin_write" on public.catalog_badges for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 가입 추이를 보려고 프로필에 만든 날짜를 둡니다. 이미 있는 회원은 이 마이그레이션을 올린 시각이 됩니다.
alter table public.profiles add column created_at timestamptz not null default now();

-- 관리자 목록용 회원 정보. 본명(name)은 본인만 보므로 빼고, 관리자가 아니면 빈 결과입니다.
create view public.admin_users with (security_barrier = true) as
select p.id, p.nickname, p.avatar_path, p.created_at
from public.profiles p
where (select public.is_admin());
revoke all on public.admin_users from public, anon;
grant select on public.admin_users to authenticated;

-- 현장 인증 스탬프: 관리자는 모두 보고, 부정 인증을 취소(삭제)합니다.
create policy "checkins_admin_read" on public.checkins for select to authenticated
  using ((select public.is_admin()));
create policy "checkins_admin_delete" on public.checkins for delete to authenticated
  using ((select public.is_admin()));

-- 신고된 프로필 사진을 관리자가 볼 수 있게 합니다(쓰기는 그대로 본인만).
create policy "avatars_objects_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (select public.is_admin()));

-- 닉네임·프로필 사진 신고. 회원은 남을 신고하고 자기가 낸 신고만 보며, 처리는 관리자만 합니다.
create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  target text not null check (target in ('nickname', 'avatar')),
  reason text not null check (char_length(btrim(reason)) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note text not null default '' check (char_length(resolution_note) <= 200),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references auth.users (id) on delete set null,
  constraint profile_reports_not_self check (reporter_id <> target_id)
);
create index profile_reports_status_idx on public.profile_reports (status, created_at desc);
create index profile_reports_target_idx on public.profile_reports (target_id);

alter table public.profile_reports enable row level security;

create policy "profile_reports_insert_own" on public.profile_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and resolution_note = ''
    and handled_at is null
    and handled_by is null
  );
create policy "profile_reports_read" on public.profile_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

-- 신고 처리: 닉네임 초기화·사진 내리기·기각. 프로필과 신고를 한 번에 바꾸고,
-- 조치하면 같은 회원의 같은 항목에 쌓인 다른 대기 신고도 함께 닫습니다.
create function public.admin_handle_report(p_report_id uuid, p_action text, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_report public.profile_reports;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 없습니다.' using errcode = '42501';
  end if;
  if p_action not in ('reset_nickname', 'remove_avatar', 'dismiss') then
    raise exception '알 수 없는 처리 방법입니다.' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) not between 1 and 200 then
    raise exception '처리 메모는 1~200자입니다.' using errcode = '23514';
  end if;

  select * into v_report from public.profile_reports where id = p_report_id for update;
  if not found then
    raise exception '신고를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
  if v_report.status <> 'open' then
    raise exception '이미 처리한 신고입니다.' using errcode = '23505';
  end if;
  if (p_action = 'reset_nickname' and v_report.target <> 'nickname')
    or (p_action = 'remove_avatar' and v_report.target <> 'avatar') then
    raise exception '신고 항목과 처리 방법이 맞지 않습니다.' using errcode = '22023';
  end if;

  if p_action = 'reset_nickname' then
    update public.profiles set nickname = '여행자' || right(replace(id::text, '-', ''), 4)
    where id = v_report.target_id;
  elsif p_action = 'remove_avatar' then
    -- 저장소의 파일은 지우지 않고 연결만 끊습니다(회원이 새 사진을 올리면 덮어씀).
    update public.profiles set avatar_path = null where id = v_report.target_id;
  end if;

  update public.profile_reports
  set status = case when p_action = 'dismiss' then 'dismissed' else 'resolved' end,
    resolution_note = btrim(p_note),
    handled_at = now(),
    handled_by = (select auth.uid())
  where id = p_report_id
    or (p_action <> 'dismiss' and status = 'open'
      and target_id = v_report.target_id and target = v_report.target);
end;
$$;
revoke all on function public.admin_handle_report(uuid, text, text) from public;
grant execute on function public.admin_handle_report(uuid, text, text) to authenticated;
