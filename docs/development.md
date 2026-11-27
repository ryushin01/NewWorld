# 개발 가이드

## 요구 사항

- Node.js 24(`.nvmrc`), pnpm
- iOS: Xcode, CocoaPods
- Android: Android Studio, JDK(`JAVA_HOME`에 Android Studio의 `jbr` 경로 지정)

## 실행

```bash
pnpm install
pnpm run ios       # 또는 pnpm run android
```

`app.config.ts`(아이콘·스플래시·권한·플러그인)를 바꾸면 `npx expo prebuild`로 네이티브 폴더에 반영합니다. 이미 있는 `ios/`·`android/`에는 `expo run:*`가 변경을 다시 반영하지 않습니다. Expo CLI 58의 `prebuild`는 기본으로 폴더를 지우고 새로 만들어 Pods·빌드 캐시도 사라지므로, 빌드 캐시를 살리려면 `--no-clean`을 붙입니다(E2E 스크립트는 빌드 전에 `prebuild --no-clean`을 돌림).

Expo 패키지를 올린 뒤(`npx expo install --fix` 등) 이미 있는 `ios/`로 빌드하면, `ios/Podfile.lock`이 옛 판을 고정하고 있어 `pod install`이 `CocoaPods could not find compatible versions for pod "ExpoModulesWorklets"`(또는 `ExpoModulesCore`)로 멈출 수 있습니다. `cd ios && pod update --no-repo-update`로 pod을 다시 풀고 빌드합니다. EAS 빌드는 네이티브 폴더를 새로 만들어 이 문제가 없습니다.

`.env`가 없으면 가상 데이터로 동작하는 **데모 모드**로 실행됩니다. 로그인 화면의 `둘러보기` 버튼(아이디 `guest`)으로 바로 들어가거나 아이디로 가입할 수 있습니다. 가입한 계정의 비밀번호는 솔트를 붙인 SHA-256 해시로만 기기에 저장하고, 변경 내용도 기기에 저장됩니다. MY의 계정 삭제를 누르면 예시 데이터로 되돌아갑니다.

## 환경 변수

`.env.example`을 `.env`로 복사해 채웁니다.

| 변수                                                        | 용도                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 서버 연결. 없으면 데모 모드입니다.                    |
| `GOOGLE_MAPS_ANDROID_API_KEY`                               | Android 지도. iOS는 Apple 지도를 써서 필요 없습니다.  |
| `EXPO_PUBLIC_SENTRY_DSN`                                    | 오류 모니터링(Sentry). 없으면 오류를 보내지 않습니다. |

### 오류 모니터링 (Sentry)

- `src/_app/monitoring.ts`가 앱을 열 때 가장 먼저 Sentry를 시작합니다. DSN이 없으면 아무것도 하지 않습니다.
- 화면 오류(루트 `ErrorBoundary`)와 처리하지 않은 오류를 보냅니다. 아이디·IP(`sendDefaultPii`), 화면 캡처, 뷰 구조, 실패한 요청은 보내지 않고, 콘솔 기록은 버리며 요청 주소의 쿼리(서명 토큰)는 지웁니다. 성능 추적은 끕니다.
- 켜려면 Sentry 무료 플랜에서 React Native 프로젝트를 만들고 DSN을 EAS 환경 변수 `EXPO_PUBLIC_SENTRY_DSN`에 넣은 뒤 다시 빌드합니다.
- 지금은 소스 맵을 올리지 않아 Release 오류의 위치가 번들 기준으로 보입니다. 원래 코드 위치로 보려면 config plugin(`@sentry/react-native/expo`)과 `getSentryExpoConfig`(Metro)를 더하고, EAS에 `SENTRY_AUTH_TOKEN`을 넣고, `pnpm-workspace.yaml`의 `@sentry/cli`를 `true`로 바꿉니다.

