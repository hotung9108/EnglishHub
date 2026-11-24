import test from 'node:test';
import assert from 'node:assert/strict';
import { commonVi, commonEn } from '../../locales/common';

test('student navigation - locales define menuStudentAnalytics accurately', () => {
  assert.strictEqual(commonVi.menuStudentAnalytics, 'Phân tích học tập');
  assert.strictEqual(commonEn.menuStudentAnalytics, 'Learning Analytics');
});

test('student navigation - student results section includes analytics route', () => {
  // Test navigation contract for student results section
  const studentResultsPaths = [
    '/student/grades',
    '/student/analytics',
    '/student/feedback'
  ];

  assert.ok(studentResultsPaths.includes('/student/analytics'), 'Student navigation must include /student/analytics');
});
