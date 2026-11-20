const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { withTamagui } = require('@tamagui/cli/metro');

const defaultConfig = getDefaultConfig(__dirname);
const expoBabelTransformer = defaultConfig.transformer.babelTransformerPath;

const config = withTamagui(defaultConfig, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
});

// 웹 번들만 Tamagui 컴파일러를 건너뜁니다(이유는 metro.transformer.js). 변환 작업자도 환경 변수를 물려받습니다.
process.env.NEWWORLD_WEB_BABEL_TRANSFORMER = expoBabelTransformer;
process.env.NEWWORLD_NATIVE_BABEL_TRANSFORMER = config.transformer.babelTransformerPath;
config.transformer.babelTransformerPath = path.resolve(__dirname, 'metro.transformer.js');

/** 웹을 지원하지 않는 네이티브 모듈을 웹 번들에서만 바꿔 넣습니다. iOS·Android 번들은 그대로입니다. */
const webStandIns = {
  'react-native-maps': path.resolve(__dirname, 'src/shared/ui/react-native-maps.web.tsx'),
};

const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webStandIns[moduleName]) {
    return { type: 'sourceFile', filePath: webStandIns[moduleName] };
  }
  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withStorybook(config, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
});
