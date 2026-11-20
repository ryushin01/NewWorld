/**
 * 웹 번들만 Tamagui 컴파일러를 건너뜁니다.
 * 컴파일러가 웹에서 정적 스타일을 클래스 이름으로 바꾸지만 그 CSS가 Expo 웹 번들에 실리지 않아
 * 색·여백·가로 배치가 빠졌습니다. 웹은 Expo 기본 변환기로 넘겨 Tamagui가 실행 중에 스타일을 넣게 하고,
 * iOS·Android는 지금처럼 컴파일러를 거칩니다. 두 변환기 경로는 metro.config.js가 환경 변수로 넘깁니다.
 */
const load = (name) => {
  const target = process.env[name];
  if (!target) throw new Error(`${name}가 없습니다. metro.config.js에서 정합니다.`);
  return require(target);
};

const transformers = {};
const pick = (platform) =>
  platform === 'web'
    ? (transformers.web ??= load('NEWWORLD_WEB_BABEL_TRANSFORMER'))
    : (transformers.native ??= load('NEWWORLD_NATIVE_BABEL_TRANSFORMER'));

module.exports = {
  transform: (args) => pick(args.options.platform).transform(args),
  getCacheKey: (...args) =>
    ['web', 'native'].map((platform) => pick(platform).getCacheKey?.(...args) ?? '').join('|'),
};
