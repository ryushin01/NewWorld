// 복구 코드로 비밀번호 재설정: 아이디와 코드를 확인하고 새 비밀번호를 저장한 뒤, 쓴 코드를 새 코드로 바꿉니다.
// 로그인 전에 부르므로 anon 키로 호출되며, 확인과 변경은 서비스 키로만 합니다.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const CODE_LENGTH = 12;
const USERNAME = /^[a-z0-9_]{4,20}$/;

const normalize = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, '');

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createCode = () => {
  let code = '';
  while (code.length < CODE_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(CODE_LENGTH * 2))) {
      if (byte < 240 && code.length < CODE_LENGTH) code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return code;
};

const fail = (message: string, status = 400) => Response.json({ error: message }, { status });

/**
 * 비밀번호를 잊은 사이 다른 기기에 남은 로그인을 모두 끊습니다. 관리 API에는 회원 id로 세션을 끊는 기능이 없어,
 * 새 비밀번호로 한 번 로그인해 받은 토큰으로 전체 로그아웃(global)을 요청합니다. 앱은 끝난 뒤 다시 로그인합니다.
 * 예전에 이메일로 가입한 계정은 아이디와 주소가 달라 실제 주소를 조회해 씁니다.
 */
const revokeSessions = async (admin: SupabaseClient, userId: string, password: string) => {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) throw error ?? new Error('email not found');
  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email: data.user.email,
    password,
  });
  if (signInError || !signedIn.session) throw signInError ?? new Error('no session');
  const { error: signOutError } = await admin.auth.admin.signOut(
    signedIn.session.access_token,
    'global',
  );
  if (signOutError) throw signOutError;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return fail('허용하지 않는 요청입니다.', 405);
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? normalize(body.code) : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!USERNAME.test(username) || code.length !== CODE_LENGTH || password.length < 8) {
    return fail('Invalid recovery code');
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: userId, error: verifyError } = await admin.rpc('verify_recovery_code', {
    p_username: username,
    p_code_hash: await sha256(code),
  });
  if (verifyError) {
    return /recovery locked/i.test(verifyError.message)
      ? fail('Recovery locked', 429)
      : fail(verifyError.message, 500);
  }
  if (!userId) return fail('Invalid recovery code');

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
  if (updateError) return fail(updateError.message, 400);
  // 끊지 못해도 비밀번호는 이미 바뀌었으므로 재설정은 성공으로 둡니다(남은 세션은 토큰 만료로 끝남).
  await revokeSessions(admin, userId, password).catch((error) => console.error(error));

  // 비밀번호를 바꾼 뒤에 코드를 교체해, 비밀번호 저장이 실패하면 기존 코드를 그대로 쓸 수 있게 합니다.
  const recoveryCode = createCode();
  const { error: replaceError } = await admin.rpc('replace_recovery_code', {
    p_user_id: userId,
    p_code_hash: await sha256(recoveryCode),
  });
  // 새 코드를 저장하지 못해도 비밀번호는 이미 바뀌었으므로 성공으로 보고 MY에서 다시 발급하게 합니다.
  return Response.json({ recoveryCode: replaceError ? null : recoveryCode });
});
