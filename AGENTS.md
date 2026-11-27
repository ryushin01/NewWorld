# NewWorld 에이전트 안내

## 1. 프로젝트 개요

역사 유적과 신화·전설 속 여행지를 탐험하고 기록하는 Expo(React Native) 모바일 앱입니다. 모바일 우선 패턴, 성능, iOS·Android·웹 호환을 먼저 생각합니다.

- 화면 축: 모바일 앱(iOS·Android)과 운영 어드민 웹(`apps/admin`). 웹 데모는 앱의 웹 빌드입니다.
- 웹 데모: https://ryushin01.github.io/NewWorld/ (로그인 화면의 `둘러보기`, 아이디 `guest`)
- 어드민 데모: https://ryushin01.github.io/NewWorld/admin/ (`관리자로 둘러보기`, 시드 데이터·브라우저 저장)
- 스토어에는 출시하지 않았습니다. 출시 준비는 `docs/release-checklist.md`에 있습니다.

## 2. 기술 스택과 구조

- Expo SDK 58, React Native 0.88, React 19, Expo Router, Tamagui 3, TanStack Query, Zustand, React Hook Form + Zod, Supabase(선택), Sentry(선택)
- Feature-Sliced Design: `src/_app` → `src/_pages` → `widgets` → `features` → `entities` → `shared`(위 층만 아래 층을 가져옴). Steiger는 쓰지 않습니다.
- `src/app/`은 Expo Router 경로입니다. 파일 하나가 화면이고 `_layout.tsx`가 내비게이터이며, `src/_pages`를 다시 내보내기만 합니다. 경로가 아닌 코드(컴포넌트, 훅, 유틸)는 `src/app/` 밖에 둡니다.
- `Link`, `router`, `useLocalSearchParams`는 `expo-router`에서 가져옵니다.
- 서버 원본: `supabase/`(마이그레이션, RLS, 버킷 정책, Edge Function `place-search`·`delete-account`·`recover-account`, 인증 설정)
- 운영 어드민: `apps/admin`(Vite + React, 자체 FSD `app`→`pages`→`widgets`→`features`→`entities`→`shared`, 경로 별칭 `@admin/*`, 해시 주소 라우팅). 앱 카탈로그를 `@catalog/*`로 시드에 씁니다. `VITE_DEMO=1`이거나 Supabase 값이 없으면 데모 모드(브라우저 저장소). 루트 `tsconfig.json`·Jest에서는 빠지고 `apps/admin/tsconfig.json`·Vitest로 검사합니다.
- 자세한 내용: `docs/development.md`, `docs/sequence-diagrams.md`

### Expo는 자주 바뀝니다 — 기억에 기대지 않기

Expo는 SDK마다 큰 변경이 있어 기억하는 API가 이름이 바뀌었거나 옮겨졌거나 없어졌을 수 있습니다. Expo, EAS, React Native API를 건드리기 전에:

1. `package.json`의 `expo` 주 버전을 확인합니다.
2. 그 버전 문서를 봅니다: `https://docs.expo.dev/versions/v<주 버전>.0.0/`
3. 그 밖의 것은 https://docs.expo.dev/llms.txt 목록에서 해당 문서를 따라가 확인합니다. 기억으로 답하지 않습니다.

## 3. 설치·개발 명령

- 패키지 매니저: pnpm(`packageManager`), Node.js 24(`.nvmrc`). iOS는 Xcode·CocoaPods, Android는 Android Studio·JDK

```bash
pnpm install
pnpm start                     # 개발 서버 (expo start)
pnpm run ios                   # 또는 pnpm run android (expo run:*)
npx expo install <패키지>      # 패키지 추가는 늘 이것으로(SDK에 맞는 버전)
npx expo install --fix         # 맞지 않는 버전 고치기
npx expo install --check       # SDK 버전 확인
npx expo-doctor                # 의존성·설정 진단
pnpm run build:web             # 웹 데모 빌드(dist/, /NewWorld 경로, 늘 데모 모드)
pnpm run admin                 # 운영 어드민 개발 서버(Vite)
pnpm run build:admin           # 운영 어드민 데모 빌드(apps/admin/dist, 상대 경로)
```

