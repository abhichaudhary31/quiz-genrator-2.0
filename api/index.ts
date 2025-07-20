import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { type QuizQuestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

const isRateLimitError = (error: any): boolean => {
  if (error instanceof Error && error.message) {
    if (error.message.includes('429') && error.message.includes('RESOURCE_EXHAUSTED')) {
      return true;
    }
  }
  return false;
}

const formatError = (error: any, defaultMessage: string): Error => {
    if (error instanceof Error) {
        try {
            const parsed = JSON.parse(error.message);
            if(parsed.error && parsed.error.message) {
                 return new Error(`${defaultMessage}: ${parsed.error.message}`);
            }
        } catch(e) {
        }
        return new Error(`${defaultMessage}: ${error.message}`);
    }
    return new Error("An unknown error occurred.");
}

async function handleGenerateQuiz(req: VercelRequest, res: VercelResponse) {
    const { base64Data, mimeType } = req.body;
    const maxRetries = 3;
    const initialDelay = 2000;
    let retries = 0;

    const quizSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.ARRAY, items: { type: Type.STRING } },
            pageIndex: { type: Type.INTEGER },
            hasImage: { type: Type.BOOLEAN }
          },
          required: ['question', 'options', 'answer', 'pageIndex', 'hasImage'],
        },
    };

    const prompt = `
      You are an expert quiz generator. Your task is to analyze the provided PDF document and extract multiple-choice questions (MCQs) to create a quiz.

      Follow these rules strictly:
      1.  **Identify MCQs:** Find all questions that have a list of options.
      2.  **Extract All Options:** You MUST extract all provided options for each question. For example, if a question has two options (like True/False), you must include both "True" and "False" in the options array. Do not omit any options.
      3.  **Determine Correct Answers with High Accuracy:** Your primary goal is to be correct.
          *   A question may have one or more correct answers.
          *   **Step 1: Look for Explicit Markers.** First, try to identify the correct answer(s) based on explicit markings in the text. Common markers are **bold text**, an underline, or an asterisk (*). If you find marked answers, use them as the source of truth.
          *   **Step 2: Fallback to General Knowledge.** If, and only if, a question has **NO explicit markers** for any of its options, you should use your own knowledge to determine the correct answer(s).
          *   **Step 3: Handle Ambiguity.** If a question is ambiguous or you cannot confidently determine an answer (either from markers or knowledge), return an empty array \`[]\` for the 'answer' field. This should be a last resort. Do not guess randomly.
          *   Ensure you extract ALL correct answers for a question.
      4.  **Format Output:** Return the data ONLY in the requested JSON format. Your entire response must be the JSON array object and nothing else.
      5.  **Page and Image References:** For each question, you MUST identify its 0-based page index within the provided PDF chunk. Also, determine if the question explicitly refers to an image or exhibit and set the 'hasImage' flag accordingly.
    `;
    
    while(retries < maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType: mimeType } },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: quizSchema,
          },
        });

        const jsonString = response.text;
        if (!jsonString) {
          throw new Error("API response is empty.");
        }
        const quizData = JSON.parse(jsonString);

         if (!Array.isArray(quizData)) {
          throw new Error("API response is not in the expected array format.");
        }
      
        const validatedData = quizData.filter(item => 
          item.question && 
          Array.isArray(item.options) && 
          item.options.length > 1 && 
          Array.isArray(item.answer) &&
          typeof item.pageIndex === 'number' &&
          typeof item.hasImage === 'boolean'
        ) as QuizQuestion[];

        return res.status(200).json(validatedData);

      } catch (error) {
        retries++;
        if (isRateLimitError(error) && retries < maxRetries) {
            const delay = initialDelay * Math.pow(2, retries - 1);
            await new Promise(res => setTimeout(res, delay));
        } else {
            const formattedError = formatError(error, "Failed to generate quiz");
            return res.status(500).send(formattedError.message);
        }
      }
    }
    return res.status(500).send("Failed to generate quiz after multiple retries.");
}

async function handleGetExplanation(req: VercelRequest, res: VercelResponse) {
    const { question } = req.body as { question: QuizQuestion };
    const maxRetries = 3;
    const initialDelay = 1000;
    let retries = 0;
  
    while(retries < maxRetries) {
      try {
        const prompt = `
          You are a helpful teaching assistant. For the following multiple-choice question, please explain *why* the correct answer is correct. 
          Keep the explanation clear, concise, and easy to understand.

          Question: "${question.question}"
          Options: ${question.options.join(', ')}
          Correct Answer(s): ${question.answer.join(', ')}

          Provide only the explanation text, without any introductory phrases like "The explanation is..." or "Sure, here's...".
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        return res.status(200).send(response.text ?? '');
      } catch (error) {
         retries++;
          if (isRateLimitError(error) && retries < maxRetries) {
              const delay = initialDelay * Math.pow(2, retries - 1);
              await new Promise(res => setTimeout(res, delay));
          } else {
              const formattedError = formatError(error, "Sorry, an error occurred while fetching the explanation");
              return res.status(500).send(formattedError.message);
          }
      }
    }
    return res.status(500).send("Sorry, the request failed to get an explanation after multiple retries.");
}

async function handleGetJoke(req: VercelRequest, res: VercelResponse) {
   const maxRetries = 3;
   const initialDelay = 1000;
   let retries = 0;

   while (retries < maxRetries) {
      try {
        const prompt = "Tell me a short, witty, SFW (safe for work) programmer-themed joke.";
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        return res.status(200).send(response.text?.trim() ?? '');
      } catch (error) {
        retries++;
        if (isRateLimitError(error) && retries < maxRetries) {
            const delay = initialDelay * Math.pow(2, retries - 1);
            await new Promise(res => setTimeout(res, delay));
        } else {
          return res.status(500).send("I tried to think of a joke, but my circuits are fried!");
        }
      }
   }
   return res.status(500).send("My joke generator is tired. Ask again later!");
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { path } = request.query;

  if (request.method === 'POST' && path === 'generate-quiz') {
    return handleGenerateQuiz(request, response);
  } else if (request.method === 'POST' && path === 'get-explanation') {
    return handleGetExplanation(request, response);
  } else if (request.method === 'GET' && path === 'get-joke') {
    return handleGetJoke(request, response);
  } else {
    response.status(404).send('Not Found');
  }
}
