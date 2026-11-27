import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/** 화면 전환 없이 바뀐 결과를 알리는 role="status" 영역(저장했습니다 등). */
const AnnounceContext = createContext<(message: string) => void>(() => {});

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const announce = useCallback((next: string) => {
    // 같은 문장도 다시 읽히도록 비웠다가 넣습니다.
    setMessage('');
    window.setTimeout(() => setMessage(next), 30);
  }, []);
  return (
    <AnnounceContext value={announce}>
      {children}
      <div className="toast" role="status" aria-live="polite">
        {message ? <p className="toast__text">{message}</p> : null}
      </div>
    </AnnounceContext>
  );
}

export const useAnnounce = () => useContext(AnnounceContext);