- 환경 변수(`.env.example` → `.env`, 이름만): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_MAPS_ANDROID_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN`. `.env`가 없으면 가상 데이터로 도는 데모 모드입니다.
- `ios/`·`android/`는 생성되는 폴더입니다(Continuous Native Generation). 손으로 만들거나 고치지 말고 `app.config.ts`와 config plugin으로 설정합니다. `app.config.ts`를 바꾸면 `npx expo prebuild --no-clean`으로 반영합니다.
- Expo Go에는 기본 네이티브 모듈만 있습니다. 네이티브 코드가 있는 라이브러리를 넣으면 개발 빌드(`npx expo run:ios|android` 또는 `eas build --profile development`)가 필요합니다.
- 라이브러리를 더하기 전에 권장 Expo 모듈이 있는지 먼저 봅니다(https://docs.expo.dev/versions/latest/index.md).

## 4. 검사·테스트 명령

CI(`.github/workflows/ci.yml`, `main` 푸시·모든 PR)의 `verify` 작업은 이 순서로 돕니다. 작업을 끝냈다고 하기 전에 최소한 lint와 typecheck를 돌립니다.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck             # tsc --noEmit
pnpm run typecheck:functions   # Edge Function 타입 검사
pnpm run lint                  # expo lint + 어드민 eslint(jsx-a11y)
pnpm test                      # Jest + React Native Testing Library
pnpm run test:db               # 마이그레이션을 PGlite에 적용해 RLS·제약 검사
pnpm run test:web              # 웹 데모 오프라인 E2E(CI의 web-offline 작업, Playwright + axe)
pnpm run typecheck:admin       # 어드민 타입 검사 (verify 작업)
pnpm run test:admin            # 어드민 Vitest + Testing Library (verify 작업)
pnpm run test:admin:e2e        # 어드민 빌드 + Playwright E2E(오프라인·axe) (CI의 admin-web 작업)
pnpm run size:admin            # 어드민 번들 예산(size-limit, admin-web 작업)
pnpm run lhci:admin            # 어드민 Lighthouse CI(결과는 .lighthouseci/admin, admin-web 작업)
```

- `test:web`은 웹 데모를 `/` 경로로 빌드해 `expo serve`로 띄우고 localhost 밖 요청을 모두 막은 채 둘러보기 → 모든 탭이 데모 데이터와 함께 뜨는지, axe(WCAG 2.2 AA) 위반·외부 요청이 없는지 봅니다(`e2e/web/offline.spec.ts`). 처음 한 번은 `pnpm exec playwright install chromium`. 아직 못 고친 접근성 문제는 테스트 파일의 알려진 목록에 있습니다. 데모 모드는 서버·CDN 없이 돌아야 합니다(자세히: `docs/development.md`의 오프라인 동작).

- 서식: `pnpm run format`(Prettier, 커밋 때 lint-staged가 `*.{ts,tsx,js,mjs}`에 돌림). CI에는 없지만 `pnpm exec prettier --check .`가 저장소 전체에서 통과해야 합니다.
- **Testing Library 원칙:** 구현 세부가 아니라 사용자가 보는 동작을 검사하고, 요소는 역할·이름(`getByRole`)이나 레이블(`getByLabelText`)로 찾습니다. 도구는 단위·컴포넌트 Jest + React Native Testing Library, 앱 화면 흐름 Maestro E2E, 웹 데모 Playwright + axe입니다. 기존 테스트는 `getByTestId`·`getByText`가 많습니다. 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.
- E2E(로컬, Maestro): `pnpm run test:e2e`(전용 시뮬레이터 `NewWorld E2E`, Release 빌드), `pnpm run test:e2e:server`(로컬 Supabase). E2E는 Release 빌드로 돌립니다.
- 컴포넌트 카탈로그: `EXPO_PUBLIC_STORYBOOK_ENABLED=true pnpm start` 뒤 앱의 `/storybook`
- 그 밖: `pnpm run credits`(출처 문서 갱신), `pnpm run assets`(지도 핀 생성), `pnpm run screenshots`(README iOS 화면)

## 5. 코드 스타일

