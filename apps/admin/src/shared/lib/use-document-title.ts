import { useEffect } from 'react';

/** 화면마다 고유한 <title>을 둡니다. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | 신세계 운영 어드민` : '신세계 운영 어드민';
  }, [title]);
}
