export type ExamSkill = 'writing' | 'speaking' | 'reading' | 'listening';

export type ExamFormat = 
  | 'IELTS Academic' 
  | 'IELTS General' 
  | 'Cambridge 15-19' 
  | 'TOEIC 750+' 
  | 'VSTEP B2-C1';

export type ExamDifficulty = 
  | 'Band 5.5 - 6.5' 
  | 'Band 6.0 - 7.0'
  | 'Band 6.5 - 7.5' 
  | 'Band 7.5 - 8.5+' 
  | 'All Levels';

export interface ExamTemplateItem {
  id: string;
  code: string;
  skill: ExamSkill;
  title: string;
  description: string;
  format: ExamFormat;
  targetBand: ExamDifficulty;
  durationMinutes: number;
  questionCount: number | string;
  tags: string[];
  usageCount: number;
  rating: number;
  source: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  details: {
    prompt?: string;
    taskType?: string;
    minWords?: number;
    cueCard?: {
      topic: string;
      bullets: string[];
      prepTimeSeconds: number;
      speakingTimeSeconds: number;
    };
    passage?: {
      title: string;
      paragraphs: Array<{ label: string; text: string }>;
    };
    audio?: {
      title: string;
      duration: string;
      sectionsCount: number;
    };
    questionsPreview?: Array<{
      id: string;
      prompt: string;
      type: string;
      clue?: string;
    }>;
    rubricsSummary?: string;
    modelAnswerSummary?: string;
  };
}

export interface QuickAssignForm {
  templateId: string;
  className: string;
  assignmentTitle: string;
  assignmentCode: string;
  startDate: string;
  dueDate: string;
  allowLate: boolean;
  notifyStudents: boolean;
}
