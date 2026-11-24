import test from 'node:test';
import assert from 'node:assert/strict';
import { ModuleService, type ModuleSummary } from '../services/module.service';
import { MockHttpClient } from './helpers/mock-http-client';

test('ModuleService - listModules normalizes backend response returning { data: [...] }', async () => {
  const mockHttp = new MockHttpClient();
  const mockModules: ModuleSummary[] = [
    {
      id: 131,
      skill: 'READING',
      taskType: 'QUIZ',
      orderIndex: 1,
      maxScore: 10,
      hasAudio: false,
    },
  ];

  mockHttp.mockResponse = { data: mockModules };

  const service = new ModuleService(mockHttp);
  const result = await service.listModules(82);

  assert.strictEqual(mockHttp.calls[0].url, '/assignments/82/modules');
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.deepStrictEqual(result.modules, mockModules);
  assert.deepStrictEqual(result.data, mockModules);
});

test('ModuleService - listModules handles standard { modules: [...] } shape', async () => {
  const mockHttp = new MockHttpClient();
  const mockModules: ModuleSummary[] = [
    {
      id: 132,
      skill: 'LISTENING',
      taskType: 'QUIZ',
      orderIndex: 1,
      maxScore: 10,
      hasAudio: true,
    },
  ];

  mockHttp.mockResponse = { modules: mockModules };

  const service = new ModuleService(mockHttp);
  const result = await service.listModules(85);

  assert.strictEqual(mockHttp.calls[0].url, '/assignments/85/modules');
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.deepStrictEqual(result.modules, mockModules);
  assert.deepStrictEqual(result.data, mockModules);
});

test('ModuleService - getModule, createModule, updateModule, and deleteModule', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ModuleService(mockHttp);

  mockHttp.mockResponse = {
    id: 131,
    skill: 'READING',
    taskType: 'QUIZ',
    orderIndex: 1,
    maxScore: 10,
    instructions: 'Read passage carefully',
  };
  const detail = await service.getModule(131);
  assert.strictEqual(mockHttp.calls[0].url, '/modules/131');
  assert.strictEqual(detail.id, 131);
  assert.strictEqual(detail.instructions, 'Read passage carefully');

  mockHttp.mockResponse = {
    id: 132,
    message: 'Module created successfully',
  };
  const created = await service.createModule(82, {
    skill: 'READING',
    taskType: 'QUIZ',
    orderIndex: 2,
    instructions: 'Passage 2',
    maxScore: 10,
  });
  assert.strictEqual(mockHttp.calls[1].url, '/assignments/82/modules');
  assert.strictEqual(created.id, 132);

  mockHttp.mockResponse = { message: 'Module updated successfully' };
  const updated = await service.updateModule(131, { instructions: 'Updated instructions' });
  assert.strictEqual(mockHttp.calls[2].url, '/modules/131');
  assert.strictEqual(updated.message, 'Module updated successfully');

  mockHttp.mockResponse = { message: 'Module deleted successfully' };
  const deleted = await service.deleteModule(131);
  assert.strictEqual(mockHttp.calls[3].url, '/modules/131');
  assert.strictEqual(deleted.message, 'Module deleted successfully');
});

test('ModuleService - getAudioDownloadUrl returns presigned download URL', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ModuleService(mockHttp);

  mockHttp.mockResponse = {
    message: 'Lấy link tải audio thành công.',
    moduleId: 131,
    downloadUrl: 'http://minio:9000/englishhub-dev/modules/131/audio.mp3',
    storageKey: 'modules/131/audio.mp3',
    mimeType: 'audio/mpeg',
    durationSeconds: 120,
    expiresAt: '2026-11-07T12:00:00Z',
  };

  const res = await service.getAudioDownloadUrl(131);

  assert.strictEqual(mockHttp.calls[0].url, '/modules/131/audio-download-url');
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.strictEqual(res.moduleId, 131);
  // MinIO internal host is rewritten to Vite /s3-upload proxy
  assert.strictEqual(res.downloadUrl, '/s3-upload/englishhub-dev/modules/131/audio.mp3');
});

