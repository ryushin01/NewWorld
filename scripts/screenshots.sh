#!/bin/zsh
# README 화면(docs/images/*.jpg)을 iOS 시뮬레이터에서 다시 찍습니다(데모 모드, 데모 데이터).
# 먼저 서버 연결 없이(.env.local 없이) Release 앱을 'NewWorld E2E' 시뮬레이터에 설치합니다: pnpm run test:e2e e2e/readme/demo-screens.yaml
# 사용: pnpm run screenshots   (SKIP_BUILD=1이면 이미 설치한 앱으로 바로 찍음)
# 계정이 필요한 화면(복구 코드, MY, 프로필 편집)은 데모 모드에서 이 기기 안에만 만드는 가상 계정(traveler)으로 찍습니다.
set -eu
cd "$(dirname "$0")/.."

if [ -z "${SKIP_BUILD:-}" ]; then
  zsh scripts/e2e-ios.sh e2e/readme/demo-screens.yaml
else
  SKIP_BUILD=1 zsh scripts/e2e-ios.sh e2e/readme/demo-screens.yaml
fi
# 현장 인증을 한 뒤 여권 첫 화면을 찍습니다.
SKIP_BUILD=1 zsh scripts/e2e-ios.sh e2e/checkin-flow.yaml
SKIP_BUILD=1 zsh scripts/e2e-ios.sh e2e/readme/passport.yaml
# 가입 직후 복구 코드, MY, 프로필 편집, 도착 알림 안내 창을 찍습니다.
SKIP_BUILD=1 zsh scripts/e2e-ios.sh e2e/readme/account-screens.yaml

# Maestro는 ~/.maestro/tests/<시각>/<흐름>/takeScreenshot에 PNG를 남깁니다. 가장 최근 것을 JPG(506×1100)로 옮깁니다.
latest() { ls -t ~/.maestro/tests/*/*/takeScreenshot/"$1".png | head -1; }
for name in real fantasy destination lore record-form checklist stats recovery my profile-edit arrival; do
  sips -s format jpeg -s formatOptions 82 -z 1100 506 "$(latest "$name")" --out "docs/images/$name.jpg" > /dev/null
done
sips -s format jpeg -s formatOptions 82 -z 1100 506 "$(latest checkin-celebration)" --out docs/images/checkin.jpg > /dev/null
sips -s format jpeg -s formatOptions 82 -z 1100 506 "$(latest map-verified)" --out docs/images/map.jpg > /dev/null
sips -s format jpeg -s formatOptions 82 -z 1100 506 "$(latest badges)" --out docs/images/badges.jpg > /dev/null
echo "docs/images를 갱신했습니다."
