import { scrubBreadcrumb } from './monitoring';

it('콘솔 기록은 버리고, 요청 주소의 쿼리(서명 토큰 등)는 지웁니다', () => {
  expect(scrubBreadcrumb({ category: 'console', message: '여행 메모' })).toBeNull();
  expect(
    scrubBreadcrumb({
      category: 'fetch',
      data: {
        url: 'https://x.supabase.co/storage/v1/object/sign/a/b.jpg?token=secret',
        method: 'GET',
      },
    }),
  ).toEqual({
    category: 'fetch',
    data: { url: 'https://x.supabase.co/storage/v1/object/sign/a/b.jpg', method: 'GET' },
  });
  const navigation = { category: 'navigation', data: { from: '/', to: '/passport' } };
  expect(scrubBreadcrumb(navigation)).toBe(navigation);
});
