import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      testTimeout: 15000,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/__tests__/components/**/*.test.tsx', 'src/__tests__/utils/**/*.test.ts'],
      clearMocks: true,
      restoreMocks: true,
      env: { TZ: 'Asia/Ho_Chi_Minh' },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov', 'json-summary'],
        include: [
          'src/pages/Login.tsx',
          'src/pages/TeacherCreateAssignment.tsx',
          'src/pages/StudentAssignmentWriting.tsx',
          'src/pages/TeacherSubmissionDetails.tsx',
          'src/pages/TeacherAssignments.tsx',
          'src/components/assignments/AssignmentCard.tsx',
          'src/components/classes/DateRangeFilter.tsx',
          'src/components/classes/StudentEvaluationAvailabilityNotice.tsx',
          'src/utils/gradebookDateRange.utils.ts',
          'src/utils/studentEvaluationAvailability.utils.ts',
        ],
        thresholds: {
          perFile: true,
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  })
)
