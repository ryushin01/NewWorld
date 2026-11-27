# Supabase를 다시 켤 때

Supabase 프로젝트 `newworld`는 지금 일시 중지 상태이고, 웹 데모·운영 어드민 데모·`.env` 없는 앱은 기기 안의 목데이터로 돕니다. 다시 켜면 이 문서의 순서대로 서버를 목데이터와 같은 상태로 채웁니다. 운영 DB에 쓰는 단계이므로 각 단계는 사람이 직접 실행합니다.

## 목데이터와 시드

| 원천                                     | 내용                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/entities/destination/model/`        | 여행지 55곳(`catalog-real.ts`·`catalog-fantasy.ts`), 코스(`courses.ts`), 뱃지 이름·설명·조건(`badge-catalog.ts`). 앱과 어드민이 함께 씁니다                    |
| `src/shared/api/demo-master.ts`          | ryushin0(마스터) 계정. 여행지 55곳 방문·현장 인증 기록(`demo-master-visits.ts`, `pnpm run demo:master`로 다시 만듦)과 프로필 사진(`assets/demo/ryushin0.webp`) |
| `apps/admin/src/shared/api/demo/seed.ts` | 운영 어드민 목데이터. 위 두 원천에 가상 회원 26명·데모 관리자·스탬프·신고를 더해 DB 표와 같은 모양(`createSeed`)으로 만듭니다                                  |
| `supabase/seed/admin-demo.sql`           | 위 목데이터를 SQL로 내보낸 시드(`pnpm run db:seed:export`). 손으로 고치지 않습니다                                                                             |

시드가 채우는 표: `auth.users`(아이디 주소만, 비밀번호 없음), `public.profiles`(본명은 비움, 관리자 보기 `admin_users`의 원본), `private.admins`(데모 관리자), `public.catalog_destinations`·`catalog_courses`·`catalog_badges`, `public.checkins`(스탬프), `public.profile_reports`(신고). 시각은 기준 시각과의 차이(`now() - interval`)로 들어가 언제 넣어도 "최근 30일" 지표가 살아 있습니다. 회원 UUID는 모두 `5eed`로 시작해 실제 회원과 겹치지 않습니다.

```bash
pnpm run db:seed:export                          # supabase/seed/admin-demo.sql 다시 만들기
pnpm run db:seed:export -- --check               # 커밋된 SQL이 목데이터와 같은지 검사
pnpm run db:seed:export -- --avatars supabase/.temp/avatars  # avatars 버킷에 올릴 프로필 사진(JPEG, 256px)
pnpm run test:db                                 # PGlite에 마이그레이션 + 시드를 넣어 RLS와 함께 검사
```

`pnpm run test:db`의 `supabase/tests/seed.test.mjs`가 커밋된 SQL이 목데이터와 같은지, 표 수와 칸이 목데이터와 같은지, 다시 넣어도 늘지 않는지, 데모 관리자가 어드민 정책으로 회원·스탬프·신고를 보고 신고를 처리하는지, 마스터 계정(일반 회원)이 자기 스탬프 55개만 보고 관리자 보기는 비어 있는지 봅니다.

## 켜는 순서

1. **프로젝트 복원:** Supabase 대시보드에서 `newworld` 프로젝트를 복원(Restore)합니다. 무료 플랜은 활성 프로젝트 수에 한도(2개)가 있어 다른 무료 프로젝트가 이미 켜져 있으면 복원되지 않습니다. 그때는 다른 프로젝트를 멈추거나 조직을 Pro로 올립니다(아래 [요금](#요금)).
2. **마이그레이션:** `npx supabase link --project-ref <프로젝트 ref>` 뒤 `npx supabase db push --remote`(CLI 3부터 `--remote`가 없으면 로컬 DB에 적용). 무엇이 올라가는지는 [개발 가이드의 서버 적용 현황](development.md#서버-적용-현황)에 있습니다. `npx supabase config push`로 인증 설정(메일 인증 끄기, 비밀번호 8자 이상)도 올립니다.
3. **시드 적용:** 대시보드 **Connect**의 연결 문자열로 `psql "<연결 문자열>" -f supabase/seed/admin-demo.sql`을 실행하거나 SQL 편집기에 파일 내용을 붙여 실행합니다. 한 트랜잭션이라 중간에 실패하면 아무것도 남지 않고, 다시 실행해도 됩니다. 프로필 사진은 `pnpm run db:seed:export -- --avatars supabase/.temp/avatars` 뒤 `npx supabase storage cp -r supabase/.temp/avatars ss:///avatars --experimental --linked`로 올립니다(올리기 전에는 어드민에 머리글자만 보임).
4. **장소 검색 함수 배포:** `npx supabase functions deploy place-search`(계정 삭제·복구까지 한 번에 올리려면 이름 없이 `npx supabase functions deploy`). 따로 넣을 비밀 값은 없습니다.
5. **관리자 계정 등록:** 시드의 데모 관리자(`demo-admin`)와 회원들은 비밀번호가 없어 로그인할 수 없습니다. 앱에서 본인 아이디로 가입한 뒤 SQL 편집기에서 `insert into private.admins (user_id) select id from auth.users where email = '<아이디>@users.newworld.app';`를 실행합니다. 데모 관리자를 빼려면 `delete from private.admins where user_id = '5eed0001-0000-4000-8000-0000000000ad';`
6. **데모 모드 끄기:** 앱은 `.env`(빌드는 EAS 환경 변수)에 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY`를, 어드민은 `apps/admin/.env`에 `VITE_SUPABASE_URL`·`VITE_SUPABASE_ANON_KEY`를 넣고 `VITE_DEMO`는 뺍니다. GitHub Pages의 웹 데모·어드민 데모는 늘 데모 모드로 빌드되므로(`scripts/build-web.mjs`, `build:admin`) 그대로 둡니다.

시드 회원을 나중에 지우려면 `delete from auth.users where id::text like '5eed%';`(프로필·스탬프·신고가 함께 지워짐)를 실행합니다. 수록 표(`catalog_*`)는 앱 카탈로그와 같으므로 그대로 둡니다.

## 요금

2026년 11월 기준 Supabase 요금 정책의 요점입니다. 바뀔 수 있으니 켜기 전에 [공식 요금표](https://supabase.com/pricing)를 다시 확인합니다.

- **무료 플랜:** 활성 프로젝트는 2개까지입니다. 한동안(약 1주) 쓰지 않으면 자동으로 일시 중지되고, 일시 중지된 프로젝트는 일정 기간(약 90일) 안에 대시보드에서 복원할 수 있습니다. 지금 `newworld`가 꺼진 이유가 이 활성 프로젝트 한도입니다.
- **Pro 플랜:** 조직 단위의 월 요금(기본 컴퓨트 크레딧 포함)이며 프로젝트가 자동으로 일시 중지되지 않습니다. 무료 프로젝트 2개 한도에 걸리지 않고 `newworld`를 늘 켜 두려면 Pro 결제가 필요합니다. 결제는 비용이 드는 결정이라 사용자가 직접 합니다.
