import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { buildApiUrl } from './lib/api';

const nativeFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string") {
    return nativeFetch(buildApiUrl(input), init);
  }
  if (input instanceof URL) {
    return nativeFetch(new URL(buildApiUrl(input.toString())), init);
  }
  return nativeFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
