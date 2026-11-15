import { SortsMillGoudy_400Regular } from '@expo-google-fonts/sorts-mill-goudy';
import { useFonts } from 'expo-font';

/**
 * 글꼴 역할. 한글은 제목·본문 모두 경기천년바탕, 영문 원어명은 Sorts Mill Goudy입니다.
 * 경기천년바탕은 수정할 수 없는 글꼴이라 배포된 파일 그대로(압축만 푼 OTF) 넣었습니다(assets/fonts/gyeonggi-batang).
 * 이름은 useFonts에 넘긴 키라 iOS와 Android에서 같습니다.
 */
export const FONT = {
  heading: 'GyeonggiBatang_700Bold',
  headingRegular: 'GyeonggiBatang_400Regular',
  latin: 'SortsMillGoudy_400Regular',
  body: 'GyeonggiBatang_400Regular',
} as const;

/** 글꼴을 불러온 뒤 true입니다. 실패해도 시스템 글꼴로 계속하도록 true를 돌려줍니다. */
export const useAppFonts = () => {
  const [loaded, error] = useFonts({
    [FONT.heading]: require('../../../assets/fonts/gyeonggi-batang/GyeonggiBatang-Bold.otf'),
    [FONT.headingRegular]: require('../../../assets/fonts/gyeonggi-batang/GyeonggiBatang-Regular.otf'),
    [FONT.latin]: SortsMillGoudy_400Regular,
  });
  return loaded || !!error;
};
