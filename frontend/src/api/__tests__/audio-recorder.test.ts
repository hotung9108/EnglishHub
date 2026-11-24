import test from 'node:test';
import assert from 'node:assert/strict';
import { getBackendMimeType } from '../../hooks/useAudioRecorder';

test('getBackendMimeType - normalizes webm, opus, and default audio mime types to audio/webm', () => {
  assert.strictEqual(getBackendMimeType('audio/webm;codecs=opus'), 'audio/webm');
  assert.strictEqual(getBackendMimeType('audio/webm'), 'audio/webm');
  assert.strictEqual(getBackendMimeType('audio/ogg;codecs=opus'), 'audio/webm');
  assert.strictEqual(getBackendMimeType('audio/mp4'), 'audio/webm');
  assert.strictEqual(getBackendMimeType(''), 'audio/webm');
});

test('getBackendMimeType - normalizes wav audio mime types to audio/wav', () => {
  assert.strictEqual(getBackendMimeType('audio/wav'), 'audio/wav');
  assert.strictEqual(getBackendMimeType('audio/x-wav'), 'audio/wav');
});

test('getBackendMimeType - normalizes mpeg and mp3 audio mime types to audio/mpeg', () => {
  assert.strictEqual(getBackendMimeType('audio/mpeg'), 'audio/mpeg');
  assert.strictEqual(getBackendMimeType('audio/mp3'), 'audio/mpeg');
});
