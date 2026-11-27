// CI와 같은 검사를 한 명령으로 돌립니다. CI(.github/workflows/ci.yml)의 각 작업도 이 스크립트를 부릅니다.
// 사용: pnpm run check                 → 모든 묶음(verify → web → admin → storybook)
//       pnpm run check verify admin    → 고른 묶음만
// 처음 한 번은 pnpm exec playwright install chromium. 시각 회귀는 Linux(CI·Playwright Docker)에서만 비교합니다.
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const GROUPS = {
  verify: [
    ['서식(Prettier)', 'pnpm exec prettier --check .'],
    ['타입 검사(앱)', 'pnpm run typecheck'],
    ['타입 검사(Edge Function)', 'pnpm run typecheck:functions'],
    ['타입 검사(어드민)', 'pnpm run typecheck:admin'],
    ['린트', 'pnpm run lint'],
    ['단위·컴포넌트 테스트와 커버리지(Jest)', 'pnpm run test:coverage'],
    ['어드민 테스트와 커버리지(Vitest)', 'pnpm run test:admin:coverage'],
    ['커버리지 기준', 'pnpm run coverage:check'],
    ['DB 권한·제약·시드(PGlite)', 'pnpm run test:db'],
  ],
  web: [
    // E2E용 빌드(/ 경로) 하나를 번들 예산과 오프라인·SEO·시각 회귀 E2E가 함께 씁니다.
    ['웹 데모 빌드', 'node scripts/build-web.mjs', { EXPO_WEB_BASE_URL: '' }],
    ['웹 데모 번들 예산(size-limit)', 'pnpm run size:web'],
    [
      '웹 데모 E2E(오프라인·axe·SEO·시각 회귀)',
      'pnpm exec playwright test -c e2e/web/playwright.config.ts',
    ],
  ],
  admin: [
    // 빌드 하나를 E2E·시각 회귀·번들 예산·Lighthouse가 함께 씁니다.
    ['어드민 데모 빌드', 'pnpm run build:admin'],
    [
      '어드민 E2E(오프라인·axe·시각 회귀)',
      'pnpm exec playwright test -c apps/admin/e2e/playwright.config.ts',
    ],
    ['어드민 번들 예산(size-limit)', 'pnpm run size:admin'],
    ['어드민 Lighthouse', 'pnpm run lhci:admin'],
  ],
  storybook: [
    ['Storybook 빌드', 'pnpm run build:storybook'],
    ['Storybook 스토리 axe·시각 회귀', 'pnpm run test:storybook'],
  ],
};

const asked = process.argv.slice(2);
const unknown = asked.filter((name) => !(name in GROUPS));
if (unknown.length) {
  console.error(`모르는 묶음: ${unknown.join(', ')} (가능: ${Object.keys(GROUPS).join(', ')})`);
  process.exit(2);
}
const groups = asked.length ? asked : Object.keys(GROUPS);

const timings = [];
let failed = null;
outer: for (const group of groups) {
  for (const [name, command, env = {}] of GROUPS[group]) {
    console.log(`\n▶ [${group}] ${name}: ${command}`);
    const started = Date.now();
    const result = spawnSync(command, {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    const seconds = (Date.now() - started) / 1000;
    timings.push([group, name, seconds, result.status === 0]);
    if (result.status !== 0) {
      failed = `[${group}] ${name}`;
      break outer;
    }
  }
}

const table = [
  `### 검사 시간 (${groups.join(', ')})`,
  '',
  '| 묶음 | 단계 | 시간 | 결과 |',
  '| --- | --- | --- | --- |',
  ...timings.map(
    ([group, name, seconds, ok]) =>
      `| ${group} | ${name} | ${seconds.toFixed(1)}초 | ${ok ? '통과' : '실패'} |`,
  ),
  '',
].join('\n');
console.log(`\n${table}`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
if (failed) {
  console.error(`실패: ${failed}`);
  process.exit(1);
}
console.log('모든 검사를 통과했습니다.');
