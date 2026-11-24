/**
 * Utility functions for object storage operations (S3 / MinIO).
 * Handles URL normalization (Docker MinIO proxying), direct PUT uploads,
 * and direct GET blob fetching from presigned URLs.
 */

/**
 * Normalizes a storage URL or presigned URL for frontend consumption.
 * In dev environments where MinIO runs in Docker ('http://minio:9000/...'),
 * routes through the Vite proxy ('/s3-upload/...') to allow browser access without CORS/DNS issues.
 */
export function normalizeStorageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }
  const cleanUrl = rawUrl.trim();
  if (cleanUrl.includes('//minio:9000/')) {
    return cleanUrl.replace(/^https?:\/\/minio:9000/, '/s3-upload');
  }
  return cleanUrl;
}

/**
 * Uploads raw binary data (Blob or File) directly to a presigned S3/MinIO upload URL.
 * Preserves presigned signature by avoiding backend Authorization headers.
 */
export async function uploadDirectToStorage(
  uploadUrl: string,
  fileOrBlob: Blob | File,
  mimeType?: string
): Promise<void> {
  if (!uploadUrl) {
    throw new Error('Đường dẫn tải lên (uploadUrl) không hợp lệ hoặc bị trống.');
  }

  const targetUrl = normalizeStorageUrl(uploadUrl);
  const resolvedMime = mimeType || (fileOrBlob as Blob).type || 'application/octet-stream';

  const response = await fetch(targetUrl, {
    method: 'PUT',
    body: fileOrBlob,
    headers: {
      'Content-Type': resolvedMime,
    },
  });

  if (!response.ok) {
    throw new Error(`Tải tệp lên kho lưu trữ thất bại (HTTP ${response.status}).`);
  }
}

/**
 * Fetches the binary file content (Blob) directly from a presigned S3/MinIO download URL.
 */
export async function fetchFileBlobFromPresignedUrl(
  downloadUrl: string
): Promise<Blob> {
  if (!downloadUrl) {
    throw new Error('Đường dẫn tải tệp (downloadUrl) không hợp lệ hoặc bị trống.');
  }

  const targetUrl = normalizeStorageUrl(downloadUrl);

  const response = await fetch(targetUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Tải tệp từ kho lưu trữ thất bại (HTTP ${response.status}).`);
  }

  return response.blob();
}
