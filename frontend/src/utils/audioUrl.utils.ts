/**
 * Utility for resolving audio URLs in EnglishHub.
 * Handles:
 * - Empty / null / undefined keys gracefully -> returns ''
 * - Presigned URLs or full URLs (e.g. from CDN or S3)
 * - Internal Docker MinIO hosts ('http://minio:9000/...') rewritten to Vite dev proxy '/s3-upload/...'
 * - Relative storage keys (e.g. 'submissions/258/module-917/audio.webm') prepended with the dev bucket '/s3-upload/englishhub-dev/...'
 * - Preserves existing bucket prefix if key already contains 'englishhub-dev/'
 */
export function resolveAudioUrl(storageKey?: string | null): string {
  if (!storageKey || storageKey.trim().length === 0) {
    return '';
  }

  const cleanKey = storageKey.trim();

  // 1. If URL targets Docker MinIO internal host, route through Vite dev proxy so browser can resolve
  if (cleanKey.includes('//minio:9000/')) {
    return cleanKey.replace(/^https?:\/\/minio:9000/, '/s3-upload');
  }

  // 2. If already an absolute HTTP/HTTPS URL (external CDN or S3), return as is
  if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
    return cleanKey;
  }

  // 3. For relative storage keys, ensure proper Vite dev proxy and bucket prefix
  const normalizedKey = cleanKey.replace(/^\/+/, '');
  const bucketPrefix = normalizedKey.startsWith('englishhub-dev/') ? '' : 'englishhub-dev/';
  return `/s3-upload/${bucketPrefix}${normalizedKey}`;
}
