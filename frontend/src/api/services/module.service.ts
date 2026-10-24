import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { AssignmentSkill } from './assignment.service';

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
}

export interface CreatedModuleResponse extends MessageResponse {
  id: number;
}

export interface AudioUploadResponse {
  message: string;
  sourceAudioStorageKey: string;
  sourceAudioUploadStatus: string;
}

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

  uploadAudio(
    moduleId: number,
    file: File,
    options?: ApiRequestOptions
  ): Promise<AudioUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AudioUploadResponse>(`/modules/${moduleId}/audio`, formData, {
      ...options,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options?.headers || {}),
      },
    });
  }
}

export const moduleService = new ModuleService();
