/**
 * Storybook은 늘 데모 백엔드를 씁니다. Vite가 조건부 require('./supabase-backend')도 미리 불러와
 * Supabase 주소 없이 클라이언트를 만들다 멈추므로, 그 모듈을 이 빈 대역으로 바꿉니다(main.ts의 viteFinal).
 * Supabase 값이 없어 src/shared/api/index.ts가 이 값을 쓰는 일은 없습니다.
 */
export const supabaseBackend = null;
