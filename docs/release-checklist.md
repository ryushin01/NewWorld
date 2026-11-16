# 출시 체크리스트

스토어에 처음 올릴 때 확인할 것들입니다. 코드로 준비된 것은 ✅, 출시하는 사람이 할 일은 ☐입니다. 비용이 드는 항목은 따로 표시했습니다.

## 서버 (Supabase)

- ☐ 활성 프로젝트 슬롯 확보: 무료 플랜은 활성 프로젝트 2개까지라 `newworld`는 지금 일시 중지 상태입니다(유료 Pro는 월 약 25달러부터).
- ☐ 마이그레이션·설정·함수 올리기: [개발 가이드의 서버 적용 현황](development.md#서버-적용-현황) 순서대로 `db push --remote`(CLI 3부터 `--remote`가 없으면 로컬 DB에 적용), `config push`(메일 인증 끄기, 비밀번호 8자 이상), `functions deploy`
- ☐ 장소 검색: Photon 공개 서버는 사용량 보장이 없습니다. 이용자가 많으면 자체 서버나 유료 지오코더로 바꿉니다(비용).
- ☐ 날씨: Open-Meteo 무료 API는 비상업 조건입니다. 상업적으로 쓰면 요금제를 확인합니다(비용).
- ✅ 목록 1,000건 상한, 입력 길이 상한(DB 제약), 계정 삭제 시 사진·프로필 사진 삭제, 비밀번호를 바꾸면 다른 기기 로그인 끊기

## 빌드 (EAS)

- ☐ EAS 환경 변수: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_MAPS_ANDROID_API_KEY`(Android 지도), `EXPO_PUBLIC_SENTRY_DSN`(오류 모니터링, 선택)
- ☐ `npx eas-cli@latest build --profile production --platform all` 뒤 `submit`. 버전 번호는 `app.config.ts`의 `version`, 빌드 번호는 EAS가 올립니다(`autoIncrement`).
- ✅ iOS 수출 규정 답변(`ITSAppUsesNonExemptEncryption: false`), 위치·사진·카메라 권한 문구, 원격 푸시 권한 없음(로컬 알림만)

## App Store

- ☐ Apple Developer Program 가입(연 99달러)
- ☐ 개인정보 처리방침 주소: 앱의 MY → 개인정보 처리방침이 여는 [docs/privacy-policy.md](privacy-policy.md)입니다. `[ ]` 항목(운영자, 연락처, 시행일, 서버 지역)을 채우고 법률 검토를 받습니다.
- ☐ 앱 개인정보 라벨(App Store Connect): 처리방침과 같게 적습니다.
  - 연결됨·앱 기능: 사용자 ID(아이디), 이름(닉네임·본명), 사진, 정확한 위치(현장 인증한 순간의 위치), 기타 사용자 콘텐츠(기록·메모·체크리스트)
  - 연결 안 됨·앱 기능(Sentry를 켠 경우): 충돌·성능 외 진단 데이터(오류 내용)
  - 추적 없음
- ☐ 심사 메모: 백그라운드 위치는 '근처 여행지 도착 알림'에만 쓰고(사용자가 MY에서 켬) 위치를 기기 밖으로 보내지 않는다는 설명, 심사용 계정(서버 모드에서 미리 만든 아이디·비밀번호)
- ☐ 스크린샷: `pnpm run screenshots`로 찍은 화면은 데모 모드입니다. 스토어 규격(6.9인치 등)에 맞춰 다시 찍습니다.
- ✅ 앱 안에서 계정 삭제(MY → 계정 삭제), 앱 안에서 처리방침 열기

## Google Play

- ☐ 개발자 등록(1회 25달러)
- ☐ 데이터 보안 양식: 위 개인정보 라벨과 같은 내용
- ☐ 백그라운드 위치 권한 선언: 기능 설명과 시연 영상(도착 알림을 켜고 근처에 도착해 알림을 받는 장면)이 필요합니다.
- ☐ Google 지도 API 키(Maps SDK for Android, 지도 표시는 무료지만 결제 계정 필요)
- ✅ 도착 알림 전용 채널(`arrival`), 예측 뒤로 가기 끔

## 출시 뒤

- ☐ Sentry DSN을 넣었다면 첫 오류가 들어오는지 확인하고, 소스 맵 올리기를 켭니다([개발 가이드](development.md#오류-모니터링-sentry)).
- ☐ 정기 백업(무료 플랜은 일일 백업이 없음): [개발 가이드의 백업과 복원](development.md#백업과-복원)대로 데이터(`db dump --data-only`)와 사진 버킷(`storage cp -r`)을 받고, 날짜·보관 위치·그때의 마지막 마이그레이션을 적어 둡니다. `db dump`의 기본값은 스키마만 담고, 스키마·정책·버킷·함수·인증 설정은 저장소의 `supabase/`가 원본입니다.
- ☐ 복원 연습: 빈 프로젝트에 한 번 되돌려 보고 막힌 곳을 개발 가이드에 고칩니다. 되돌려 보지 않은 백업은 믿을 수 없습니다.
