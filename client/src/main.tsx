import { hydrate, render } from 'preact';
import { App } from '@/shared/App';
import type { PageData } from '@/shared/types';
import '@/index.css';

declare global {
  interface Window {
    __PAGE_DATA__?: PageData;
  }
}

const container = document.getElementById('app')!;
const pageData: PageData = window.__PAGE_DATA__ || { page: 'password' };

// If SSR'd content exists (has children), hydrate; otherwise render fresh
if (container.children.length > 0) {
  hydrate(<App pageData={pageData} />, container);
} else {
  render(<App pageData={pageData} />, container);
}
