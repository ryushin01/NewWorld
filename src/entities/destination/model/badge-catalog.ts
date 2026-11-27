import { COURSES } from './courses';

/**
 * 기념 뱃지의 이름·설명·색·조건 문구. 앱(features/badges)의 획득 계산과
 * 운영 어드민 시드·Supabase 시드(catalog_badges)가 이 한 곳에서 가져가 서로 어긋나지 않게 합니다.
 * 획득 계산(progress)은 앱 코드에만 있습니다.
 */
export type BadgeIcon =
  | 'footprints'
  | 'medal'
  | 'sparkles'
  | 'globe'
  | 'route'
  | 'door'
  | 'paradise'
  | 'afterlife'
  | 'divine'
  | 'compass';

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  /** 환상 세계 계열 뱃지는 보라색으로 보여 줍니다. */
  tone: 'real' | 'fantasy';
  /** 어드민에 보이는 획득 조건 요약 */
  rule: string;
};

const collector = (count: number, name: string): BadgeDefinition => ({
  id: `collector-${count}`,
  name,
  description: `현장 인증 스탬프 ${count}개`,
  icon: 'medal',
  tone: 'real',
  rule: `스탬프 ${count}개`,
});

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first-step',
    name: '첫 발자국',
    description: '처음으로 현장 인증 스탬프를 찍었습니다',
    icon: 'footprints',
    tone: 'real',
    rule: '스탬프 1개',
  },
  collector(5, '스탬프 수집가'),
  collector(10, '노련한 탐험가'),
  collector(25, '세계를 걷는 사람'),
  {
    id: 'legend-walker',
    name: '전설을 걷다',
    description: '환상 세계의 현실 연고지에서 처음 인증했습니다',
    icon: 'sparkles',
    tone: 'fantasy',
    rule: '환상 세계 1곳',
  },
  {
    id: 'legend-keeper',
    name: '전설의 기록자',
    description: '환상 세계 연고지 5곳에서 인증했습니다',
    icon: 'sparkles',
    tone: 'fantasy',
    rule: '환상 세계 5곳',
  },
  {
    id: 'five-continents',
    name: '다섯 대륙',
    description: '아프리카, 아메리카, 아시아, 유럽, 오세아니아의 유적을 모두 인증했습니다',
    icon: 'globe',
    tone: 'real',
    rule: '다섯 대륙의 실존 유적',
  },
  {
    id: 'myth-gate',
    name: '신화의 문',
    description: '신화 속 장소의 현실 연고지에서 처음 인증했습니다',
    icon: 'door',
    tone: 'fantasy',
    rule: '신화 1곳',
  },
  {
    id: 'myth-paradise',
    name: '낙원을 찾아서',
    description: '에덴, 엘리시온, 무릉도원 같은 낙원 3곳에서 인증했습니다',
    icon: 'paradise',
    tone: 'fantasy',
    rule: '낙원 3곳',
  },
  {
    id: 'myth-afterlife',
    name: '저승 순례자',
    description: '하데스의 명계, 요미노쿠니, 시발바 같은 저승 3곳에서 인증했습니다',
    icon: 'afterlife',
    tone: 'fantasy',
    rule: '저승 3곳',
  },
  {
    id: 'myth-divine',
    name: '신들의 거처',
    description: '올림포스, 아스가르드, 수미산 같은 신들의 거처 3곳에서 인증했습니다',
    icon: 'divine',
    tone: 'fantasy',
    rule: '신들의 거처 3곳',
  },
  {
    id: 'myth-odyssey',
    name: '신화 대모험',
    description: '신화 속 장소 10곳에서 인증했습니다',
    icon: 'compass',
    tone: 'fantasy',
    rule: '신화 10곳',
  },
  ...COURSES.map((course): BadgeDefinition => ({
    id: `course-${course.id}`,
    name: `${course.title} 완주`,
    description: `${course.title} 코스의 ${course.stops.length}곳을 모두 인증했습니다`,
    icon: 'route',
    tone: 'real',
    rule: `코스 ${course.stops.length}곳`,
  })),
];
