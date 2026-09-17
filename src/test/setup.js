import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();

  globalThis.localStorage.clear();
  document.body.innerHTML = '';
  globalThis.history.replaceState({}, '', '/');
});