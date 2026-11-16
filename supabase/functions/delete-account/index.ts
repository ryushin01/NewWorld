// 계정 삭제: 기록 사진과 프로필 사진 파일을 지운 뒤 사용자를 삭제합니다. 데이터는 외래 키로 함께 삭제됩니다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { chunk, fetchAllPages } from './pages.ts';

const REMOVE_BATCH = 100;

Deno.serve(async (request) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const token = authorization.replace(/^Bearer /, '');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });

  const userId = data.user.id;
  try {
    // 한 번에 1,000행까지만 오므로 끝까지 나눠 읽어, 사진이 많은 회원도 파일이 남지 않게 합니다.
    const photos = await fetchAllPages<{ storage_path: string }>((from, to) =>
      admin
        .from('record_photos')
        .select('storage_path')
        .eq('user_id', userId)
        .order('storage_path')
        .range(from, to),
    );
    for (const paths of chunk(
      photos.map((photo) => photo.storage_path),
      REMOVE_BATCH,
    )) {
      const { error: removeError } = await admin.storage.from('record-photos').remove(paths);
      if (removeError) throw removeError;
    }

    const { data: avatars, error: avatarError } = await admin.storage
      .from('avatars')
      .list(userId, { limit: 1000 });
    if (avatarError) throw avatarError;
    if (avatars && avatars.length > 0) {
      const { error: removeError } = await admin.storage
        .from('avatars')
        .remove(avatars.map((file) => `${userId}/${file.name}`));
      if (removeError) throw removeError;
    }
  } catch (cleanupError) {
    // 파일을 다 지우지 못했으면 계정을 남겨 두어 다시 시도할 수 있게 합니다.
    const message = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
    return Response.json({ error: message }, { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
  return Response.json({ ok: true });
});
