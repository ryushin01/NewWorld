export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** 오류 모니터링(Sentry). 비어 있으면 아무것도 보내지 않습니다. */
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