- TypeScript strict(Edge Function도 같음), `any`·`as` 단언·`@ts-ignore` 금지, 외부 입력은 Zod로 검증합니다. 서식은 `.prettierrc`(`singleQuote`, `printWidth: 100`, `trailingComma: all`)를 따릅니다.
- 기존 FSD 구조와 파일 위치를 따릅니다. 아이콘(Lucide)은 `src/shared/ui/icons.ts`에서 하나씩 가져와 `@/shared/ui`로 씁니다(패키지 입구 가져오기는 ESLint가 막음). 글꼴 패키지도 굵기 경로(`/400Regular`)에서 가져옵니다.
- 글꼴은 굵기가 하나라 `fontWeight`를 더하지 않습니다. 굵은 본문은 제목 글꼴로 구분합니다.
- 색 토큰: 작은 글자에 `brand`(`#c2792b`)를 쓰지 말고 `brandText`, 환상 세계 글자는 `fantasyText`를 씁니다.
- 입력 길이 상한은 앱(`src/shared/config`의 `LIMITS`)과 DB 제약(`20261116000000_input_limits.sql`)을 함께 고칩니다.
- 기기 저장값은 `src/shared/lib/stored-json.ts`의 `parseStoredJson`·`isRecord`로 읽습니다.
- 접근성(WCAG 2.2·KWCAG 2.2, 세부는 공통 규칙): `accessibilityRole`·레이블을 먼저 씁니다(웹에서는 `src/shared/ui/web-a11y.ts`가 `role`·`aria-*`로 바꿈). 앱에는 eslint-plugin-jsx-a11y가 없고(`eslint-config-expo`만 씀) 웹 데모의 axe(`pnpm run test:web`)와 단위 테스트로 검사합니다. 어드민(`apps/admin`)은 jsx-a11y 권장 규칙과 axe(Vitest·Playwright)로 검사합니다.

## 6. Git·PR

- **흐름: GitHub Flow.** `main`에 직접 커밋·푸시하지 않고, 최신 `main`에서 브랜치를 만들어 PR로만 병합합니다.
- **브랜치 이름:** `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…`, `chore/…`, `release/…`(이 저장소에서 실제로 쓴 것은 `feat`·`fix`·`docs`·`chore`·`refactor`·`perf`).
- **커밋 메시지: Conventional Commits.** `<타입>: <한국어 요약>`, 타입은 `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`(의존성은 `chore(deps):`). 버전을 올린 커밋·PR 제목은 끝에 `(x.y.z)`를 붙입니다. 예: `feat: 웹 데모(GitHub Pages)와 웹 화면·접근성 수정 (2.17.0)`, `fix: 고고학자 아서 에번스도 아더 에번스로 (2.17.1)`. 문서·잡일 PR은 버전 없이 씁니다(`docs: README에 웹 데모 화면 8장 추가`). 호환이 깨지면 본문에 `BREAKING CHANGE:`.
- 본문은 바꾼 이유와 내용을 한국어로 적습니다.
- **작성자:** 커밋 작성자는 항상 ryushin01(`ryushin0 <141554987+ryushin01@users.noreply.github.com>`)입니다(기여자는 ryushin01만 남김). 백엔드 코드가 있는 저장소라 공동 작성자 줄은 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 하나만 넣습니다.
- GitHub Actions가 커밋하는 워크플로는 작성자를 ryushin01로 설정합니다(`github-actions[bot]` 금지). Dependabot PR은 그대로 병합하지 말고 같은 변경을 ryushin01 커밋으로 다시 만들어 병합합니다.
- **버전: Semantic Versioning.** `package.json`의 `version`과 README 버전 배지를 함께 맞춥니다. 스토어 빌드 버전은 `app.config.ts`의 `version`입니다.
- **변경 기록: Keep a Changelog 기반.** `CHANGELOG.md`에 최신 버전을 위에 둡니다. 이 저장소는 스토어 출시 전이라 날짜 대신 `## x.y.z - 미출시`로 적고, `[Unreleased]` 절과 추가·변경·수정·제거 소제목은 쓰지 않고 `- 분류: 내용` 목록으로 적습니다(표준과 다른 점).
- **병합:** squash(제목 끝에 `(#번호)`). CI가 통과하면 바로 병합하고 CodeRabbit 리뷰는 기다리지 않습니다.
- Expo SDK가 정하는 패키지(`expo*`, `react`, `react-native*`, `@react-native-*`, `@shopify/flash-list`, `@sentry/react-native`, `jest-expo`, `eslint-config-expo`)는 Dependabot에서 뺐습니다. `npx expo install --fix`로만 올립니다.

