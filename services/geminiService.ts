
import { type QuizQuestion } from '../types';

export const generateQuizFromText = async (base64Data: string, mimeType: string): Promise<QuizQuestion[]> => {
  const response = await fetch('/api?path=generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to generate quiz');
  }

  return response.json();
};

export const getExplanationForQuestion = async (question: QuizQuestion): Promise<string> => {
  const response = await fetch('/api?path=get-explanation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to get explanation');
  }

  return response.text();
};

export const getJoke = async (): Promise<string> => {
  const response = await fetch('/api?path=get-joke');

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to get joke');
  }

  return response.text();
};
