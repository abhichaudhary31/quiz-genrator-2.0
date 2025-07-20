
export type QuizMode = 'quiz' | 'learn' | 'focus';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string[];
  hasImage?: boolean;
  pageIndex?: number; // 0-based index from the chunk sent to Gemini
  pageData?: string;  // base64 data URI of the page
}

export interface IncorrectQuizQuestion extends QuizQuestion {
  userAnswers: string[];
}
