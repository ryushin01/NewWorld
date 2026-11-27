// ryushin0(마스터) 데모 계정의 여행 기록(여행지 55곳 전부 방문·현장 인증)을 만듭니다.
// 결과(src/shared/api/demo-master-visits.ts)는 앱 데모·운영 어드민 시드·Supabase 시드가 함께 쓰는 원천입니다.
// 카탈로그에 여행지가 늘거나 바뀌면 다시 실행합니다: node scripts/generate-demo-master.mjs
import { writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { withTsModules } from './lib/load-ts.mjs';

const OUT = 'src/shared/api/demo-master-visits.ts';
const FIRST_TRIP = Date.UTC(2024, 11, 7); // 2024-12-07
const LAST_TRIP = Date.UTC(2026, 10, 14); // 2026-11-14
const DAY = 24 * 60 * 60 * 1000;

// 늘 같은 값을 내는 의사 난수(mulberry32)
let state = 20240101;
const random = () => {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;

const destinations = await withTsModules(async (load) => {
  const { REAL_DESTINATIONS } = await load('@catalog/catalog-real');
  const { FANTASY_DESTINATIONS } = await load('@catalog/catalog-fantasy');
  return [...REAL_DESTINATIONS, ...FANTASY_DESTINATIONS];
});

// 지역(묶음)마다 한 번씩 여행을 떠나 하루에 한 곳씩 들렀다고 봅니다. 여행은 2년에 고르게 퍼뜨립니다.
const groups = [...new Set(destinations.map((item) => item.group))];
const gap = (LAST_TRIP - FIRST_TRIP) / (groups.length - 1);
const visits = groups.flatMap((group, tripIndex) => {
  const start = FIRST_TRIP + Math.round((tripIndex * gap) / DAY) * DAY;
  return destinations
    .filter((item) => item.group === group)
    .map((item, dayIndex) => {
      // 현지 낮 시간(경도로 어림한 오전 9시~오후 4시)에 인증했습니다.
      const localHour = 9 + random() * 7;
      const utcMs = start + dayIndex * DAY + (localHour - item.longitude / 15) * 60 * 60 * 1000;
      const distanceKm = round(0.05 + random() * 1.4, 3);
      const angle = random() * 2 * Math.PI;
      const cos = Math.max(Math.cos((item.latitude * Math.PI) / 180), 0.01);
      return {
        catalogId: item.id,
        name: item.name,
        realm: item.realm,
        location: item.location,
        group: item.group,
        visitedAt: new Date(Math.round(utcMs / 60000) * 60000).toISOString(),
        latitude: round(item.latitude + (distanceKm / 111.32) * Math.cos(angle), 6),
        longitude: round(item.longitude + (distanceKm / (111.32 * cos)) * Math.sin(angle), 6),
        distanceKm,
      };
    });
});

const body = visits
  .map(
    (visit) =>
      `  { catalogId: '${visit.catalogId}', name: ${JSON.stringify(visit.name)}, realm: '${visit.realm}', location: ${JSON.stringify(visit.location)}, group: ${JSON.stringify(visit.group)}, visitedAt: '${visit.visitedAt}', latitude: ${visit.latitude}, longitude: ${visit.longitude}, distanceKm: ${visit.distanceKm} },`,
  )
  .join('\n');
const source = `// scripts/generate-demo-master.mjs가 만든 파일입니다. 손으로 고치지 말고 스크립트를 다시 실행합니다.
import type { MasterVisit } from './demo-master';

/** ryushin0(마스터)이 여행지 ${visits.length}곳을 모두 다녀와 현장 인증한 기록(지역별 여행, 2년에 고르게). */
export const MASTER_VISITS: MasterVisit[] = [
${body}
];
`;
writeFileSync(OUT, await format(source, { ...(await resolveConfig(OUT)), filepath: OUT }));
console.log(`${OUT}에 ${visits.length}곳을 썼습니다.`);
