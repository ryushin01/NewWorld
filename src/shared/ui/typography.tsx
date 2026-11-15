import { styled, Text } from 'tamagui';
import { FONT } from './fonts';

// v3의 숫자 lineHeight는 글자 크기에 곱하는 배수이므로 픽셀은 문자열로 적습니다.
export const AppText = styled(Text, {
  name: 'AppText',
  fontFamily: FONT.body,
  color: 'text',
  fontSize: 15,
  lineHeight: '22px',
  variants: {
    tone: {
      default: { color: 'text' },
      ink: { color: 'ink' },
      muted: { color: 'muted' },
      brand: { color: 'brandText' },
      danger: { color: 'danger' },
      inverse: { color: 'surface' },
    },
    size: {
      caption: { fontSize: 13, lineHeight: '18px' },
      body: { fontSize: 15, lineHeight: '22px' },
      row: { fontSize: 17, lineHeight: '24px' },
      // 제목은 한글재민체(NewWorld Title)입니다. 굵기가 하나뿐이라 fontWeight를 더하지 않습니다(Android는 가짜로 굵게 그림).
      title: { fontSize: 19, lineHeight: '28px', fontFamily: FONT.heading, color: 'ink' },
      headline: { fontSize: 24, lineHeight: '34px', fontFamily: FONT.heading, color: 'ink' },
    },
    // 유앤피플 고딕은 굵기가 하나뿐이라 굵은 본문은 제목 글꼴로 구분합니다(fontWeight를 더하면 Android에서 가짜로 굵어짐)
    bold: { true: { fontFamily: FONT.heading } },
    /** 여행지 영문 원어명처럼 라틴 문자로만 된 짧은 이름 */
    latin: { true: { fontFamily: FONT.latin, letterSpacing: 0.5 } },
  } as const,
});
