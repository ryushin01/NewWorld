import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadBackend } from '@admin/shared/api';
import { App } from './app/app';
import './app/styles/fonts.css';
import './app/styles/base.css';
import './app/styles/layout.css';
import './app/styles/components.css';
import './app/styles/pages.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root가 없습니다.');
const root = createRoot(container);

loadBackend()
  .then((backend) =>
    root.render(
      <StrictMode>
        <App backend={backend} />
      </StrictMode>,
    ),
  )
  .catch(() => {
    container.textContent = '어드민을 불러오지 못했습니다. 새로고침해 주세요.';
  });
