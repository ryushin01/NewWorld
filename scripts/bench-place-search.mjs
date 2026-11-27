// Edge Function place-search의 부하를 로컬에서만 잽니다(외부 Photon·Supabase에 요청하지 않음, CI에서 돌리지 않음).
// 함수와 같은 흐름(요청 JSON 읽기 → Photon 호출 → normalizeResults → 응답)을 Node HTTP 서버로 띄우고,
// Photon 자리에는 같은 모양의 응답(15건)을 주는 로컬 대역을 둡니다. 인증 확인(Supabase Auth)은 뺍니다.
// 사용: node scripts/bench-place-search.mjs [동시 요청 수=20] [요청 수=4000]
import { createServer } from 'node:http';
import { performance } from 'node:perf_hooks';
import { normalizeResults } from '../supabase/functions/place-search/normalize.ts';

const CONCURRENCY = Number(process.argv[2] ?? 20);
const TOTAL = Number(process.argv[3] ?? 4000);

const feature = (index) => ({
  properties: {
    osm_type: 'N',
    osm_id: 1000 + index,
    name: `유적 ${index}`,
    street: `${index}번길`,
    city: '쿠스코',
    state: '쿠스코주',
    country: '페루',
  },
  geometry: { coordinates: [-71.97 + index / 1000, -13.53 - index / 1000] },
});
const photonBody = JSON.stringify({ features: Array.from({ length: 15 }, (_, i) => feature(i)) });

const listen = (server) =>
  new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));

const photon = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(photonBody);
});
const photonPort = await listen(photon);

const fn = createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const { query } = JSON.parse(raw);
  const response = await fetch(
    `http://127.0.0.1:${photonPort}/api?q=${encodeURIComponent(query)}&limit=15`,
  );
  const body = await response.json();
  const results = normalizeResults(body.features ?? []);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ results }));
});
const fnPort = await listen(fn);

const latencies = [];
let sent = 0;
const worker = async () => {
  while (sent < TOTAL) {
    sent += 1;
    const started = performance.now();
    const response = await fetch(`http://127.0.0.1:${fnPort}/`, {
      method: 'POST',
      body: JSON.stringify({ query: '쿠스코' }),
    });
    await response.json();
    latencies.push(performance.now() - started);
  }
};
const started = performance.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
const seconds = (performance.now() - started) / 1000;
latencies.sort((a, b) => a - b);
const at = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];
console.log(
  `요청 ${latencies.length}건, 동시 ${CONCURRENCY}: ${(latencies.length / seconds).toFixed(0)}건/초, ` +
    `p50 ${at(0.5).toFixed(1)}ms, p95 ${at(0.95).toFixed(1)}ms, p99 ${at(0.99).toFixed(1)}ms`,
);
photon.close();
fn.close();
