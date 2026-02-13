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

// ─── Annotated PDF Export Types ─────────────────────

export interface BoundingBox {
  x: number; // left edge, % of page width  (0–100)
  y: number; // top edge, % of page height  (0–100)
  w: number; // width, % of page width
  h: number; // height, % of page height
}

export interface AnswerLocations {
  [questionKey: string]: {
    [optionLabel: string]: BoundingBox;
  };
}
