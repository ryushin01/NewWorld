import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * jsdom에는 <dialog>의 showModal·close가 없어 최소한으로 채웁니다(열림 표시, close 이벤트, Escape).
 * 실제 브라우저의 초점 가두기·inert는 Playwright E2E(e2e/admin.spec.ts)가 검사합니다.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
    const focusable = this.querySelector<HTMLElement>('input, select, textarea, button, a[href]');
    focusable?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.removeEventListener('keydown', onKey);
        this.close();
      }
    };
    this.addEventListener('keydown', onKey);
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});
