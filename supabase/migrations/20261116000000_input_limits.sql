-- 입력 길이 상한. 앱 검증(src/shared/config의 LIMITS)과 같은 값입니다.
-- 아주 긴 글 하나가 동기화와 기기의 오프라인 사본을 키우지 않도록, API로 직접 보내는 값도 서버에서 막습니다.
-- 이미 저장된 행은 검사하지 않고(not valid) 새로 쓰거나 고치는 행부터 적용합니다.

-- 배열의 모든 글자가 상한 안인지 확인합니다(CHECK 제약 안에서는 하위 쿼리를 쓸 수 없어 함수로 둡니다).
create function public.texts_within(items text[], max_length integer) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(char_length(item) <= max_length), true) from unnest(items) as item
$$;

alter table public.places
  add constraint places_address_length check (char_length(address) <= 300) not valid,
  add constraint places_memo_length check (char_length(memo) <= 2000) not valid,
  add constraint places_tags_limit
    check (cardinality(tags) <= 20 and public.texts_within(tags, 30)) not valid;

alter table public.records
  add constraint records_title_length check (char_length(title) <= 100) not valid,
  add constraint records_memo_length check (char_length(memo) <= 2000) not valid,
  add constraint records_members_limit
    check (cardinality(members) <= 50 and public.texts_within(members, 30)) not valid,
  add constraint records_short_texts_length check (
    char_length(weather) <= 200 and char_length(transport) <= 200 and char_length(lodging) <= 200
  ) not valid,
  add constraint records_long_texts_length check (
    char_length(highlights) <= 2000 and char_length(gateway) <= 2000
    and char_length(encounters) <= 2000 and char_length(souvenir) <= 2000
  ) not valid;

alter table public.trips
  add constraint trips_memo_length check (char_length(memo) <= 2000) not valid,
  add constraint trips_stops_limit
    check (cardinality(stops) <= 60 and public.texts_within(stops, 64)) not valid;

alter table public.checklist_items
  add constraint checklist_items_category_length check (char_length(category) <= 30) not valid;
