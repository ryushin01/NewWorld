import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(`${root}/`);

/**
 * 웹 Storybook(react-native-web + Vite). 휴대폰 안 Storybook(.rnstorybook)과 같은 스토리를 씁니다.
 * 시각 회귀·axe 검사(e2e/storybook)가 이 정적 빌드(storybook-static)를 띄워 스토리마다 봅니다.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  viteFinal: (vite) => ({
    ...vite,
    resolve: {
      ...vite.resolve,
      alias: [
        ...(Array.isArray(vite.resolve?.alias) ? vite.resolve.alias : []),
        // React Native 0.87부터 @react-native/assets-registry가 없어 Expo 웹 번들처럼 react-native-web 것으로 바꿉니다.
        {
          find: /^@react-native\/assets-registry\/registry(\.js)?$/,
          replacement: require.resolve('react-native-web/asset-registry'),
        },
        // 데모 백엔드만 쓰므로 Supabase 어댑터는 대역으로 바꿉니다(supabase-backend-stub.ts).
        {
          find: /^\.\/supabase-backend$/,
          replacement: `${root}/.storybook/supabase-backend-stub.ts`,
        },
        // 웹 번들과 같이 지도 모듈은 안내 화면으로 바꿉니다(metro.config.js의 webStandIns).
        {
          find: /^react-native-maps$/,
          replacement: `${root}/src/shared/ui/react-native-maps.web.tsx`,
        },
      ],
    },
  }),
};

export default config;
