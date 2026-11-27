import { z } from 'zod';

/**
 * 빌드 때 넣는 환경 변수를 검사합니다.
 * VITE_DEMO=1이거나 Supabase 값이 없으면 데모 모드(브라우저 저장소의 시드 데이터)로 돕니다.
 * 공개 빌드(GitHub Pages)는 늘 VITE_DEMO=1로 만들어 서버 주소나 키가 번들에 들어가지 않습니다.
 */
const envSchema = z.object({
  VITE_DEMO: z.string().optional(),
  VITE_SUPABASE_URL: z.url().optional().or(z.literal('')),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);
const raw = parsed.success ? parsed.data : {};

const supabaseUrl = raw.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = raw.VITE_SUPABASE_ANON_KEY ?? '';

export const env = {
  demo: raw.VITE_DEMO === '1' || !supabaseUrl || !supabaseAnonKey,
  supabaseUrl,
  supabaseAnonKey,
};

/** 앱과 같은 규칙: 아이디를 Supabase Auth용 주소로 바꿉니다(메일은 보내지 않음). */
export const toAuthEmail = (username: string) => `${username}@users.newworld.app`;

/** 같은 저장소의 앱 웹 데모. 어드민은 /NewWorld/admin/에 함께 올라갑니다. */
export const APP_DEMO_URL = 'https://ryushin01.github.io/NewWorld/';