장소 검색은 Edge Function에서 OpenStreetMap 기반 [Photon](https://photon.komoot.io/) 공개 서버를 호출하므로 별도 키가 필요 없습니다. 공개 서버는 사용량 보장이 없고 한국어 지명은 잘 찾지 못하므로, 공개 배포 전에 자체 서버나 유료 지오코더로 바꿉니다. 공용 Nominatim은 Supabase Edge의 접속을 403으로 차단합니다.

## 서버 준비 (Supabase)

> **주의:** `20261108000000_ruins_travel.sql`은 이전 낚시·맛집 기록의 전용 칸을 삭제하며 되돌릴 수 없습니다. 기존 데이터가 있는 서버는 [백업과 복원](#백업과-복원)대로 받은 뒤 `db push`를 실행합니다.

```bash
npx supabase login
npx supabase link --project-ref <프로젝트 ID>
npx supabase db push --remote   # CLI 3부터 --remote가 없으면 로컬 DB에 적용합니다.
npx supabase config push   # 메일 인증 끄기(아이디 가입) 등 인증 설정을 올립니다.
npx supabase functions deploy place-search
npx supabase functions deploy delete-account
npx supabase functions deploy recover-account
```

| 구성   | 내용                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 테이블 | `places`, `records`, `record_photos`, `checklist_items`, `trips`, `checkins`, `profiles`, 요약 뷰 `place_summaries`                            |
| 저장소 | 비공개 버킷 `record-photos`, 경로 `{user_id}/{record_id}/{파일}`                                                                               |
| 권한   | 모든 테이블과 저장소에 RLS를 적용해 본인 데이터만 접근합니다.                                                                                  |
| 함수   | `place-search`(주소·장소 검색, 좌표→주소), `delete-account`(계정, 기록 사진, 프로필 사진 삭제), `recover-account`(복구 코드로 비밀번호 재설정) |

- Supabase API는 한 번에 1,000행까지만 돌려주므로 목록 조회와 계정 삭제의 사진 조회는 1,000행씩 끝까지 읽습니다(`src/shared/api/pages.ts`, Edge Function은 `delete-account/pages.ts`).
- 입력 길이 상한은 앱 검증(`src/shared/config`의 `LIMITS`)과 DB 제약(`20261116000000_input_limits.sql`)이 같은 값입니다. 바꿀 때는 둘을 함께 고칩니다.

## 오프라인 동작

`shared/api/offline-backend.ts`가 서버 백엔드를 감쌉니다.

- 쓰기는 큐에 넣고 순서대로 보냅니다. 오프라인에 만든 장소에 붙인 기록도 순서가 지켜집니다.
- 저장 ID는 앱이 만들고 서버는 같은 ID를 덮어쓰므로, 응답을 받기 전에 끊겨 다시 보내도 중복되지 않습니다.
- 첨부 사진은 업로드 전까지 문서 폴더에 복사해 둡니다.
- 연결 오류는 대기로 남기고, 서버가 거절한 저장은 입력 화면에 오류를 보여 줍니다. 백그라운드 전송 중 거절되면 동기화 화면에서 다시 시도하거나 버릴 수 있습니다.
- 같은 항목을 여러 기기에서 고치면 나중에 도착한 쪽이 남습니다.
- 대기 변경과 마지막 서버 값은 계정별 키로 보관합니다. 로그아웃하면 서버 값 사본만 지웁니다.
- 데모 모드는 MY 페이지의 `데모 모드 연결 끊기`로 끊긴 상태를 재현합니다.

데모 모드(`.env` 없음, 웹 데모는 늘 데모 모드)는 서버 없이 기기 저장소의 가상 데이터로 돌아 인터넷이 끊겨도 모든 화면이 내용과 함께 뜹니다. 여행지 사진·글꼴·아이콘은 앱 번들에 들어 있고, 장소 검색·주소 찾기도 데모 백엔드가 기기 안에서 합니다. 네트워크가 필요한 것은 기록 화면의 날씨 채우기 버튼(Open-Meteo, 실패하면 "날씨를 불러오지 못했습니다" 안내 뒤 직접 입력), Sentry(DSN이 있을 때만, 실패해도 조용히 넘어감), 앱의 지도 타일(웹 데모는 지도 자리에 안내)뿐입니다.

`pnpm run test:web`은 웹 데모를 `/` 경로로 빌드해 `scripts/serve-web.mjs`로 띄우고(GitHub Pages처럼 없는 경로는 `404.html`이 같은 앱을 줌. `expo serve`는 하위 경로를 바로 열면 Not Found), localhost 밖 요청을 모두 막은 상태에서 봅니다(`e2e/web/offline.spec.ts`, CI의 `web-offline` 작업).

- 둘러보기 → 실존·환상·지도·기록·MY 탭
- 모든 경로를 주소로 바로 열기: 여행지 상세(실존·환상), 코스, 연대표, 여권(스탬프·뱃지), 내 여행지·장소 상세·수정·추가, 지도에서 설정, 기록 상세·수정·추가, 여정 목록·추가, 검색, 통계, 체크리스트, 동기화, 프로필 편집, 비밀번호·복구 코드
- 주요 상태: 날씨 불러오기 실패 안내("날씨를 불러오지 못했습니다", 입력칸은 그대로), 기기 안 장소 검색 결과, 데모 현장 인증 → 여권 스탬프, 코스로 여정 만들기 → 저장 → 여정 상세, 엽서 미리보기
- 화면마다 데모 데이터가 보이는지, axe(WCAG 2.2 AA) 위반, 페이지 오류, 외부 요청(사용자가 누른 날씨 요청 말고는 없어야 함)

어드민도 같은 방식으로 모든 화면(대시보드·목록·상세·추가·수정·없는 화면)을 외부 요청 없이 주소로 바로 열어 axe를 봅니다(`apps/admin/e2e/admin.spec.ts`). 로컬에서 웹 데모를 보려면 `EXPO_WEB_BASE_URL= pnpm run build:web && pnpm run serve:web`. 처음 한 번은 `pnpm exec playwright install chromium`이 필요합니다. 알고 있지만 아직 고치지 않은 접근성 문제(expo-image의 웹 `<img>` alt, 바텀 시트의 `role="slider"`, 카드 레이블이 보이는 글자를 그대로 담지 않음)는 테스트 파일의 목록으로 빼 두었습니다.

기기에 저장된 값(보낼함, 스냅숏, 마지막 세션, 도착 알림 기록)은 `src/shared/lib/stored-json.ts`의 `parseStoredJson`·`isRecord`로 읽습니다. 보낼함은 작업 종류마다 필요한 내용이 있는 작업만, 스냅숏은 원소 모양까지 맞는 칸만 쓰고 나머지는 서버에서 다시 받습니다. 저장값이 깨져도 로그인(오프라인으로 앱 열기)이 막히지 않게 하기 위해서입니다.

## 외부 데이터

| 항목       | 출처                                  | 비고                                                                                                                          |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 날씨, 기온 | [Open-Meteo](https://open-meteo.com/) | API 키가 없습니다. 버튼을 누를 때만 장소 좌표를 보냅니다. 무료 API는 비상업 용도 조건이므로 상용 배포 전 요금제를 확인합니다. |

## 테스트

| 명령                                            | 내용                                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm test`                                     | 단위·컴포넌트 테스트 (Jest, React Native Testing Library)                                            |
| `pnpm run test:db`                              | 마이그레이션을 PGlite에 적용해 RLS와 제약 조건 검사                                                  |
| `pnpm run typecheck:functions`                  | Edge Function을 Node의 supabase-js 타입으로 검사(Deno 없이, `supabase/functions/tsconfig.json`)      |
| `pnpm run test:e2e`                             | Maestro E2E. 전용 시뮬레이터 `NewWorld E2E`에 데모 모드 Release 앱을 설치해 실행합니다. 아래 참고    |
| `pnpm run test:e2e:server`                      | 로컬 Supabase에 연결한 Release 앱으로 가입부터 계정 삭제까지 검사합니다. 아래 참고                   |
| `pnpm run test:web`                             | 웹 데모를 빌드해 외부 요청을 모두 막고 모든 탭과 axe를 검사합니다(Playwright). 위 오프라인 동작 참고 |
| `EXPO_PUBLIC_STORYBOOK_ENABLED=true pnpm start` | 앱에서 `/storybook` 경로로 컴포넌트 카탈로그 확인                                                    |

### E2E 전용 시뮬레이터

E2E 흐름은 시작할 때 앱 데이터를 지우므로, 평소 쓰는 시뮬레이터의 계정과 기록을 지우지 않도록 `scripts/e2e-ios.sh`가 전용 시뮬레이터에서만 돌립니다.

- `NewWorld E2E`(iPhone 17 Pro) 시뮬레이터가 없으면 만들고 켭니다. iOS 27 시뮬레이터는 지역 감시를 지원하지 않아(도착 알림이 `ERR_GEOFENCING_UNAVAILABLE`로 실패) iOS 26 중 가장 최신을 고르고, iOS 26이 없으면 설치 안내와 함께 멈춥니다. 다른 버전은 `E2E_RUNTIME`으로 지정하며, 버전마다 따로 만들어 씁니다.
- Maestro에 필요한 Java가 시스템에 없으면 Homebrew `openjdk`나 Android Studio의 JBR을 씁니다.
- Release 앱을 빌드해 설치하고 위치 권한(항상 허용)을 준 뒤 Maestro를 그 기기에서만 실행합니다.
- 흐름 하나만: `pnpm run test:e2e e2e/checkin-flow.yaml` · 빌드 없이: `SKIP_BUILD=1 pnpm run test:e2e`
- 서버 E2E도 같은 기기 ID(스크립트가 출력)를 `DEVICE`로 넘겨 돌립니다.

### 실제 서버 경로 검사

Docker와 Supabase CLI로 로컬 서버를 띄우고 그 주소로 앱을 빌드합니다. 메일은 로컬 Mailpit에서 읽습니다.

```bash
supabase start
supabase migration up --local   # 이미 만든 로컬 DB에 새 마이그레이션을 적용합니다.
# EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 과 anon 키로 iOS Release 빌드 후 시뮬레이터에 설치
DEVICE=<시뮬레이터 ID> pnpm run test:e2e:server
```

아이디 가입과 프로필 생성, 복구 코드로 재설정, 로그인, 장소·사진·기록·체크리스트 저장, 서버 중단 중 재시작과 저장, 복구 후 업로드, MY의 비밀번호 변경, 계정 삭제를 앱에서 실행하고 DB와 저장소 내용을 직접 조회해 확인합니다. 토큰 만료까지 시험하려면 `auth.jwt_expiry`를 잠시 낮추고 `TOKEN_WAIT`(초)를 지정합니다.

- 서버 E2E의 테스트 아이디는 `ACCOUNT_ID` 변수에 둡니다. zsh의 `USERNAME`은 로그인 사용자 이름을 담는 특수 변수라 바꿀 수 없습니다.
- iOS 시뮬레이터에서는 새 비밀번호 칸을 채운 뒤 자동 완성이 초점을 붙잡아 아래 칸을 누를 수 없을 때가 있어, 폼은 키보드의 다음 키(`pressKey: Enter`)로 칸을 옮깁니다.

## 배포

`eas.json`에 `development`, `preview`, `production` 프로필이 있습니다.

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

Supabase와 Google 지도 값은 EAS 환경 변수에 등록합니다.

### 웹 데모 (GitHub Pages)

https://ryushin01.github.io/NewWorld/ 에 데모 모드 웹 앱을 올립니다. `main`에 앱 코드·에셋·설정이 바뀌어 올라오면 `.github/workflows/deploy-web.yml`이 `pnpm run build:web`으로 만들어 Pages(원본: GitHub Actions)에 배포합니다. 비밀 값은 쓰지 않습니다.

```bash
pnpm run build:web                      # dist/, 경로 /NewWorld
EXPO_WEB_BASE_URL= pnpm run build:web   # 로컬에서 / 경로로 확인
npx serve -s dist                       # / 경로로 만든 dist를 열어 보기
```

- `scripts/build-web.mjs`는 `.env`를 읽지 않고(`EXPO_NO_DOTENV`) Supabase 값을 지운 채 `expo export --platform web`을 돌려 늘 데모 모드로 만듭니다. `index.html`의 언어를 `ko`로 바꾸고, 넓은 화면에서 휴대폰 폭으로 가운데에 두는 스타일을 넣고, 같은 파일을 `404.html`로 복사해 새로고침이나 직접 연 하위 경로(`/NewWorld/destination/avalon`)도 열리게 합니다. Pages는 이때 상태 코드 404로 앱을 주므로 검색 엔진은 첫 화면만 색인합니다.
- 검색·공유 정보도 같은 스크립트가 만듭니다: `index.html`에 한국어 제목·설명, `canonical`, Open Graph·Twitter 카드, JSON-LD `SoftwareApplication`, `<noscript>` 안내를 넣고, `dist/`에 `sitemap.xml`(첫 화면만)과 `og-image.png`(1200×630, `assets/icon.png`에서 sharp로 생성)를 만듭니다. 주소는 늘 운영 주소이고(`SITE_URL`로 바꿀 수 있음) 외부 요청은 없습니다. 하위 경로 사이트라 루트 `robots.txt`는 둘 수 없어 만들지 않습니다. `e2e/web/seo.spec.ts`가 산출물을 검사합니다.
- `app.config.ts`는 `EXPO_WEB_BASE_URL`이 있을 때만 `experiments.baseUrl`을 붙입니다. iOS·Android 빌드에는 영향이 없습니다.
- 웹에서만 바꿔 쓰는 것:

| 대상                 | 웹에서                                                                                                                       | 위치                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Tamagui 컴파일러     | 건너뜀. 실행 중에 스타일을 넣습니다(iOS 번들은 이전 설정과 바이트 단위로 같음을 확인)                                        | `metro.config.js`, `metro.transformer.js`                                   |
| `react-native-maps`  | 지도 자리에 안내를 두는 대체 모듈                                                                                            | `src/shared/ui/react-native-maps.web.tsx`                                   |
| 접근성 속성          | `Touchable`·`AppText`·`Field`의 `accessibility*`를 `role`·`aria-*`로 바꾸고, Tab 초점·Enter·Space·`:focus-visible` 표시를 줌 | `src/shared/ui/web-a11y.ts`, `pressable.tsx`, `typography.tsx`, `field.tsx` |
| `Alert.alert`        | react-native-web에서는 아무것도 하지 않아 브라우저 `alert`·`confirm`으로                                                     | `src/shared/lib/web-alert.ts`                                               |
| 저장소(MMKV)         | 키체인이 없어 암호화하지 않고 브라우저 저장소에                                                                              | `src/shared/lib/storage.ts`                                                 |
| 사진 보관            | 파일 폴더 대신 data URL로 브라우저 저장소에(한도를 넘으면 메모리)                                                            | `src/shared/lib/photo.web.ts`                                               |
| 이미지 공유·내보내기 | 화면 찍기는 `html2canvas-pro`로, 브라우저 공유 창이 파일을 받으면 그것으로, 아니면 내려받기                                  | `use-capture-share.ts`, `web-download.ts`, `use-export-data.ts`             |
| 도착 알림            | 지역 감시가 없어 권한을 묻기 전에 앱에서만 된다고 알림                                                                       | `arrival-alert-switch.tsx`                                                  |
| 인터넷 확인(NetInfo) | 사이트 맨 위(`/`)를 요청해 Pages에서 404가 나므로 끄고 브라우저의 온라인 상태만 씀                                           | `src/_app/query-client.ts`                                                  |

README의 [웹 데모 화면](../README.md#웹-데모-화면)(`docs/images/web-*.jpg`)은 배포된 데모를 브라우저 402×874, 픽셀 배율 2로 찍어 iOS 화면과 같은 506×1100 JPG로 줄인 것입니다. `pnpm run screenshots`는 iOS 화면만 다시 찍으므로, 웹 화면이 바뀌면 같은 크기로 직접 다시 찍습니다.

## 구조 규칙

Feature-Sliced Design을 따릅니다. `src/app`은 Expo Router 경로이며 `src/_pages`를 다시 내보내기만 합니다.

## 디자인 기준

실존은 사암색, 환상은 보라색으로 구분합니다. 하단 탭(실존·환상·지도·기록·MY), 사진 중심 카드, 지도 위 둥근 바텀시트, 하단 전폭 버튼, 얇은 선 아이콘을 사용합니다.

아이콘(Lucide)은 `src/shared/ui/icons.ts`에서 하나씩 가져와 `@/shared/ui`로 씁니다. 패키지 입구(`lucide-react-native`)에서 가져오면 아이콘 4,712개가 모두 번들에 들어가므로(약 2.1MB) ESLint가 막습니다. 새 아이콘은 `icons.ts`에 한 줄 더합니다. 글꼴 패키지도 같은 이유로 굵기 경로(`/400Regular`)에서 가져옵니다.

| 토큰        | 값        | 용도                                                    |
| ----------- | --------- | ------------------------------------------------------- |
| `brand`     | `#c2792b` | 실존 유적 면, 아이콘. 작은 글자에는 쓰지 않습니다.      |
| `brandText` | `#85491a` | 강조 글자, 링크                                         |
| `ink`       | `#2a2233` | 제목, 주요 버튼                                         |
| `fantasy`   | `#7a5af8` | 환상 세계 면. 글자는 `fantasyText`(`#5b3fd1`)를 씁니다. |

## 의존성 갱신 (Dependabot)

`.github/dependabot.yml`이 npm 패키지를 매주 확인해 부 버전·패치를 한 PR로 묶고, GitHub Actions는 매달 올립니다.

Expo SDK가 버전을 정하는 패키지(`expo*`, `react`, `react-native*`, `@react-native-*`, `@shopify/flash-list`)는 Dependabot에서 뺐습니다. Dependabot이 올리면 SDK 권장 버전과 어긋나 네이티브 빌드나 Expo Go에서 깨질 수 있고, CI는 네이티브 빌드를 하지 않아 이를 잡지 못합니다. 이 패키지들은 `npx expo install --fix`(SDK를 올릴 때는 `npx expo install expo@^새버전 --fix`)로만 올리고 `npx expo install --check`로 확인합니다.

저장소는 공개된 지 하루가 안 된 패키지를 받지 않습니다(`minimumReleaseAge`). `expo install`이 갓 나온 판을 고르면 설치가 멈추므로 하루 기다린 뒤 다시 실행합니다.

### 고쳐 쓰는 패키지 (`patches/`)

`pnpm-workspace.yaml`의 `patchedDependencies`에 적힌 패키지는 설치할 때 `patches/`의 수정을 덧씌웁니다.

| 패키지                           | 고친 것                                            | 이유                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-image-manipulator@58.0.16` | iOS 처리 우선순위 `.background` → `.userInitiated` | 사진 저장처럼 사용자가 기다리는 작업인데 가장 낮은 우선순위로 돌아, 기기가 바쁠 때 HEIC 사진 한 장을 줄이는 데 몇 분씩 걸렸습니다(같은 시뮬레이터에서 0.35초 대 29초, 부하가 더 높을 때 7분). Android는 해당 없음 |

Expo SDK 58은 iOS에서 Expo 모듈을 미리 컴파일한 XCFramework로 링크합니다. 그래서 소스를 고친 패키지는 `package.json`의 `expo.autolinking.ios.buildFromSource`에도 넣어 소스로 빌드합니다. 빠뜨리면 설치된 소스에는 패치가 보여도 앱에는 원래 코드가 들어갑니다(빌드 기록에 `Switch <모듈> XCFramework`가 보이면 미리 컴파일한 것을 쓴 것입니다). 이 설정을 바꾼 뒤에는 `pod install`을 다시 합니다.

패치는 정확한 버전에만 걸립니다. 그 패키지를 올리면 pnpm이 쓰이지 않는 패치라며 설치를 멈추므로, 새 버전에서도 같은 문제가 있는지 확인한 뒤 `pnpm patch <패키지>@<새 버전>`으로 다시 만들거나(`pnpm patch-commit`) 고쳐졌으면 `patchedDependencies` 줄과 패치 파일을 지웁니다.

## 빌드 주의 사항

- 가입 화면의 비밀번호 칸은 iOS에서 `textContentType="oneTimeCode"`입니다. `newPassword`나 `password`로 두면 비밀번호 칸이 둘인 화면에서 강력한 암호 시트가 입력 중에 다시 떠 글자 입력이 끊겼습니다(iOS 27 시뮬레이터 기준).

- E2E는 Release 빌드로 실행합니다. R8 코드 축소나 키체인 권한 같은 문제는 Debug 빌드에서 드러나지 않습니다.
- Android는 `GOOGLE_MAPS_ANDROID_API_KEY` 없이 빌드하면 지도 자리에 안내 문구가 나옵니다. 키를 추가한 뒤에는 다시 빌드합니다.

## 글꼴

| 역할        | 글꼴                                                                                         | 적용                                |
| ----------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| 제목        | NewWorld Title: 한글재민체 3.0, 빠진 한글은 유앤피플 고딕 UNI(`assets/fonts/newworld-title`) | `AppText`의 `title`·`headline` 크기 |
| 본문        | 유앤피플 고딕 UNI(`assets/fonts/unpeople-gothic`)                                            | `AppText`의 나머지 크기             |
| 굵은 본문   | NewWorld Title                                                                               | `AppText`의 `bold`                  |
| 영문 원어명 | Sorts Mill Goudy(`@expo-google-fonts/sorts-mill-goudy/400Regular`)                           | `AppText`의 `latin`                 |

- 한글재민체 3.0(공유마당, OFL)은 한글 11,172자에 번호를 매겼지만 실제로 그린 한글은 2,350자이고 나머지는 빈칸입니다. React Native에는 글꼴 대체 목록이 없어 빈칸이 그대로 보이므로, 그린 글자만 남기고 빠진 한글은 유앤피플 고딕 UNI로 채워 한 파일로 합쳤습니다. 한자는 앱에 쓰지 않아 뺐습니다. 다시 만들 때는 공유마당 원본 두 개로 `python3 scripts/fonts/build-title-font.py`를 실행합니다(fontTools 필요).
- 유앤피플 고딕 UNI(공유마당, OFL)는 한글 11,172자를 모두 그린 공식 배포 TTF에서 화면 표시에 쓰지 않는 TrueType 힌팅과 닿을 수 없는 글리프만 뺐습니다(2.5MB → 1.2MB). 글자 범위·모양·간격(`kern` 표 포함)은 원본과 같고, 다시 만들 때는 공유마당 원본으로 `python3 scripts/fonts/build-body-font.py`를 실행합니다(fontTools 필요). 사용자가 쓰는 닉네임·여행기 글자도 빈칸 없이 그립니다.
- 두 글꼴 모두 굵기가 하나라 `fontWeight`를 더하지 않습니다(iOS는 없는 굵기를 만들지 않고, Android는 가짜로 굵게 그림). 굵은 본문은 제목 글꼴로 구분합니다.
- `useAppFonts`(`src/shared/ui/fonts.ts`)로 불러오고, 끝날 때까지 스플래시를 유지합니다. 실패하면 시스템 글꼴로 계속합니다.
- 웹 데모에서 가로 배치·여백·색이 빠지던 원인은 Tamagui 컴파일러였습니다. 웹에서 정적 스타일을 클래스 이름으로 바꾸지만 그 CSS가 Expo 웹 번들에 실리지 않았습니다. 웹 번들만 컴파일러를 건너뜁니다(아래 [웹 데모](#웹-데모-github-pages)).

## 여행지 도감 자료

여행지는 `src/entities/destination/model/`에 앱과 함께 묶여 있어 오프라인에서도 보입니다.

- 소개글은 나무위키와 위키백과에서 사실을 확인해 새로 쓴 요약입니다. 나무위키 본문은 CC BY-NC-SA 2.0 KR이므로 그대로 옮기지 않습니다. 각 여행지 화면 아래에 출처 링크가 있습니다.
- 사진은 위키미디어 공용의 Public domain, CC0, CC BY, CC BY-SA 파일만 800px로 줄인 뒤 WebP(품질 80, `cwebp -q 80 -metadata none`)로 바꿔 `assets/destinations/`에 넣고, 저작자·라이선스·원본 링크를 `images.ts`에 함께 둡니다.
- 환상 세계의 좌표는 실제 위치가 아니라 전승과 이어진 현실의 장소이며, 화면의 `locationNote`로 알립니다.
- 입장 조건과 여행경보는 자주 바뀌므로 단정하지 않고 공식 안내를 확인하도록 안내합니다.
- 분류(`lore`)는 환상 세계가 `myth`(신과 창세·낙원·저승)·`legend`(영웅, 사라진 도시, 민간 전승, 문학), 실존 유적이 `history`(신화·전설이 얽힌 곳, `loreNote`에 근거 한 줄)·`fact`입니다.
- 전설과 실제 장소의 연결은 `links.ts`, 코스는 `courses.ts`, 연대표 정렬은 `timeline.ts`, 원전 링크는 `reading.ts`에 있습니다.

## 계정과 프로필

- 가입과 로그인은 이메일 없이 아이디(영문 소문자·숫자·밑줄 4~20자)와 비밀번호로 합니다. 대문자로 입력해도 소문자로 맞춥니다.
- Supabase Auth는 이메일이 필요하므로 앱이 아이디를 `{아이디}@users.newworld.app`로 바꿔 넘깁니다. 이 주소로는 메일을 보내지 않으므로 `supabase/config.toml`에서 메일 인증을 끕니다. 화면에는 보이지 않습니다.
- 메일이 없으므로 비밀번호를 잊었을 때는 **복구 코드**로 재설정합니다. 가입할 때 12자 코드(헷갈리는 0/O, 1/I/L 제외, `XXXX-XXXX-XXXX`)를 한 번만 보여 주고, 서버와 기기에는 SHA-256 해시만 저장합니다. 재설정에 쓴 코드는 버리고 새 코드를 보여 주며, MY의 `복구 코드 다시 발급`으로 지금 비밀번호를 확인한 뒤 바꿀 수 있습니다. 5번 틀리면 15분 동안 잠급니다.
- 서버에서는 코드 해시를 API에 노출되지 않는 `private.recovery_codes`에 둡니다. 앱은 `set_recovery_code`(본인 것만 저장)만 부를 수 있고, 확인과 교체(`verify_recovery_code`, `replace_recovery_code`)는 서비스 키로만 실행되며 Edge Function `recover-account`가 부릅니다.
- 로그인한 상태에서는 MY의 `비밀번호 변경`으로 지금 비밀번호를 확인한 뒤 바꿉니다.
- 비밀번호를 바꾸면 다른 기기의 로그인을 끊고(`signOut({ scope: 'others' })`), 복구 코드로 재설정하면 Edge Function이 그 계정의 모든 로그인을 끊은 뒤 앱이 새 비밀번호로 다시 로그인합니다. 서버의 최소 비밀번호 길이도 앱과 같은 8자입니다(`config.toml`).
- 프로필(`profiles`)은 닉네임(2~20자, 여권과 공유 이미지에 표시), 본명(선택, 본인만 봄), 프로필 사진(비공개 버킷 `avatars`, `{user_id}/{파일}`, 512px JPEG)입니다. 가입 메타데이터로 받은 닉네임과 본명으로 DB 트리거가 만듭니다.
- 데모 모드의 둘러보기 계정은 비밀번호가 없어 비밀번호 변경이 나오지 않습니다.

## 현장 인증과 뱃지

- 인증은 `features/check-in`이 위치 권한을 받아 현재 위치와 여행지 좌표의 거리를 재고, 3km(`CHECK_IN_RADIUS_KM`) 안이면 저장합니다. 환상 세계는 화면에 보여 주는 현실의 연고지 좌표를 씁니다.
- 회원마다 여행지 한 곳에 인증 하나만 남깁니다(`checkins`의 `unique(user_id, catalog_id)`). 다시 인증해도 처음 날짜가 유지됩니다.
- 데모 모드(`.env` 없음)에서는 위치 없이 인증하는 버튼이 따로 나오고, `method = 'demo'`로 저장해 화면에 '데모 인증'으로 표시합니다.
- 뱃지는 서버에 저장하지 않고 `features/badges`가 인증 목록으로 계산합니다. 신화 모험 뱃지는 `entities/destination/model/myth.ts`의 낙원·저승·신들의 거처 목록을 기준으로 셉니다(화면 분류에는 쓰지 않음). 조건을 채운 인증의 날짜가 획득일이며, 규칙을 바꾸면 기존 인증에도 바로 반영됩니다.
- 지도에서는 인증한 여행지를 체크가 붙은 핀(`assets/pins/*-verified.png`, `pnpm run assets`로 생성)으로 바꿔 색 없이도 구별합니다.
- 인증 후 축하 화면은 인증 전후 목록을 비교해 새로 받은 뱃지만 보여 줍니다(`widgets/check-in-panel`).
- E2E(`e2e/checkin-flow.yaml`)는 Maestro `setLocation`으로 시뮬레이터 위치를 글래스턴베리에 두고 아발론을 인증합니다.

## 근처 도착 알림

- MY의 `근처 여행지 도착 알림`으로 켭니다. 이유를 먼저 설명한 뒤 위치(사용 중 → 항상)와 알림 권한을 차례로 받습니다.
- `expo-location`의 지역 감시(geofencing)와 `expo-task-manager`의 백그라운드 작업(`features/arrival-alert/model/task.ts`, 루트 레이아웃에서 불러와 정의)을 씁니다. 위치는 기기 밖으로 보내지 않습니다.
- iOS는 앱 하나에 20곳까지 감시하므로 아직 인증하지 않은 가까운 여행지 19곳(반경 3km)과 현재 위치를 둘러싼 갱신 지역(반경 50km) 1곳을 등록합니다. 갱신 지역을 벗어나면 마지막으로 저장한 인증 목록으로 지역을 다시 고릅니다.
- 앱으로 돌아오거나 인증 목록이 바뀌어도 다시 고릅니다(`useArrivalSync`, 탭 레이아웃). 같은 곳은 12시간 안에 다시 알리지 않습니다.
- 알림은 원격 푸시 없이 기기에서 만드는 로컬 알림이며(`enableRemoteNotifications: false`), 누르면 `/destination/{id}`로 갑니다(`useNotificationLink`).
- Expo Go에서는 동작하지 않으므로 개발 빌드나 Release 빌드로 확인합니다.
- E2E(`e2e/arrival-flow.yaml`)는 서울에서 알림을 켜고 글래스턴베리로 옮겨 알림 센터 화면을 남깁니다. 실행 전 `xcrun simctl privacy booted grant location-always com.ryushin01.newworld`로 권한을 줍니다. Maestro는 시스템 화면의 글자를 읽거나 알림을 눌러 앱을 열지 못하므로, 알림을 눌러 이동하는 동작은 단위 테스트로 확인합니다. 지도 마커도 Maestro가 읽지 못해 화면으로 확인합니다.
- Android 11 이상은 '항상 허용'을 시스템 설정에서 바꿔야 해서, 에뮬레이터에서는 `adb shell pm grant com.ryushin01.newworld android.permission.ACCESS_BACKGROUND_LOCATION`(과 `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`)으로 권한을 준 뒤 `clearState` 없이 실행합니다. 도착 알림은 전용 채널 `arrival`(여행지 도착)로 보내 사용자가 따로 끌 수 있습니다.

## 서버 적용 현황

Supabase 프로젝트 `newworld`에는 `20261108000000`까지 적용되어 있습니다. 무료 플랜의 활성 프로젝트 한도 때문에 일시 중지한 상태이며, 앱은 `.env` 없이 데모 모드로 동작합니다. 다시 켜면 `npx supabase db push --remote`로 `20261109000000_trips_currency.sql`(통화, 여정)·`20261110000000_checkins.sql`(현장 인증)·`20261111000000_profiles.sql`(프로필)·`20261112000000_recovery_codes.sql`(복구 코드)·`20261116000000_input_limits.sql`(입력 길이 상한)·`20261127000000_admin.sql`(운영 어드민: 관리자·수록 표·신고)을 적용하고 `npx supabase config push`(메일 인증 끄기, 비밀번호 8자 이상), `npx supabase functions deploy delete-account recover-account`를 실행합니다. 이미 이메일로 가입한 계정은 이메일 앞부분이 아이디가 됩니다. 어드민 관리자는 SQL 편집기에서 `insert into private.admins (user_id) values ('<auth.users의 id>');`로 넣습니다.

## 백업과 복원

스키마, RLS 정책, 저장소 버킷과 그 정책, Edge Function, 인증 설정은 이 저장소의 `supabase/`가 원본입니다. 그래서 백업은 데이터와 사진 파일만 받습니다. Supabase CLI 3.1 기준으로 `db dump`의 기본값은 스키마만 담고(`--dry-run`으로 확인), `storage` 명령은 `--experimental`이 있어야 실행됩니다.

### 받기 (연결한 프로젝트)

```bash
npx supabase db dump --remote --data-only --use-copy -x storage.buckets -x storage.objects -f data.sql
npx supabase storage cp -r --remote --experimental ss:///record-photos backup/record-photos
npx supabase storage cp -r --remote --experimental ss:///avatars backup/avatars
```

- `data.sql`에는 앱 데이터(장소·기록·체크리스트·여정·현장 인증·프로필)와 계정(`auth`)이 들어갑니다. 버킷 행은 마이그레이션이 만들고 사진 목록 행(`storage.objects`)은 사진을 다시 올릴 때 새로 생기므로 뺍니다. 넣어 두면 되돌릴 때 같은 행이 겹쳐 멈춥니다.
- 사진 경로(`{user_id}/{record_id}/{파일}`)가 그대로여야 기록과 맞고 접근 정책(첫 폴더가 본인 ID)도 통합니다. `cp -r`은 경로를 그대로 둡니다.
- 데이터 덤프와 사진 복사 사이에 바뀐 사진은 서로 맞지 않습니다. 앱에는 점검 화면이 없으므로 이용이 적은 시간에 받고, 덤프 바로 뒤에 사진을 받습니다. 그사이 지운 사진은 되돌린 뒤 기록에는 남지만 파일이 없어 서명 주소가 비고(화면에 나오지 않음), 새로 올린 사진은 기록 없이 파일만 남습니다.
- 받은 날짜, 보관 위치, 그때 서버에 적용된 마지막 마이그레이션을 적어 둡니다. `npx supabase migration list --remote`에서 REMOTE 열이 채워진 마지막 줄입니다(아직 올리지 않은 로컬 파일도 함께 나오므로 맨 끝 줄이 아닐 수 있음). 덤프 전후에 한 번씩 실행해 같은지 보고, 그사이 마이그레이션이 올라갔으면 다시 받습니다. 되돌릴 때 이 마이그레이션까지의 스키마에 데이터를 넣습니다.

### 되돌리기 (새 프로젝트)

1. `npx supabase link --project-ref <새 프로젝트>`: 이후 명령이 모두 새 프로젝트로 갑니다.
2. 받을 때 적어 둔 마이그레이션까지만 올립니다. 그보다 새 파일을 `supabase/migrations`에서 잠시 다른 곳으로 옮기고 `npx supabase db push --remote`(`--remote`가 없으면 로컬 DB에 적용)를 실행합니다. 데이터는 받을 때와 같은 스키마에만 들어갑니다(예: 낚시·맛집 칸을 지우는 `20261108000000` 전에 받은 데이터는 지운 뒤의 스키마에 넣을 수 없음).
3. `psql --single-transaction --variable ON_ERROR_STOP=1 --command 'SET session_replication_role = replica' --file data.sql --dbname <새 DB 연결 문자열>`
4. 옮긴 파일을 원래 자리로 다시 옮기고 `npx supabase db push --remote`: 남은 마이그레이션이 되돌린 데이터 위에서 돌아, 칸 정리나 기존 계정의 프로필 만들기(`20261111000000`) 같은 데이터 변환도 함께 됩니다. 모든 마이그레이션을 먼저 올리면 프로필 만들기가 빈 계정 표를 읽고, 데이터를 넣을 때는 트리거가 꺼져 있어 되돌린 계정에 프로필이 생기지 않습니다.
5. `npx supabase config push`: 메일 인증 끄기, 비밀번호 8자 이상. 새 프로젝트는 메일 인증이 켜져 있어 아이디 가입이 막힙니다.
6. `npx supabase functions deploy`: 이름 없이 실행해 `place-search`·`delete-account`·`recover-account`를 모두 올립니다(기본 환경 변수만 써서 따로 넣을 비밀 값은 없음).
7. `npx supabase storage cp -r --remote --experimental backup/record-photos ss:///record-photos`(`avatars`도 같음)
8. 앱의 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY`(EAS 환경 변수)를 새 프로젝트 값으로 바꿔 다시 빌드합니다.

이 순서는 저장소 설정과 CLI 3.1.0의 동작으로 정리했고, 실제 프로젝트에 되돌려 보지는 않았습니다. 처음 되돌려 볼 때 막힌 곳을 이 절에 고칩니다. 일반적인 주의 사항은 [Supabase의 CLI 백업·복원 문서](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)에 있습니다.
