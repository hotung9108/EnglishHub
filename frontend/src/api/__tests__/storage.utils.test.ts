import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchFileBlobFromPresignedUrl,
  normalizeStorageUrl,
  uploadDirectToStorage,
} from '../../utils/storage.utils';

test('normalizeStorageUrl - rewrites docker minio URLs to /s3-upload proxy', () => {
  assert.strictEqual(
    normalizeStorageUrl('http://minio:9000/englishhub-dev/modules/1/audio.mp3'),
    '/s3-upload/englishhub-dev/modules/1/audio.mp3'
  );
  assert.strictEqual(
    normalizeStorageUrl('https://minio:9000/bucket/file.pdf?X-Amz-Signature=123'),
    '/s3-upload/bucket/file.pdf?X-Amz-Signature=123'
  );
});

test('normalizeStorageUrl - leaves regular S3 and relative URLs untouched', () => {
  assert.strictEqual(
    normalizeStorageUrl('https://my-bucket.s3.amazonaws.com/audio.mp3'),
    'https://my-bucket.s3.amazonaws.com/audio.mp3'
  );
  assert.strictEqual(
    normalizeStorageUrl('/s3-upload/custom/path.webm'),
    '/s3-upload/custom/path.webm'
  );
  assert.strictEqual(normalizeStorageUrl(''), '');
  assert.strictEqual(normalizeStorageUrl(null), '');
  assert.strictEqual(normalizeStorageUrl(undefined), '');
});

test('uploadDirectToStorage - throws error when uploadUrl is missing', async () => {
  await assert.rejects(
    async () => {
      await uploadDirectToStorage('', new Blob(['123']));
    },
    /Đường dẫn tải lên \(uploadUrl\) không hợp lệ hoặc bị trống\./
  );
});

test('uploadDirectToStorage - performs PUT request and throws on non-2xx status', async () => {
  const originalFetch = globalThis.fetch;
  let sentMethod = '';
  let sentBody: unknown = null;
  let sentContentType = '';

  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    sentMethod = init?.method || '';
    sentBody = init?.body;
    sentContentType = (init?.headers as Record<string, string>)?.['Content-Type'] || '';
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  try {
    const dummyBlob = new Blob(['sample-data'], { type: 'audio/wav' });
    await uploadDirectToStorage('https://s3.example.com/upload', dummyBlob);

    assert.strictEqual(sentMethod, 'PUT');
    assert.strictEqual(sentContentType, 'audio/wav');
    assert.strictEqual(sentBody, dummyBlob);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchFileBlobFromPresignedUrl - throws when downloadUrl is missing', async () => {
  await assert.rejects(
    async () => {
      await fetchFileBlobFromPresignedUrl('');
    },
    /Đường dẫn tải tệp \(downloadUrl\) không hợp lệ hoặc bị trống\./
  );
});

test('fetchFileBlobFromPresignedUrl - retrieves blob successfully and throws on HTTP error', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (url: string | URL | Request) => {
    if (String(url).includes('fail')) {
      return new Response(null, { status: 404 });
    }
    return new Response(new Blob(['hello-world'], { type: 'text/plain' }), { status: 200 });
  }) as typeof fetch;

  try {
    const blob = await fetchFileBlobFromPresignedUrl('http://minio:9000/bucket/file.txt');
    assert.strictEqual(blob.size, 11);

    await assert.rejects(
      async () => {
        await fetchFileBlobFromPresignedUrl('https://example.com/fail.txt');
      },
      /Tải tệp từ kho lưu trữ thất bại \(HTTP 404\)\./
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
