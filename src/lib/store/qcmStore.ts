import { create } from "zustand";
import type { Question, StudentResult, AnswerKey } from "@/lib/types/qcm";

export interface QCMState {
  // Files
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;

  // Extraction
  extractedQuestions: Question[];
  setExtractedQuestions: (questions: Question[]) => void;
  updateQuestion: (index: number, question: Question) => void;

  // Answer key (barème)
  answerKey: AnswerKey;
  setAnswerKey: (key: AnswerKey) => void;
  updateAnswerKey: (questionKey: string, answer: string) => void;

  // Grading
  gradingResults: StudentResult[];
  setGradingResults: (results: StudentResult[]) => void;

  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;

  // Reset
  resetSession: () => void;
}

export const useQCMStore = create<QCMState>((set) => ({
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

  resetSession: () =>
    set({
      uploadedFiles: [],
      extractedQuestions: [],
      answerKey: {},
      gradingResults: [],
      isLoading: false,
      loadingMessage: "",
    }),
}));