## 7. 배포·릴리스

- 웹 데모: `main`에 앱 코드·에셋·설정이 바뀌면 `.github/workflows/deploy-web.yml`이 GitHub Pages에 배포합니다. `.env`를 읽지 않아 늘 데모 모드이고 비밀값이 필요 없습니다. 같은 작업이 어드민 데모(`build:admin`)를 `dist/admin/`에 넣어 `/NewWorld/admin/`으로 올립니다.
- 앱: EAS(`eas.json`의 `development`·`preview`·`production`). `npx eas-cli@latest build --profile production --platform all`, `npx eas-cli@latest submit --platform all`. 비밀값은 EAS 환경 변수에 둡니다.
- 릴리스: 병합 뒤 `v2.17.2` 형식 태그로 GitHub 릴리스(대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG 해당 절)를 만들고 `bash ~/Documents/Archive/Backup/backup.sh`로 백업합니다.
- 진행 기록: Obsidian 보관함 `NewWorld v1.0.0 고도화 계획.md`. 소개가 크게 바뀌면 프로필 저장소 `ryushin01/ryushin01` README 표를 고칩니다.

## 8. 보안·주의사항

- 비밀값과 `.env`는 커밋하지 않습니다. 웹 데모에 Supabase 값이나 유료 키를 넣지 않습니다(`scripts/build-web.mjs`가 지움).
- Supabase 프로젝트 `newworld`는 일시 중지 상태입니다. 마이그레이션은 자동 적용되지 않고 `npx supabase db push --remote`로 손으로 올립니다(CLI 3부터 `--remote`가 없으면 로컬 DB에 적용). 적용 현황은 `docs/development.md`의 `서버 적용 현황`.
- `20261108000000_ruins_travel.sql`은 되돌릴 수 없게 칸을 지웁니다. 데이터가 있는 서버는 백업한 뒤 올립니다.
- `patches/`의 패치는 정확한 버전에만 걸립니다. 그 패키지를 올리면 패치를 다시 만들거나 지우고, iOS는 `expo.autolinking.ios.buildFromSource`도 확인합니다.
- `docs/credits.md`와 `pnpm-lock.yaml`은 Prettier 대상이 아닙니다.
- 공개된 지 하루가 안 된 패키지는 설치되지 않습니다(pnpm 기본 `minimumReleaseAge`). `expo install`이 멈추면 하루 뒤 다시 실행합니다.

- CI·배포·릴리스 상태는 명령 결과(`gh run`, `gh release`, `curl`)로 확인한 것만 말합니다.
- 먼저 묻기: 새 런타임 의존성, 빌드·네이티브 설정(`app.config.ts`, `eas.json`, `metro.config.js`, `tsconfig.json`) 변경, 운영 Supabase에 마이그레이션 적용.
- 절대 금지: 비밀값을 `EXPO_PUBLIC_*`(앱 번들에 들어감)에 넣기, `.env` 커밋, `eslint-disable`·`--no-verify`로 검사 우회, `main` 직접 푸시.

## 9. 공통 규칙

규칙은 3계층입니다. 1층 전역(`~/.claude/CLAUDE.md`, OpenCode는 `~/.config/opencode/AGENTS.md`로 같은 파일) → 2층 ryushin01 공통(`~/Documents/GitHub/CLAUDE.md`, Claude Code만 읽음) → 3층 이 파일. 충돌하면 이 파일이 우선합니다. 2층을 읽지 못하는 도구를 위해 핵심을 아래에 요약합니다.

- 답변·커밋·PR·문서·주석은 한국어로 씁니다.
- 허락을 묻지 않고 끝까지 진행한 뒤 한 번에 보고합니다. 비용이 드는 일, 비밀값 새로 만들기, 디자인 결정, 되돌리기 어려운 일, 다른 조직 저장소에 공개로 글 올리기는 진행 전에 보고하고 결정을 받습니다.
- 사용자의 진행 중 작업을 보호합니다. 커밋하지 않은 변경이 있으면 `git worktree add`로 따로 작업하고 끝나면 지웁니다.
- 다른 세션 공지는 ryushin01 그룹 세션에만 보냅니다(Etc 그룹·다른 계정 세션 제외).