test('ModuleService - getAudioFileBlob retrieves Blob in 1 call (consolidated 2-in-1)', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ModuleService(mockHttp);

  mockHttp.mockResponse = {
    moduleId: 131,
    downloadUrl: 'https://s3.example.com/modules/131/audio.mp3',
    storageKey: 'modules/131/audio.mp3',
  };

  const originalFetch = globalThis.fetch;
  let fetchTargetUrl = '';
  globalThis.fetch = (async (url: string | URL | Request) => {
    fetchTargetUrl = String(url);
    return new Response(new Blob(['fake-audio-bytes'], { type: 'audio/mpeg' }), { status: 200 });
  }) as typeof fetch;

  try {
    const blob = await service.getAudioFileBlob(131);
    assert.strictEqual(mockHttp.calls[0].url, '/modules/131/audio-download-url');
    assert.strictEqual(fetchTargetUrl, 'https://s3.example.com/modules/131/audio.mp3');
    assert.strictEqual(blob.size, 16);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ModuleService - requestAudioUploadUrl and confirmAudioUpload direct calls', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ModuleService(mockHttp);

  mockHttp.mockResponse = {
    message: 'Lấy link upload audio thành công.',
    moduleId: 131,
    uploadUrl: 'https://s3.example.com/upload-target',
    storageKey: 'modules/131/audio/sample.mp3',
  };

  const reqRes = await service.requestAudioUploadUrl(131, 'audio/mpeg');
  assert.strictEqual(mockHttp.calls[0].url, '/modules/131/audio');
  assert.deepStrictEqual(mockHttp.calls[0].data, { mimeType: 'audio/mpeg' });
  assert.strictEqual(reqRes.uploadUrl, 'https://s3.example.com/upload-target');

  mockHttp.mockResponse = {
    message: 'Xác nhận upload audio thành công.',
    storageKey: 'modules/131/audio/sample.mp3',
    uploadStatus: 'READY',
  };

  const confirmRes = await service.confirmAudioUpload(131, 'modules/131/audio/sample.mp3');
  assert.strictEqual(mockHttp.calls[1].url, '/modules/131/audio/confirm');
  assert.deepStrictEqual(mockHttp.calls[1].data, { storageKey: 'modules/131/audio/sample.mp3' });
  assert.strictEqual(confirmRes.storageKey, 'modules/131/audio/sample.mp3');
  assert.strictEqual(confirmRes.uploadStatus, 'READY');
  assert.strictEqual(confirmRes.sourceAudioStorageKey, 'modules/131/audio/sample.mp3');
  assert.strictEqual(confirmRes.sourceAudioUploadStatus, 'READY');
});

test('ModuleService - uploadAudio executes 3-in-1 consolidated flow (request, put, confirm)', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ModuleService(mockHttp);

  mockHttp.responsesByUrl = {
    '/modules/131/audio': {
      message: 'Lấy link upload audio thành công.',
      moduleId: 131,
      uploadUrl: 'http://minio:9000/englishhub-dev/modules/131/sample.mp3',
      storageKey: 'modules/131/audio/sample.mp3',
    },
    '/modules/131/audio/confirm': {
      message: 'Xác nhận upload audio thành công.',
      storageKey: 'modules/131/audio/sample.mp3',
      uploadStatus: 'READY',
    },
  };

  const originalFetch = globalThis.fetch;
  let putTargetUrl = '';
  let putMethod = '';
  let putContentType = '';

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    putTargetUrl = String(url);
    putMethod = init?.method || '';
    putContentType = (init?.headers as Record<string, string>)?.['Content-Type'] || '';
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  try {
    const fakeFile = new File(['fake-audio-bytes'], 'test.mp3', { type: 'audio/mpeg' });
    const uploadRes = await service.uploadAudio(131, fakeFile);

    // Step 1: POST /modules/131/audio
    assert.strictEqual(mockHttp.calls[0].url, '/modules/131/audio');
    assert.strictEqual(mockHttp.calls[0].method, 'POST');
    assert.deepStrictEqual(mockHttp.calls[0].data, { mimeType: 'audio/mpeg' });

    // Step 2: PUT directly to S3 storage via proxy rewrite
    assert.strictEqual(putTargetUrl, '/s3-upload/englishhub-dev/modules/131/sample.mp3');
    assert.strictEqual(putMethod, 'PUT');
    assert.strictEqual(putContentType, 'audio/mpeg');

    // Step 3: POST /modules/131/audio/confirm
    assert.strictEqual(mockHttp.calls[1].url, '/modules/131/audio/confirm');
    assert.strictEqual(mockHttp.calls[1].method, 'POST');
    assert.deepStrictEqual(mockHttp.calls[1].data, { storageKey: 'modules/131/audio/sample.mp3' });

    // Response contains storageKey & READY status (plus backward-compatible fields)
    assert.strictEqual(uploadRes.storageKey, 'modules/131/audio/sample.mp3');
    assert.strictEqual(uploadRes.uploadStatus, 'READY');
    assert.strictEqual(uploadRes.sourceAudioStorageKey, 'modules/131/audio/sample.mp3');
    assert.strictEqual(uploadRes.sourceAudioUploadStatus, 'READY');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
