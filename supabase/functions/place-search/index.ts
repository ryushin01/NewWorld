// 세계 장소 검색과 좌표→주소 변환. 사용 정책을 지키도록 서버에서 호출합니다.
import { createClient } from 'npm:@supabase/supabase-js@2';
import redaxios from 'npm:redaxios@0.5.1';
import {
  isValidCoordinate,
  normalizeResults,
  pickReverseAddress,
  type PhotonFeature,
} from './normalize.ts';

const PHOTON = 'https://photon.komoot.io';
const USER_AGENT = 'NewWorld/1.0 (https://github.com/ryushin01/NewWorld)';
const TIMEOUT_MS = 8000;

type PhotonBody = { features?: PhotonFeature[] };

const photon = async (path: string, params: Record<string, string>) => {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  // redaxios 0.5는 signal을 fetch에 넘기지 않으므로 fetch를 감싸 시간 제한을 겁니다.
  // 실패 상태는 예전처럼 상태 코드가 담긴 Error로 던지려고 모든 상태를 받습니다.
  const response = await redaxios.get<PhotonBody>(`${PHOTON}/${path}`, {
    params,
    headers: { 'User-Agent': USER_AGENT },
    validateStatus: () => true,
    fetch: (input, init) => fetch(input, { ...init, signal }),
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Photon 오류: ${response.status}`);
  }
  // redaxios는 JSON을 읽지 못하면 글자 그대로 두므로, 예전 response.json()처럼 실패로 처리합니다.
  if (typeof response.data !== 'object' || response.data === null) {
    throw new Error('Photon 응답이 JSON이 아닙니다.');
  }
  return response.data.features ?? [];
};

/** 앱에 공개되는 anon 키만으로 외부 호출을 하지 못하게 로그인한 사용자만 허용합니다. */
const isSignedIn = async (request: Request) => {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return false;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data, error } = await client.auth.getUser(token);
  return !error && !!data.user;
};

Deno.serve(async (request) => {
  if (!(await isSignedIn(request))) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  try {
    const { query, latitude, longitude } = await request.json();
    if (typeof query === 'string' && query.trim()) {
      const features = await photon('api', { q: query, limit: '15' });
      return Response.json({ results: normalizeResults(features) });
    }
    if (isValidCoordinate(latitude, longitude)) {
      const features = await photon('reverse', {
        lat: String(latitude),
        lon: String(longitude),
      });
      return Response.json({ address: pickReverseAddress(features) });
    }
    return Response.json({ error: 'query 또는 좌표가 필요합니다.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: '검색에 실패했습니다.' }, { status: 502 });
  }
});
