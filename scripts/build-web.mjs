// 웹 데모를 GitHub Pages에 올릴 수 있게 dist/에 만듭니다.
// 사용: pnpm run build:web            → https://ryushin01.github.io/NewWorld/ 경로(/NewWorld)
//       EXPO_WEB_BASE_URL= pnpm run build:web → 로컬에서 / 경로로 확인
// Supabase 값을 넘기지 않으므로 늘 데모 모드(가상 데이터, 브라우저 저장)로 빌드됩니다.
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const outDir = 'dist';
const baseUrl = process.env.EXPO_WEB_BASE_URL ?? '/NewWorld';

// .env를 읽지 않고 Supabase 값도 지워, 서버 주소나 키가 공개 번들에 들어가지 않게 합니다.
const env = { ...process.env, EXPO_WEB_BASE_URL: baseUrl, EXPO_NO_DOTENV: '1' };
for (const key of Object.keys(env)) if (key.startsWith('EXPO_PUBLIC_SUPABASE_')) delete env[key];

// CI는 EXPO_METRO_CACHE_OUTPUT_DIR(Expo가 Metro 캐시를 두는 폴더)를 캐시로 이어 쓰므로 비우지 않습니다.
// 그 밖에는 예전처럼 캐시를 비우고 새로 만듭니다.
const clear = process.env.EXPO_METRO_CACHE_OUTPUT_DIR ? [] : ['--clear'];
const result = spawnSync(
  'pnpm',
  ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', outDir, ...clear],
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

// 검색·공유용 정보. 하위 경로 사이트라 루트 robots.txt는 둘 수 없으므로 만들지 않습니다.
// 경로를 바꿔 로컬에서 열어도(EXPO_WEB_BASE_URL=) 주소는 늘 운영 주소를 가리킵니다.
const siteUrl = process.env.SITE_URL ?? 'https://ryushin01.github.io/NewWorld/';
const siteTitle = '신세계 웹 데모 - 역사와 신화·전설 속 여행지';
const siteDescription =
  '역사와 신화·전설 속 여행지를 탐험하고 기록하는 모바일 앱 신세계의 웹 데모입니다. 가상 데이터로 동작합니다.';
const imageUrl = `${siteUrl}og-image.png`;
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '신세계',
  url: siteUrl,
  description: siteDescription,
  applicationCategory: 'TravelApplication',
  operatingSystem: 'iOS, Android, Web',
  inLanguage: 'ko',
};
const attr = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const seoHead = `<title>${siteTitle}</title>
    <meta name="description" content="${attr(siteDescription)}" />
    <link rel="canonical" href="${siteUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="신세계" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="${attr(siteTitle)}" />
    <meta property="og:description" content="${attr(siteDescription)}" />
    <meta property="og:url" content="${siteUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="신세계 앱 아이콘, 보물 지도" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${attr(siteTitle)}" />
    <meta name="twitter:description" content="${attr(siteDescription)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>`;
const noscript =
  '<noscript>신세계 웹 데모를 보려면 브라우저에서 JavaScript를 켜 주세요. 신세계는 역사와 신화·전설 속 여행지를 탐험하고 기록하는 모바일 앱입니다.</noscript>';

const indexPath = join(outDir, 'index.html');
const html = readFileSync(indexPath, 'utf8')
  .replace('<html lang="en">', '<html lang="ko">')
  .replace('</head>', desktopFrame)
  .replace('<title>신세계</title>', seoHead)
  .replace(/<noscript>[\s\S]*?<\/noscript>/, '')
  .replace(/(<div id="root">)/, `${noscript}\n    $1`);
if (!html.includes('lang="ko"')) throw new Error('index.html의 lang을 바꾸지 못했습니다.');
if (!html.includes('rel="canonical"')) throw new Error('index.html에 SEO 정보를 넣지 못했습니다.');
writeFileSync(indexPath, html);

// Pages는 없는 경로에 404.html을 주므로, 같은 앱을 두어 새로고침·직접 연 하위 경로도 열리게 합니다.
copyFileSync(indexPath, join(outDir, '404.html'));
// 한 페이지 앱이라 다른 경로는 404.html이 받아 상태 코드가 404이므로, 사이트맵에는 200으로 열리는 웹 데모 첫 화면만 둡니다.
writeFileSync(
  join(outDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}</loc>\n  </url>\n</urlset>\n`,
);
// 공유 미리보기 이미지(1200x630): 앱 아이콘을 가운데에 둡니다. 저장소 자산만 쓰고 외부 요청은 없습니다.
const icon = await sharp('assets/icon.png').resize(500, 500).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#2a2233' } })
  .composite([{ input: icon, gravity: 'center' }])
  .png()
  .toFile(join(outDir, 'og-image.png'));
// _expo/ 처럼 밑줄로 시작하는 폴더를 Jekyll이 빼지 않게 합니다.
writeFileSync(join(outDir, '.nojekyll'), '');

console.log(`웹 데모를 ${outDir}/에 만들었습니다(경로 ${baseUrl || '/'}).`);
