import { fetchConditions, parseConditions, toUtcHour } from './conditions';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));

it('기록 시각을 UTC 시간 단위로 맞춥니다', () => {
  expect(toUtcHour('2026-11-06T00:40:00.000Z')).toBe('2026-11-06T00:00');
});

const data = {
  hourly: {
    time: ['2026-11-06T00:00', '2026-11-06T01:00'],
    weather_code: [3, 0],
    temperature_2m: [18, 18.5],
  },
};

it('기록 시각의 날씨와 기온을 고릅니다', () => {
  expect(parseConditions(data, '2026-11-06T01:10:00.000Z')).toEqual({
    weather: '맑음',
    temperature: 18.5,
  });
});

it('해당 시각의 값이 없으면 null입니다', () => {
  expect(parseConditions(data, '2020-01-01T00:00:00.000Z')).toBeNull();
  expect(parseConditions(null, '2026-11-06T01:10:00.000Z')).toBeNull();
});

describe('fetchConditions', () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  afterEach(() => {
    fetchMock.mockReset();
    jest.useRealTimers();
  });

  it('최근 기록은 예보 주소로 묻고 그 시각의 날씨를 돌려줍니다', async () => {
    const iso = new Date().toISOString();
    const hour = toUtcHour(iso);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ hourly: { time: [hour], weather_code: [61], temperature_2m: [7] } }),
        { status: 200 },
      ),
    );
    await expect(fetchConditions(37.5, 127, iso)).resolves.toEqual({
      weather: '비',
      temperature: 7,
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `https://api.open-meteo.com/v1/forecast?latitude=37.5&longitude=127&start_date=${hour.slice(0, 10)}&end_date=${hour.slice(0, 10)}&timezone=GMT&hourly=weather_code,temperature_2m`,
    );
  });

  it('오래된 기록은 기록 보관 주소로 묻습니다', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(fetchConditions(0, 0, '2020-01-01T00:00:00.000Z')).resolves.toBeNull();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('archive-api.open-meteo.com/v1/archive');
  });

  it('서버가 실패 상태를 돌려주면 예외 없이 null입니다', async () => {
    fetchMock.mockResolvedValue(new Response('error', { status: 500 }));
    await expect(fetchConditions(0, 0, new Date().toISOString())).resolves.toBeNull();
  });

  it('응답이 JSON이 아니면 실패합니다', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(fetchConditions(0, 0, new Date().toISOString())).rejects.toThrow(SyntaxError);
  });

  it('10초 안에 답이 없으면 요청을 멈춥니다', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const pending = fetchConditions(0, 0, new Date().toISOString());
    jest.advanceTimersByTime(10000);
    await expect(pending).rejects.toThrow('aborted');
  });
});
