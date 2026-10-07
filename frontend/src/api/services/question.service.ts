import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';

export interface QuestionResponse {
  id: number;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  correctAnswer?: Record<string, unknown> | null;
}

export interface QuestionListResponse {
  questions: QuestionResponse[];
}

export interface CreateQuestionPayload {
  content: string;
  questionType: QuestionType;
  correctAnswer: Record<string, unknown>;
  score: number;
  orderIndex: number;
}

export interface UpdateQuestionPayload {
  content?: string;
  correctAnswer?: Record<string, unknown>;
  score?: number;
  orderIndex?: number;
}

export interface CreatedQuestionResponse extends MessageResponse {
  id: number;
}

export class QuestionService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  listQuestions(moduleId: number, options?: ApiRequestOptions): Promise<QuestionListResponse> {
    return this.http.get<QuestionListResponse>(`/modules/${moduleId}/questions`, options);
  }

  getQuestion(questionId: number, options?: ApiRequestOptions): Promise<QuestionResponse> {
    return this.http.get<QuestionResponse>(`/questions/${questionId}`, options);
  }

  createQuestion(
    moduleId: number,
    payload: CreateQuestionPayload,
    options?: ApiRequestOptions
  ): Promise<CreatedQuestionResponse> {
    return this.http.post<CreatedQuestionResponse>(`/modules/${moduleId}/questions`, payload, options);
  }

  updateQuestion(
    questionId: number,
    payload: UpdateQuestionPayload,
    options?: ApiRequestOptions
  ): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/questions/${questionId}`, payload, options);
  }

  deleteQuestion(questionId: number, options?: ApiRequestOptions): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/questions/${questionId}`, options);
  }
}

export const questionService = new QuestionService();
