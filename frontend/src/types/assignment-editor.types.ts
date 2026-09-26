export type AssignmentSkill = 'writing' | 'speaking' | 'reading' | 'listening';

export type AssignmentStatus = 'active' | 'draft' | 'closed';

export interface BaseAssignmentData {
  id: string;
  code: string;
  title: string;
  skill: AssignmentSkill;
  className: string;
  startDate: string;
  dueDate: string;
  durationMinutes?: number;
  allowLate: boolean;
  status: AssignmentStatus;
  targetAudience: 'all' | 'specific';
  notifyStudents: boolean;
  maxSubmissions?: number;
}

// ---------------- WRITING TYPES ----------------
export type WritingTaskType = 'task1' | 'task2' | 'custom';

export interface WritingRubricWeights {
  tr: number; // Task Response / Achievement
  cc: number; // Coherence & Cohesion
  lr: number; // Lexical Resource
  gra: number; // Grammatical Range & Accuracy
}

export interface WritingConfig {
  taskType: WritingTaskType;
  promptText: string;
  minWords: number;
  targetWords?: number;
  scale: string; // '9.0', '10', '100'
  rubrics: WritingRubricWeights;
  enableAi: boolean;
  aiInstruction: string;
  enablePlagiarismCheck: boolean;
  modelAnswer: string;
  chartImageUrl?: string;
  attachments: Array<{
    id: string;
    name: string;
    size: string;
    extension: string;
  }>;
}

// ---------------- SPEAKING TYPES ----------------
export type SpeakingPartType = 'part1' | 'part2' | 'part3' | 'full';

export interface SpeakingQuestionItem {
  id: string;
  question: string;
  hint?: string;
  order: number;
}

export interface SpeakingRubricWeights {
  fc: number; // Fluency & Coherence
  lr: number; // Lexical Resource
  gra: number; // Grammatical Range & Accuracy
  pr: number; // Pronunciation
}

export interface SpeakingConfig {
  partType: SpeakingPartType;
  cueCardTopic: string;
  cueCardBullets: string[];
  prepTimeSeconds: number;
  speakingTimeSeconds: number;
  maxRetries: number;
  audioPromptUrl?: string;
  examinerSampleAudioUrl?: string;
  examinerTranscript?: string;
  followUpQuestions: SpeakingQuestionItem[];
  rubrics: SpeakingRubricWeights;
  enableAi: boolean;
  aiModel: string;
  aiInstruction: string;
}

// ---------------- READING TYPES ----------------
export interface ReadingParagraph {
  id: string;
  label: string; // 'A', 'B', 'C', 'D', 'E'...
  title?: string;
  content: string;
}

export type ReadingQuestionType = 'multiple_choice' | 'true_false_not_given' | 'matching_headings' | 'gap_fill';

export interface ReadingQuestionItem {
  id: string;
  order: number;
  type: ReadingQuestionType;
  prompt: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation?: string;
  paragraphRef?: string; // 'A', 'B', etc.
  points: number;
  wordLimit?: number; // for gap fill (e.g. 2 words)
}

export interface ReadingConfig {
  passageTitle: string;
  passageSubtitle: string;
  passageSource: string;
  paragraphs: ReadingParagraph[];
  questions: ReadingQuestionItem[];
  timeLimitMinutes: number;
  enableAiExplanation: boolean;
  aiInstruction: string;
}

// ---------------- LISTENING TYPES ----------------
export type ListeningSectionType = 'section1' | 'section2' | 'section3' | 'section4';

export interface ListeningQuestionItem {
  id: string;
  order: number;
  section: ListeningSectionType;
  type: 'form_completion' | 'multiple_choice' | 'map_labeling' | 'short_answer';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  acceptableAnswers?: string[];
  timestampClue?: string; // e.g. "01:45"
  points: number;
}

export interface ListeningConfig {
  audioTitle: string;
  audioUrl: string;
  audioDurationSeconds: number;
  playbackLimit: 'single' | 'double' | 'unlimited';
  transcript: string;
  hideTranscriptUntilGraded: boolean;
  activeSection: ListeningSectionType;
  questions: ListeningQuestionItem[];
  enableAiDistractorCheck: boolean;
  aiInstruction: string;
}

// Combined Assignment Editor State
export interface AssignmentEditorData extends BaseAssignmentData {
  writing: WritingConfig;
  speaking: SpeakingConfig;
  reading: ReadingConfig;
  listening: ListeningConfig;
}
