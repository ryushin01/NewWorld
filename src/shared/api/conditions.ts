import redaxios from 'redaxios';

export type Conditions = { weather: string; temperature: number | null };

const WMO: [number[], string][] = [
  [[0], '맑음'],
  [[1, 2], '구름 조금'],
  [[3], '흐림'],
  [[45, 48], '안개'],
  [[51, 53, 55, 56, 57], '이슬비'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '비'],
  [[71, 73, 75, 77, 85, 86], '눈'],
  [[95, 96, 99], '뇌우'],
];

const describeWeather = (code: number) => WMO.find(([codes]) => codes.includes(code))?.[1] ?? '';

/** 세계 어디든 시차 계산이 필요 없도록 UTC로 묻고 UTC 시각으로 찾습니다. */
export const toUtcHour = (iso: string) => `${new Date(iso).toISOString().slice(0, 13)}:00`;

type Hourly = { time: string[] } & Record<string, (number | null)[] | string[]>;
type WeatherResponse = { hourly?: Hourly };

const valueAt = (data: WeatherResponse | null, field: string, hour: string) => {
  const index = data?.hourly?.time.indexOf(hour) ?? -1;
  if (index < 0) return null;
  const value = data?.hourly?.[field]?.[index];
  return typeof value === 'number' ? value : null;
};

export const parseConditions = (data: WeatherResponse | null, iso: string): Conditions | null => {
  const hour = toUtcHour(iso);
  const code = valueAt(data, 'weather_code', hour);
  const temperature = valueAt(data, 'temperature_2m', hour);
  if (code === null && temperature === null) return null;
  return { weather: code === null ? '' : describeWeather(code), temperature };
};

const ARCHIVE_AFTER_DAYS = 80;
const isOk = (status: number) => status >= 200 && status < 300;

/** 연결이 느리면 버튼이 오래 돌기만 하므로 이 시간이 지나면 멈추고 다시 시도하게 합니다. */
const TIMEOUT_MS = 10000;

/** 해당 날짜와 시각의 날씨와 기온을 Open-Meteo에서 가져옵니다. */
export const fetchConditions = async (latitude: number, longitude: number, iso: string) => {
  const date = toUtcHour(iso).slice(0, 10);
  const age = (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000);
  const host =
    age > ARCHIVE_AFTER_DAYS
      ? 'archive-api.open-meteo.com/v1/archive'
      : 'api.open-meteo.com/v1/forecast';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // redaxios 0.5는 signal을 fetch에 넘기지 않으므로 fetch를 감싸 시간 제한을 겁니다.
    // 상태 코드가 실패여도 예외 대신 null(날씨 없음)로 돌려주던 동작을 지키려고 모든 상태를 받습니다.
    const response = await redaxios.get<WeatherResponse>(
      `https://${host}?latitude=${latitude}&longitude=${longitude}&start_date=${date}&end_date=${date}&timezone=GMT&hourly=weather_code,temperature_2m`,
      {
        validateStatus: () => true,
        fetch: (input, init) => fetch(input, { ...init, signal: controller.signal }),
      },
    );
    if (!isOk(response.status)) return parseConditions(null, iso);
    // redaxios는 JSON을 읽지 못하면 글자 그대로 두므로, 예전 response.json()처럼 실패로 처리합니다.
    if (typeof response.data !== 'object') throw new SyntaxError('날씨 응답이 JSON이 아닙니다.');
    return parseConditions(response.data, iso);
  } finally {
    clearTimeout(timer);
  }
};
