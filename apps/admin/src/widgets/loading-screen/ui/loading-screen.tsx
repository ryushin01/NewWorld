import { useEffect, useState } from 'react';

const SEEN_KEY = 'newworld-admin.loaded';

const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const seen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * 레퍼런스의 첫 화면: 가운데 로고와 0→100 숫자가 오른 뒤 위로 걷힙니다.
 * 장식이라 낭독하지 않고, 움직임 줄이기 설정이거나 이번 탭에서 이미 봤으면 건너뜁니다.
 */
export function LoadingScreen() {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<'counting' | 'leaving' | 'done'>(() =>
    reducedMotion() || seen() ? 'done' : 'counting',
  );

  useEffect(() => {
    if (state !== 'counting') return;
    const start = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 700);
      setCount(Math.round(progress * 100));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setState('leaving');
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  useEffect(() => {
    if (state !== 'leaving') return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // 저장하지 못해도 다음에 한 번 더 보일 뿐입니다.
    }
    const timer = window.setTimeout(() => setState('done'), 700);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === 'done') return null;
  return (
    <div className={`loading${state === 'leaving' ? ' is-leaving' : ''}`} aria-hidden="true">
      <p className="loading__logo">NEWWORLD</p>
      <p className="loading__count">{count}</p>
    </div>
  );
}
