const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
});
const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
});
const numberFormat = new Intl.NumberFormat('ko-KR');

/** 레퍼런스의 '2026. 11. 27' 표기를 따릅니다. */
export const formatDate = (iso: string) =>
  dateFormat.format(new Date(iso)).replace(/\.$/, '').replace(/\s+/g, ' ');
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
export const formatNumber = (value: number) => numberFormat.format(value);

/** 서울 기준 날짜 열쇠(YYYY-MM-DD). 일별 집계에 씁니다. */
export const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);
