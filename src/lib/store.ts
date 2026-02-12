import { create } from "zustand";

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

export interface AppState {
  // Upload
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;

  // Extraction (QCM structure only)
  extractedQuestions: Question[];
  setExtractedQuestions: (questions: Question[]) => void;
  updateQuestion: (index: number, question: Question) => void;

  // Answer key (barème)
  answerKey: Record<string, string>;
  setAnswerKey: (key: Record<string, string>) => void;
  updateAnswerKey: (questionKey: string, answer: string) => void;

  // Grading results
  gradingResults: StudentResult[];
  setGradingResults: (results: StudentResult[]) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;

  // Reset
  resetAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  uploadedFiles: [],
  setUploadedFiles: (files) => set({ uploadedFiles: files }),

  extractedQuestions: [],
  setExtractedQuestions: (questions) => set({ extractedQuestions: questions }),
  updateQuestion: (index, question) =>
    set((state) => {
      const questions = [...state.extractedQuestions];
      questions[index] = question;
      return { extractedQuestions: questions };
    }),

  answerKey: {},
  setAnswerKey: (key) => set({ answerKey: key }),
  updateAnswerKey: (questionKey, answer) =>
    set((state) => ({
      answerKey: { ...state.answerKey, [questionKey]: answer },
    })),

  gradingResults: [],
  setGradingResults: (results) => set({ gradingResults: results }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  loadingMessage: "",
  setLoadingMessage: (message) => set({ loadingMessage: message }),

  resetAll: () =>
    set({
      uploadedFiles: [],
      extractedQuestions: [],
      answerKey: {},
      gradingResults: [],
      isLoading: false,
      loadingMessage: "",
    }),
}));
