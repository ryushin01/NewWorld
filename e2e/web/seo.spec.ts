import { expect, test } from '@playwright/test';

/** 웹 데모의 검색·공유 정보(scripts/build-web.mjs가 빌드 때 만듦)가 산출물에 있는지 봅니다. */
const SITE_URL = 'https://ryushin01.github.io/NewWorld/';

test('홈 HTML에 한국어 제목·설명·canonical·Open Graph·Twitter 카드·noscript가 있다', async ({
  request,
}) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('<html lang="ko">');
  expect(html).toMatch(/<title>[^<]*신세계[^<]*<\/title>/);
  expect(html).toContain('<meta name="description" content="');
  expect(html).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
  for (const property of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image']) {
    expect(html, property).toContain(`<meta property="${property}" content="`);
  }
  expect(html).toContain(`<meta property="og:image" content="${SITE_URL}og-image.png" />`);
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  expect(html).toMatch(/<noscript>[^<]*JavaScript[^<]*<\/noscript>/);
});

test('홈 HTML의 JSON-LD가 SoftwareApplication이다', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  expect(json).toBeDefined();
  const data: unknown = JSON.parse(json ?? '');
  expect(data).toMatchObject({
    '@type': 'SoftwareApplication',
    name: '신세계',
    url: SITE_URL,
    applicationCategory: 'TravelApplication',
    inLanguage: 'ko',
  });
});

test('sitemap.xml은 절대 주소만 담고, og-image.png는 1200x630 PNG이다', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toContain(SITE_URL);
  for (const loc of locs) expect(loc).toMatch(/^https:\/\/ryushin01\.github\.io\/NewWorld\//);

  const image = await request.get('/og-image.png');
  expect(image.status()).toBe(200);
  const bytes = await image.body();
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});
