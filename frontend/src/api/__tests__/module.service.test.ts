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

test('ModuleService - uploadAudio sends FormData to /modules/:moduleId/audio', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ModuleService(mockHttp);

  mockHttp.mockResponse = {
    message: 'Upload audio thành công.',
    sourceAudioStorageKey: 'modules/131/audio/sample.mp3',
    sourceAudioUploadStatus: 'READY',
  };

  const fakeFile = new File(['fake-audio-bytes'], 'test.mp3', { type: 'audio/mp3' });
  const uploadRes = await service.uploadAudio(131, fakeFile);

  assert.strictEqual(mockHttp.calls[0].url, '/modules/131/audio');
  assert.strictEqual(mockHttp.calls[0].method, 'POST');
  assert.strictEqual(uploadRes.sourceAudioStorageKey, 'modules/131/audio/sample.mp3');
  assert.strictEqual(uploadRes.sourceAudioUploadStatus, 'READY');
});
