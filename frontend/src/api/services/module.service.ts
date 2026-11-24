import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { AssignmentSkill } from './assignment.service';
import {
  fetchFileBlobFromPresignedUrl,
  normalizeStorageUrl,
  uploadDirectToStorage,
} from '../../utils/storage.utils';

export type ModuleTaskType = 'QUIZ' | 'REWRITE' | 'RECORDING' | 'ESSAY';

export interface ModuleSummary {
  id: number;
  skill: AssignmentSkill;
  taskType: ModuleTaskType;
  orderIndex: number;
  maxScore: number;
  hasAudio: boolean;
}

export interface ModuleDetailResponse {
  id: number;
  skill: AssignmentSkill;
  taskType: ModuleTaskType;
  orderIndex: number;
  maxScore: number;
  instructions: string;
  aiInstruction?: string;
  sourceAudioStorageKey?: string;
  sourceAudioDurationSeconds?: number;
  sourceAudioMimeType?: string;
  sourceAudioUploadStatus?: string;
  audioDownloadUrl?: string;
  sourceAudioDownloadUrl?: string;
}

export interface ModuleListResponse {
  modules?: ModuleSummary[];
  data?: ModuleSummary[];
}

export interface CreateModulePayload {
  skill: AssignmentSkill;
  taskType: ModuleTaskType;
  orderIndex: number;
  instructions: string;
  aiInstruction?: string;
  maxScore: number;
}

export interface UpdateModulePayload {
  instructions?: string;
  aiInstruction?: string;
  maxScore?: number;
  orderIndex?: number;
}

export interface CreatedModuleResponse extends MessageResponse {
  id: number;
}

export interface AudioDownloadUrlResponse {
  message?: string;
  moduleId: number;
  downloadUrl: string;
  storageKey: string;
  mimeType?: string;
  durationSeconds?: number;
  expiresAt?: string;
}

export interface AudioUploadUrlResponse {
  message?: string;
  moduleId: number;
  uploadUrl: string;
  storageKey: string;
  mimeType?: string;
  expiresAt?: string;
}

export interface AudioUploadConfirmResponse {
  message: string;
  storageKey: string;
  uploadStatus: string;
  /** Backward-compatible alias for sourceAudioStorageKey */
  sourceAudioStorageKey?: string;
  /** Backward-compatible alias for sourceAudioUploadStatus */
  sourceAudioUploadStatus?: string;
}

export type AudioUploadResponse = AudioUploadConfirmResponse;

export class ModuleService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  async listModules(assignmentId: number, options?: ApiRequestOptions): Promise<ModuleListResponse> {
    const res = await this.http.get<ModuleListResponse | ModuleSummary[] | { data?: ModuleSummary[]; modules?: ModuleSummary[] }>(
      `/assignments/${assignmentId}/modules`,
      options
    );
    let items: ModuleSummary[] = [];
    if (Array.isArray(res)) {
      items = res;
    } else if (res && typeof res === 'object') {
      if (Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res.modules)) {
        items = res.modules;
      }
    }
    return {
      modules: items,
      data: items,
    };
  }

  getModule(moduleId: number, options?: ApiRequestOptions): Promise<ModuleDetailResponse> {
    return this.http.get<ModuleDetailResponse>(`/modules/${moduleId}`, options);
  }

  createModule(
    assignmentId: number,
    payload: CreateModulePayload,
    options?: ApiRequestOptions
  ): Promise<CreatedModuleResponse> {
    return this.http.post<CreatedModuleResponse>(`/assignments/${assignmentId}/modules`, payload, options);
  }

  updateModule(
    moduleId: number,
    payload: UpdateModulePayload,
    options?: ApiRequestOptions
  ): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/modules/${moduleId}`, payload, options);
  }

  deleteModule(moduleId: number, options?: ApiRequestOptions): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/modules/${moduleId}`, options);
  }

  /**
   * Step 1: Requests a temporary presigned GET URL to stream or download listening module audio.
   */
  async getAudioDownloadUrl(
    moduleId: number,
    options?: ApiRequestOptions
  ): Promise<AudioDownloadUrlResponse> {
    const res = await this.http.get<AudioDownloadUrlResponse>(
      `/modules/${moduleId}/audio-download-url`,
      options
    );
    return {
      ...res,
      downloadUrl: normalizeStorageUrl(res.downloadUrl),
    };
  }

  /**
   * Consolidated 2-in-1 helper to retrieve the module's audio file as a Blob.
   * Step 1: Calls backend API to create a presigned GET URL.
   * Step 2: Uses the presigned URL to fetch the file binary data (Blob).
   */
  async getAudioFileBlob(
    moduleId: number,
    options?: ApiRequestOptions
  ): Promise<Blob> {
    const { downloadUrl } = await this.getAudioDownloadUrl(moduleId, options);
    return fetchFileBlobFromPresignedUrl(downloadUrl);
  }

  /**
   * Step 1: Requests a temporary presigned PUT URL to upload listening module audio.
   */
  requestAudioUploadUrl(
    moduleId: number,
    mimeType?: string,
    options?: ApiRequestOptions
  ): Promise<AudioUploadUrlResponse> {
    return this.http.post<AudioUploadUrlResponse>(
      `/modules/${moduleId}/audio`,
      mimeType ? { mimeType } : {},
      options
    );
  }

  /**
   * Step 3: Confirms audio upload after direct PUT to object storage finishes.
   */
  async confirmAudioUpload(
    moduleId: number,
    storageKey: string,
    options?: ApiRequestOptions
  ): Promise<AudioUploadConfirmResponse> {
    const res = await this.http.post<AudioUploadConfirmResponse>(
      `/modules/${moduleId}/audio/confirm`,
      { storageKey },
      options
    );
    return {
      ...res,
      sourceAudioStorageKey: res.storageKey,
      sourceAudioUploadStatus: res.uploadStatus,
    };
  }

  /**
   * Consolidated 3-in-1 helper to upload listening module audio.
   * Step 1: Calls API to get presigned PUT URL and storageKey.
   * Step 2: Uploads file binary data directly to the presigned URL.
   * Step 3: Calls API confirm to finalize and verify storage.
   */
  async uploadAudio(
    moduleId: number,
    fileOrBlob: File | Blob,
    mimeTypeOrOptions?: string | ApiRequestOptions,
    options?: ApiRequestOptions
  ): Promise<AudioUploadConfirmResponse> {
    let mimeType: string | undefined;
    let requestOptions: ApiRequestOptions | undefined = options;

    if (typeof mimeTypeOrOptions === 'string') {
      mimeType = mimeTypeOrOptions;
    } else if (mimeTypeOrOptions && typeof mimeTypeOrOptions === 'object') {
      requestOptions = mimeTypeOrOptions;
    }

    const resolvedMime = mimeType || fileOrBlob.type || 'audio/mpeg';
    const { uploadUrl, storageKey } = await this.requestAudioUploadUrl(
      moduleId,
      resolvedMime,
      requestOptions
    );

    await uploadDirectToStorage(uploadUrl, fileOrBlob, resolvedMime);

    return this.confirmAudioUpload(moduleId, storageKey, requestOptions);
  }
}

export const moduleService = new ModuleService();
