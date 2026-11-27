const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
const jsxA11y = require('eslint-plugin-jsx-a11y');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: [
      'dist/*',
      'ios/*',
      'android/*',
      'supabase/functions/*',
      'expo-env.d.ts',
      'apps/admin/dist/*',
      // ESM 설정 파일(.mts)은 expo 설정의 파서 대상이 아니라 tsc(typecheck:admin)로만 검사합니다.
      'apps/admin/*.mts',
      '.lighthouseci/*',
    ],
  },
  // 운영 어드민(웹 DOM)은 jsx-a11y 권장 규칙으로 접근성을 함께 검사합니다.
  { ...jsxA11y.flatConfigs.recommended, files: ['apps/admin/**/*.{ts,tsx}'] },
  {
    files: ['apps/admin/**/*.{ts,tsx,mts}'],
    settings: {
      'import/resolver': { typescript: { project: 'apps/admin/tsconfig.json' } },
    },
  },
  {
    rules: {
      // 패키지 입구에서 가져오면 아이콘 4,712개가 모두 번들에 들어갑니다(약 2.1MB).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react-native',
              message:
                "아이콘은 '@/shared/ui'에서 가져옵니다. 새 아이콘은 shared/ui/icons.ts에 더합니다.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
