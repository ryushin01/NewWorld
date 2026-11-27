// Jest(앱)·Vitest(어드민) 커버리지 요약(coverage/*/coverage-summary.json)을 모아 기준을 검사합니다.
// - 로직 계층(shared/lib, */model, */api, Edge Function 순수 로직)은 80% 이상
// - 전체는 COVERAGE_BASELINE 아래로 내려가지 않게(지금 값을 기준선으로 둠, 올리기만 함)
// CI에서는 표를 $GITHUB_STEP_SUMMARY에 씁니다.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const METRICS = ['lines', 'statements', 'functions', 'branches'];
const LOGIC_MIN = 80;

/**
 * 전체 커버리지 기준선(2.20.1에서 잰 값을 소수 첫째 자리에서 버림). 테스트를 늘려 값이 오르면 함께 올립니다.
 */
const COVERAGE_BASELINE = {
  app: { lines: 58.4, statements: 57.9, functions: 51.4, branches: 52.6 },
  admin: { lines: 66.0, statements: 64.4, functions: 61.2, branches: 49.2 },
};

/**
 * 로직 계층에서 빼는 파일. 서버(Supabase) 어댑터는 실제 서버가 있어야 뜻이 있어
 * 단위 테스트 대신 로컬 Supabase E2E(pnpm run test:e2e:server)와 RLS 테스트(test:db)로 검사합니다.
 */
const LOGIC_EXCLUDE = [
  'src/shared/api/supabase-backend.ts',
  'apps/admin/src/shared/api/supabase-backend.ts',
];

const SUITES = [
  {
    key: 'app',
    name: '앱(Jest)',
    file: 'coverage/app/coverage-summary.json',
    isLogic: (path) =>
      path.startsWith('src/shared/lib/') ||
      /^src\/.+\/(model|api)\//.test(path) ||
      path.startsWith('supabase/functions/'),
  },
  {
    key: 'admin',
    name: '어드민(Vitest)',
    file: 'coverage/admin/coverage-summary.json',
    isLogic: (path) =>
      path.startsWith('apps/admin/src/shared/lib/') ||
      /^apps\/admin\/src\/.+\/(model|api)\//.test(path),
  },
];

const root = resolve('.');
const pct = (covered, total) => (total === 0 ? 100 : (covered / total) * 100);
const sum = (entries) =>
  Object.fromEntries(
    METRICS.map((metric) => {
      const covered = entries.reduce((n, entry) => n + entry[metric].covered, 0);
      const total = entries.reduce((n, entry) => n + entry[metric].total, 0);
      return [metric, pct(covered, total)];
    }),
  );
const fmt = (value) => `${value.toFixed(2)}%`;

const only = process.argv.slice(2);
const failures = [];
const rows = [];
for (const suite of SUITES) {
  if (only.length && !only.includes(suite.key)) continue;
  if (!existsSync(suite.file)) {
    failures.push(`${suite.file}이 없습니다. 커버리지와 함께 테스트를 먼저 실행해 주세요.`);
    continue;
  }
  const summary = JSON.parse(readFileSync(suite.file, 'utf8'));
  const files = Object.entries(summary)
    .filter(([path]) => path !== 'total')
    .map(([path, entry]) => [relative(root, path).replaceAll('\\', '/'), entry]);
  const total = sum(files.map(([, entry]) => entry));
  const logic = sum(
    files
      .filter(([path]) => suite.isLogic(path) && !LOGIC_EXCLUDE.includes(path))
      .map(([, entry]) => entry),
  );
  const baseline = COVERAGE_BASELINE[suite.key];
  for (const metric of METRICS) {
    if (logic[metric] < LOGIC_MIN)
      failures.push(`${suite.name} 로직 계층 ${metric} ${fmt(logic[metric])} < ${LOGIC_MIN}%`);
    if (total[metric] < baseline[metric])
      failures.push(
        `${suite.name} 전체 ${metric} ${fmt(total[metric])} < 기준선 ${baseline[metric]}%`,
      );
  }
  rows.push(
    `| ${suite.name} 로직 계층 | ${METRICS.map((m) => fmt(logic[m])).join(' | ')} | ${LOGIC_MIN}% |`,
    `| ${suite.name} 전체 | ${METRICS.map((m) => fmt(total[m])).join(' | ')} | ${METRICS.map((m) => `${baseline[m]}`).join('·')}% |`,
  );
}

const table = [
  '### 커버리지',
  '',
  '| 범위 | 줄 | 문장 | 함수 | 분기 | 기준 |',
  '| --- | --- | --- | --- | --- | --- |',
  ...rows,
  '',
  failures.length
    ? `**기준 미달**\n\n${failures.map((item) => `- ${item}`).join('\n')}`
    : '모든 기준을 넘었습니다.',
  '',
].join('\n');
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
if (failures.length) process.exit(1);
