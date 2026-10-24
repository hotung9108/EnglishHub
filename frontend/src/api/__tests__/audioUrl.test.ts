import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAudioUrl } from '../../utils/audioUrl.utils';

test('resolveAudioUrl - handles null, undefined and empty values', () => {
  assert.strictEqual(resolveAudioUrl(null), '');
  assert.strictEqual(resolveAudioUrl(undefined), '');
  assert.strictEqual(resolveAudioUrl(''), '');
  assert.strictEqual(resolveAudioUrl('   '), '');
});

test('resolveAudioUrl - rewrites docker minio URLs to /s3-upload dev proxy', () => {
  const minioUrl = 'http://minio:9000/englishhub-dev/submissions/258/module-917/audio.webm';
  assert.strictEqual(
    resolveAudioUrl(minioUrl),
    '/s3-upload/englishhub-dev/submissions/258/module-917/audio.webm'
  );

  const minioPresigned = 'http://minio:9000/englishhub-dev/submissions/1/audio.webm?X-Amz-Signature=abc';
  assert.strictEqual(
    resolveAudioUrl(minioPresigned),
    '/s3-upload/englishhub-dev/submissions/1/audio.webm?X-Amz-Signature=abc'
  );
});

test('resolveAudioUrl - preserves absolute HTTPS / HTTP URLs', () => {
  const cdnUrl = 'https://cdn.englishhub.edu.vn/audio/speaking/sample.mp3';
  assert.strictEqual(resolveAudioUrl(cdnUrl), cdnUrl);
});

test('resolveAudioUrl - prefixes relative keys with /s3-upload/englishhub-dev/', () => {
  assert.strictEqual(
    resolveAudioUrl('submissions/258/module-917/audio.webm'),
    '/s3-upload/englishhub-dev/submissions/258/module-917/audio.webm'
  );

  assert.strictEqual(
    resolveAudioUrl('/submissions/258/module-917/audio.webm'),
    '/s3-upload/englishhub-dev/submissions/258/module-917/audio.webm'
  );

  // If already includes bucket name, does not duplicate
  assert.strictEqual(
    resolveAudioUrl('englishhub-dev/submissions/258/module-917/audio.webm'),
    '/s3-upload/englishhub-dev/submissions/258/module-917/audio.webm'
  );
});
