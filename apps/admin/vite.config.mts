import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * 운영 어드민(Vite + React). 상대 경로(base './')로 빌드해 GitHub Pages의 /NewWorld/admin/과
 * 로컬 미리보기(/) 어디에 올려도 같은 결과물이 돕니다. 화면 이동은 해시 주소라 서버 설정이 필요 없습니다.
 */
export default defineConfig({
  root: here('.'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@admin\//, replacement: `${here('./src')}/` },
      // 앱 카탈로그(여행지·코스)를 시드로 그대로 씁니다. 타입만 가져오는 경로는 빌드에서 지워집니다.
      { find: /^@catalog\//, replacement: `${here('../../src/entities/destination/model')}/` },
      // ryushin0(마스터) 데모 계정: 앱 데모와 같은 방문 기록·프로필 사진을 씁니다.
      { find: /^@demo-master$/, replacement: here('../../src/shared/api/demo-master.ts') },
      { find: /^@demo-assets\//, replacement: `${here('../../assets/demo')}/` },
    ],
  },
  envDir: here('.'),
  build: {
    outDir: here('./dist'),
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
  },
  server: { port: 5181, strictPort: false },
  preview: { port: 4381, strictPort: true },
  test: {
    root: here('.'),
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // pnpm run test:admin -- --coverage(또는 scripts/check.mjs)가 쓰는 커버리지 설정. 기준은 scripts/coverage-check.mjs
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/*.d.ts'],
      reportsDirectory: here('../../coverage/admin'),
      reporter: ['text-summary', 'json-summary'],
    },
  },
});
