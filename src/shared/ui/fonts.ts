// 패키지 입구에서 가져오면 쓰지 않는 기울임꼴(104KB)까지 앱에 들어가므로 굵기 경로에서 가져옵니다.
import { SortsMillGoudy_400Regular } from '@expo-google-fonts/sorts-mill-goudy/400Regular';
import { useFonts } from 'expo-font';

/**
 * 글꼴 역할. 한글 제목·굵은 본문은 한글재민체 3.0, 본문은 유앤피플 고딕 UNI, 영문 원어명은 Sorts Mill Goudy입니다.
 * 한글재민체는 한글 2,350자만 그리고 나머지는 빈칸입니다. React Native에는 글꼴 대체 목록이 없어,
 * 그린 글자만 남기고 빠진 한글은 유앤피플 고딕으로 채워 한 파일로 합친 NewWorld Title을 씁니다
 * (assets/fonts/newworld-title, scripts/fonts/build-title-font.py). 사용자가 쓴 제목의 드문 글자는 본문 글꼴로 보입니다.
 * 유앤피플 고딕 UNI는 한글 11,172자를 모두 그린 공식 배포 파일 그대로입니다(assets/fonts/unpeople-gothic).
 * 이름은 useFonts에 넘긴 키라 iOS와 Android에서 같습니다.
 */
export const FONT = {
  heading: 'NewWorldTitle_400Regular',
  latin: 'SortsMillGoudy_400Regular',
  body: 'UnpeopleGothicUNI_400Regular',
} as const;

/** 글꼴을 불러온 뒤 true입니다. 실패해도 시스템 글꼴로 계속하도록 true를 돌려줍니다. */
export const useAppFonts = () => {
  const [loaded, error] = useFonts({
    [FONT.heading]: require('../../../assets/fonts/newworld-title/NewWorldTitle-Regular.ttf'),
    [FONT.body]: require('../../../assets/fonts/unpeople-gothic/UnpeopleGothic-UNI.ttf'),
    [FONT.latin]: SortsMillGoudy_400Regular,
  });
  return loaded || !!error;
};
