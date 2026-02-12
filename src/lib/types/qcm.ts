// ─── QCM Domain Types ───────────────────────────────

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  number: number;
  text: string;
  options: QuestionOption[];
}

export interface GradeDetail {
  given: string;
  correct: string;
  isCorrect: boolean;
}

export interface StudentResult {
  filename: string;
  score: number;
  total: number;
  details: Record<string, GradeDetail>;
}

export type AnswerKey = Record<string, string>;

export interface ExtractionResult {
  questions: Question[];
}

export interface GradingInput {
  answerKey: AnswerKey;
  questions: Question[];
}

export interface GradingResult {
  results: StudentResult[];
}

export interface ExportInput {
  results: StudentResult[];
  questions: Question[];
}
