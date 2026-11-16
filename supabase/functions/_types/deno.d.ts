// Edge Function 타입 검사용 선언(`pnpm run typecheck:functions`). 배포에는 쓰이지 않습니다.
// Deno가 없어도 Node의 supabase-js 타입으로 함수 코드를 검사합니다.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

declare module 'npm:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}
