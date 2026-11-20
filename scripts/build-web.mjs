// 웹 데모를 GitHub Pages에 올릴 수 있게 dist/에 만듭니다.
// 사용: pnpm run build:web            → https://ryushin01.github.io/NewWorld/ 경로(/NewWorld)
//       EXPO_WEB_BASE_URL= pnpm run build:web → 로컬에서 / 경로로 확인
// Supabase 값을 넘기지 않으므로 늘 데모 모드(가상 데이터, 브라우저 저장)로 빌드됩니다.
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist';
const baseUrl = process.env.EXPO_WEB_BASE_URL ?? '/NewWorld';

// .env를 읽지 않고 Supabase 값도 지워, 서버 주소나 키가 공개 번들에 들어가지 않게 합니다.
const env = { ...process.env, EXPO_WEB_BASE_URL: baseUrl, EXPO_NO_DOTENV: '1' };
for (const key of Object.keys(env)) if (key.startsWith('EXPO_PUBLIC_SUPABASE_')) delete env[key];

const result = spawnSync(
  'pnpm',
  ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', outDir, '--clear'],
  { stdio: 'inherit', env },
);
if (result.status !== 0) process.exit(result.status ?? 1);

// 휴대폰 앱이므로 넓은 화면에서는 휴대폰 폭으로 가운데에 둡니다. transform은 앱 안의 고정 위치 요소를 이 폭에 가둡니다.
const desktopFrame = `<style id="newworld-web-frame">
      @media (min-width: 640px) {
        #root { max-width: 480px; margin: 0 auto; transform: translateZ(0); box-shadow: 0 0 0 1px rgba(128, 128, 128, 0.25); }
      }
    </style>
  </head>`;

const indexPath = join(outDir, 'index.html');
const html = readFileSync(indexPath, 'utf8')
  .replace('<html lang="en">', '<html lang="ko">')
  .replace('</head>', desktopFrame)
  .replace(
    '<title>신세계</title>',
    '<title>신세계 웹 데모</title>\n    <meta name="description" content="역사와 신화·전설 속 여행지를 탐험하고 기록하는 모바일 앱 신세계의 웹 데모입니다. 가상 데이터로 동작합니다." />',
  );
if (!html.includes('lang="ko"')) throw new Error('index.html의 lang을 바꾸지 못했습니다.');
writeFileSync(indexPath, html);

// Pages는 없는 경로에 404.html을 주므로, 같은 앱을 두어 새로고침·직접 연 하위 경로도 열리게 합니다.
copyFileSync(indexPath, join(outDir, '404.html'));
// _expo/ 처럼 밑줄로 시작하는 폴더를 Jekyll이 빼지 않게 합니다.
writeFileSync(join(outDir, '.nojekyll'), '');

console.log(`웹 데모를 ${outDir}/에 만들었습니다(경로 ${baseUrl || '/'}).`);
