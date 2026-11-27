// 운영 어드민 목데이터를 Supabase 시드로 내보냅니다(Supabase를 다시 켤 때 그대로 넣기 위함).
// 사용: pnpm run db:seed:export                      → supabase/seed/admin-demo.sql
//       pnpm run db:seed:export -- --avatars <폴더>   → 위 SQL + avatars 버킷에 올릴 프로필 사진(JPEG)
//       pnpm run db:seed:export -- --check            → 커밋된 SQL이 목데이터와 같은지 검사(다르면 실패)
// 자세한 순서: docs/supabase-restore.md
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { buildSeedSql, loadSeed } from './lib/supabase-seed.mjs';

const OUT = 'supabase/seed/admin-demo.sql';
const args = process.argv.slice(2);
const flag = (name) => args.indexOf(name);

const seed = await loadSeed();
const sql = buildSeedSql(seed);

if (flag('--check') >= 0) {
  if (readFileSync(OUT, 'utf8') !== sql) {
    console.error(
      `${OUT}이(가) 목데이터와 다릅니다. pnpm run db:seed:export로 다시 만들어 주세요.`,
    );
    process.exit(1);
  }
  console.log(`${OUT}이(가) 목데이터와 같습니다.`);
} else {
  writeFileSync(OUT, sql);
  console.log(
    `${OUT}: 회원 ${seed.users.length}명, 여행지 ${seed.destinations.length}곳, 코스 ${seed.courses.length}개, 뱃지 ${seed.badges.length}개, 스탬프 ${seed.stamps.length}개, 신고 ${seed.reports.length}건`,
  );
}

const avatars = flag('--avatars');
if (avatars >= 0) {
  const dir = args[avatars + 1];
  if (!dir) throw new Error('--avatars 다음에 사진을 쓸 폴더를 적어 주세요.');
  for (const file of seed.avatarObjects) {
    // 그린 그림은 data URI, 마스터 사진은 저장소의 assets/demo 파일입니다.
    const input = file.url.startsWith('data:')
      ? Buffer.from(decodeURIComponent(file.url.slice(file.url.indexOf(',') + 1)))
      : readFileSync(join('assets/demo', file.url.split('/').at(-1) ?? ''));
    const target = join(dir, file.name);
    mkdirSync(dirname(target), { recursive: true });
    // avatars 버킷은 JPEG만 받습니다(20261111000000_profiles.sql).
    await sharp(input).resize(256, 256, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(target);
  }
  console.log(`${dir}에 프로필 사진 ${seed.avatarObjects.length}장(JPEG)을 만들었습니다.`);
}
