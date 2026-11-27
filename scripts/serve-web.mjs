// 웹 데모 빌드(dist/)를 GitHub Pages처럼 띄웁니다. 없는 경로는 404.html(같은 앱)을 주므로
// 새로고침하거나 하위 경로(/destination/giza 등)를 바로 열어도 화면이 뜹니다. expo serve는 이 대체를 하지 않습니다.
// 사용: node scripts/serve-web.mjs [포트]   (경로는 EXPO_WEB_BASE_URL, 기본 /)
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4320);
const base = (process.env.EXPO_WEB_BASE_URL ?? '').replace(/\/$/, '');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const send = (res, status, file) => {
  res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
};

const fileOf = (pathname) => {
  // 경로 밖(../)으로 나가지 못하게 dist 안으로만 풉니다.
  const target = normalize(join(root, decodeURIComponent(pathname)));
  if (!target.startsWith(root)) return null;
  if (existsSync(target) && statSync(target).isFile()) return target;
  const index = join(target, 'index.html');
  return existsSync(index) ? index : null;
};

if (!existsSync(join(root, 'index.html'))) {
  console.error('dist/index.html이 없습니다. 먼저 pnpm run build:web을 실행해 주세요.');
  process.exit(1);
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (base && !pathname.startsWith(base)) {
    res.writeHead(302, { location: `${base}/` }).end();
    return;
  }
  const file = fileOf(pathname.slice(base.length) || '/');
  if (file) send(res, 200, file);
  else send(res, 404, join(root, '404.html'));
}).listen(port, () => console.log(`웹 데모: http://localhost:${port}${base}/`));
