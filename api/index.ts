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
      You are an expert quiz generator...
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
          You are a helpful teaching assistant...
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
