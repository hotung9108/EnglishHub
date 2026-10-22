import { defineConfig } from 'vitest/config';
import config from './vite.config.ts';

// Deliberately red reproductions of application defects, outside the passing
// QA-32 acceptance suite. Run explicitly; never count these as passing coverage.
export default defineConfig({
  ...config,
  test: {
    ...config.test,
    include: ['src/__tests__/known-bugs/**/*.test.tsx'],
    coverage: { enabled: false },
  },
});
