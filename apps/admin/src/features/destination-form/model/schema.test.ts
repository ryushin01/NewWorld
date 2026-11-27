import { destinationFormSchema } from './schema';

const valid = {
  id: 'new-ruin',
  realm: 'real' as const,
  lore: 'history' as const,
  name: '새 유적',
  originalName: 'New Ruin',
  tagline: '한 줄 소개',
  group: '유럽',
  location: '',
  era: '',
  latitude: 10,
  longitude: 20,
  overview: '',
};

describe('여행지 폼 검사', () => {
  it('올바른 값은 통과한다', () => {
    expect(destinationFormSchema.safeParse(valid).success).toBe(true);
  });

  it('실존 유적에 신화 분류를 고르면 분류 칸 오류다', () => {
    const result = destinationFormSchema.safeParse({ ...valid, lore: 'myth' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['lore']);
  });

  it('ID 형식·좌표 범위·빈 숫자를 거른다', () => {
    const result = destinationFormSchema.safeParse({
      ...valid,
      id: 'Bad ID',
      latitude: 91,
      longitude: Number.NaN,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual([
      'id',
      'latitude',
      'longitude',
    ]);
  });
});
