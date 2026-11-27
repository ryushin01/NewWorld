import { matchPath } from './router';

describe('matchPath', () => {
  it('매개변수를 꺼내고 길이가 다르면 맞지 않는다', () => {
    expect(matchPath('/destinations/:id/edit', '/destinations/stonehenge/edit')).toEqual({
      id: 'stonehenge',
    });
    expect(matchPath('/destinations/:id', '/destinations/stonehenge/edit')).toBeNull();
    expect(matchPath('/courses', '/courses')).toEqual({});
  });

  it('인코딩된 값을 풀어 준다', () => {
    expect(matchPath('/users/:id', '/users/a%20b')).toEqual({ id: 'a b' });
  });
});
