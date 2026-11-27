// 운영 어드민 빌드(apps/admin/dist)를 Lighthouse CI로 검사합니다.
// 결과는 공개 임시 저장소가 아니라 .lighthouseci/admin에만 남깁니다(upload.target=filesystem).
// Chrome은 Playwright가 받은 Chromium을 씁니다(처음 한 번 `pnpm exec playwright install chromium`).
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'lhci',
    'autorun',
    '--config=apps/admin/lighthouserc.json',
    '--upload.target=filesystem',
    '--upload.outputDir=.lighthouseci/admin',
  ],
  { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
);
process.exit(result.status ?? 1);
