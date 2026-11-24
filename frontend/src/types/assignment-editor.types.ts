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
  promptText: string;
  aiInstruction?: string;
  partType?: SpeakingPartType;
  cueCardTopic?: string;
  cueCardBullets?: string[];
  prepTimeSeconds?: number;
  speakingTimeSeconds?: number;
  maxRetries?: number;
  audioPromptUrl?: string;
  examinerSampleAudioUrl?: string;
  examinerTranscript?: string;
  followUpQuestions?: SpeakingQuestionItem[];
  rubrics?: SpeakingRubricWeights;
  enableAi?: boolean;
  aiModel?: string;
}

// ---------------- READING TYPES ----------------
export interface ReadingParagraph {
  id: string;
  label: string; // 'A', 'B', 'C', 'D', 'E'...
  title?: string;
  content: string;
}

export type ReadingQuestionType = 'multiple_choice' | 'short_answer' | 'true_false_not_given' | 'matching_headings' | 'gap_fill';

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
  passageContent?: string;
  questions: ReadingQuestionItem[];
  paragraphs?: ReadingParagraph[];
  passageSubtitle?: string;
  passageSource?: string;
  timeLimitMinutes?: number;
  enableAiExplanation?: boolean;
  aiInstruction?: string;
}

// ---------------- LISTENING TYPES ----------------
export type ListeningSectionType = 'section1' | 'section2' | 'section3' | 'section4';

export interface ListeningQuestionItem {
  id: string;
  order: number;
  type: 'multiple_choice' | 'short_answer' | 'form_completion' | 'map_labeling';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  section?: ListeningSectionType;
  acceptableAnswers?: string[];
  timestampClue?: string;
}

export interface ListeningConfig {
  audioUrl: string;
  audioFile?: File | null;
  audioPreviewUrl?: string;
  transcript: string;
  questions: ListeningQuestionItem[];
  audioTitle?: string;
  audioDurationSeconds?: number;
  playbackLimit?: 'single' | 'double' | 'unlimited';
  hideTranscriptUntilGraded?: boolean;
  activeSection?: ListeningSectionType;
  enableAiDistractorCheck?: boolean;
  aiInstruction?: string;
}

// ---------------- MODULE ITEM TYPE ----------------
export interface EditorModuleItem {
  id: string; // client UUID (e.g. `mod-${Date.now()}-${idx}`)
  dbId?: number; // backend module id if editing existing
  skill: AssignmentSkill; // 'writing' | 'speaking' | 'reading' | 'listening'
  title?: string; // Optional custom title e.g. "Passage 1", "Task 1: Chart Description"
  orderIndex: number;
  maxScore: number;
  config: WritingConfig | SpeakingConfig | ReadingConfig | ListeningConfig;
}

// ---------------- FACTORY HELPERS ----------------
export function createDefaultWritingConfig(taskType: WritingTaskType = 'task2'): WritingConfig {
  return {
    taskType,
    promptText: '',
    minWords: taskType === 'task1' ? 150 : 250,
    scale: '10',
    rubrics: { tr: 25, cc: 25, lr: 25, gra: 25 },
    enableAi: true,
    aiInstruction: '',
    enablePlagiarismCheck: true,
    modelAnswer: '',
    attachments: []
  };
}

export function createDefaultSpeakingConfig(partType: SpeakingPartType = 'part2'): SpeakingConfig {
  return {
    promptText: '',
    aiInstruction: '',
    partType,
    cueCardTopic: '',
    cueCardBullets: [],
    prepTimeSeconds: 60,
    speakingTimeSeconds: 120,
    maxRetries: 3,
    examinerSampleAudioUrl: '',
    examinerTranscript: '',
    followUpQuestions: [],
    rubrics: { fc: 25, lr: 25, gra: 25, pr: 25 },
    enableAi: true,
    aiModel: 'Whisper V3 Large'
  };
}

export function createDefaultReadingConfig(): ReadingConfig {
  return {
    passageTitle: '',
    passageContent: '',
    questions: [],
    paragraphs: [],
    timeLimitMinutes: 20,
    enableAiExplanation: true,
    aiInstruction: ''
  };
}

export function createDefaultListeningConfig(): ListeningConfig {
  return {
    audioUrl: '',
    transcript: '',
    questions: [],
    audioDurationSeconds: 180,
    playbackLimit: 'double',
    hideTranscriptUntilGraded: true,
    enableAiDistractorCheck: true,
    aiInstruction: ''
  };
}

export function createDefaultModuleItem(
  skill: AssignmentSkill,
  orderIndex: number,
  title?: string
): EditorModuleItem {
  const timestamp = Date.now();
  const id = `mod-${timestamp}-${Math.floor(Math.random() * 1000)}`;
  
  let config: WritingConfig | SpeakingConfig | ReadingConfig | ListeningConfig;
  switch (skill) {
    case 'writing':
      config = createDefaultWritingConfig();
      break;
    case 'speaking':
      config = createDefaultSpeakingConfig();
      break;
    case 'reading':
      config = createDefaultReadingConfig();
      break;
    case 'listening':
      config = createDefaultListeningConfig();
      break;
  }

  return {
    id,
    skill,
    title: title || '',
    orderIndex,
    maxScore: 10,
    config
  };
}

// Combined Assignment Editor State
export interface AssignmentEditorData extends BaseAssignmentData {
  modules: EditorModuleItem[];
  writing?: WritingConfig;
  speaking?: SpeakingConfig;
  reading?: ReadingConfig;
  listening?: ListeningConfig;
}
