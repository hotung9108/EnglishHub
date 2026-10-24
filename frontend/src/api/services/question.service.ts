import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER';

export interface MultipleChoiceOptionDto {
  id: number;
  content: string;
  isCorrect: boolean;
}

export interface MultipleChoiceCorrectAnswerDto {
  options: MultipleChoiceOptionDto[];
}

export interface ShortAnswerCorrectAnswerDto {
  correctAnswer: string;
}

export interface QuestionOptionResponse {
  id: number;
  content: string;
}

export interface QuestionResponse {
  id: number;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options?: QuestionOptionResponse[];
  correctAnswer?: Record<string, unknown> | null;
}

export interface QuestionListResponse {
  questions: QuestionResponse[];
  data?: QuestionResponse[];
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

/**
 * Helper to build a valid MULTIPLE_CHOICE payload according to backend validation rules:
 * - Exactly 4 options with id (1..4), non-blank content, isCorrect boolean.
 * - Exactly one option has isCorrect: true.
 * - Score defaults to 1, orderIndex > 0.
 */
export function buildMcqPayload(params: {
  content: string;
  options?: string[];
  correctOptionIndexOrText?: number | string;
  score?: number;
  orderIndex: number;
}): CreateQuestionPayload {
  const rawContent = (params.content || '').trim();
  const content = rawContent || `Câu hỏi ${params.orderIndex}`;
  const rawOptions = (params.options || []).map((o) => (o || '').trim());

  // Ensure exactly 4 options
  const defaultLabels = ['A', 'B', 'C', 'D'];
  const fixedOptions: string[] = [];
  for (let i = 0; i < 4; i++) {
    const val = rawOptions[i];
    fixedOptions.push(val && val.length > 0 ? val : `Lựa chọn ${defaultLabels[i]}`);
  }

  // Determine correct option index (0..3)
  let correctIdx = 0;
  const target = params.correctOptionIndexOrText;

  if (typeof target === 'number' && target >= 0 && target < 4) {
    correctIdx = target;
  } else if (typeof target === 'string') {
    const trimmedTarget = target.trim();
    // Check if matching option text exactly
    const foundByText = fixedOptions.findIndex((opt) => opt.toLowerCase() === trimmedTarget.toLowerCase());
    if (foundByText !== -1) {
      correctIdx = foundByText;
    } else {
      // Check if target is 'A', 'B', 'C', 'D' or '1', '2', '3', '4'
      const upperTarget = trimmedTarget.toUpperCase();
      const letterIdx = ['A', 'B', 'C', 'D'].indexOf(upperTarget);
      if (letterIdx !== -1) {
        correctIdx = letterIdx;
      } else {
        const numIdx = parseInt(trimmedTarget, 10);
        if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= 4) {
          correctIdx = numIdx - 1;
        }
      }
    }
  }

  const optionDtos: MultipleChoiceOptionDto[] = fixedOptions.map((optContent, idx) => ({
    id: idx + 1,
    content: optContent,
    isCorrect: idx === correctIdx,
  }));

  const validScore = params.score && params.score > 0 ? Number(params.score) : 1;
  const validOrder = params.orderIndex > 0 ? params.orderIndex : 1;

  return {
    content,
    questionType: 'MULTIPLE_CHOICE',
    score: validScore,
    orderIndex: validOrder,
    correctAnswer: {
      options: optionDtos,
    },
  };
}

/**
 * Helper to build a valid SHORT_ANSWER payload according to backend validation rules:
 * - correctAnswer contains a non-blank string.
 * - Score defaults to 1, orderIndex > 0.
 */
export function buildShortAnswerPayload(params: {
  content: string;
  answerText: string;
  score?: number;
  orderIndex: number;
}): CreateQuestionPayload {
  const rawContent = (params.content || '').trim();
  const content = rawContent || `Câu hỏi ${params.orderIndex}`;
  const rawAnswer = (params.answerText || '').trim();
  const answer = rawAnswer || 'N/A';

  const validScore = params.score && params.score > 0 ? Number(params.score) : 1;
  const validOrder = params.orderIndex > 0 ? params.orderIndex : 1;

  return {
    content,
    questionType: 'SHORT_ANSWER',
    score: validScore,
    orderIndex: validOrder,
    correctAnswer: {
      correctAnswer: answer,
    },
  };
}

/**
 * Extract multiple choice options safely from a QuestionResponse's correctAnswer map.
 */
export function extractMcqOptions(correctAnswer?: Record<string, unknown> | null): {
  options: string[];
  correctOptionContent: string;
  correctOptionIndex: number;
} {
  const defaultResult = {
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctOptionContent: 'Option A',
    correctOptionIndex: 0,
  };

  if (!correctAnswer || typeof correctAnswer !== 'object') {
    return defaultResult;
  }

  const rawList = correctAnswer.options || (correctAnswer as Record<string, unknown>).options;
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return defaultResult;
  }

  const options: string[] = [];
  let correctOptionContent = '';
  let correctOptionIndex = 0;

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i] as Record<string, unknown>;
    const text = String(item.content || item.text || `Option ${String.fromCharCode(65 + i)}`);
    options.push(text);
    const isCorrect = item.isCorrect === true || item.is_correct === true;
    if (isCorrect) {
      correctOptionContent = text;
      correctOptionIndex = i;
    }
  }

  // Ensure 4 items
  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }

  if (!correctOptionContent && options.length > 0) {
    correctOptionContent = options[0];
    correctOptionIndex = 0;
  }

  return {
    options: options.slice(0, 4),
    correctOptionContent,
    correctOptionIndex,
  };
}

/**
 * Extract short answer string safely from a QuestionResponse's correctAnswer map.
 */
export function extractShortAnswerText(correctAnswer?: Record<string, unknown> | null): string {
  if (!correctAnswer || typeof correctAnswer !== 'object') {
    return '';
  }
  const answer =
    correctAnswer.correctAnswer ||
    correctAnswer.correct_answer ||
    correctAnswer.text ||
    '';
  return String(answer).trim();
}

export class QuestionService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  async listQuestions(moduleId: number, options?: ApiRequestOptions): Promise<QuestionListResponse> {
    const res = await this.http.get<QuestionListResponse>(`/modules/${moduleId}/questions`, options);
    const items = res.questions || res.data || (Array.isArray(res) ? (res as QuestionResponse[]) : []);
    return {
      data: items,
      questions: items,
    };
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
