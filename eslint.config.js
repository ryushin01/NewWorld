const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  { ignores: ['dist/*', 'ios/*', 'android/*', 'supabase/functions/*', 'expo-env.d.ts'] },
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
