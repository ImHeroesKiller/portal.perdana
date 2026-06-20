import { GoogleGenAI, Type } from '@google/genai';
import { guardApi } from '../lib/api-cors';
import { RATE_LIMITS } from '../lib/api-rate-limit';
import { sanitizeServerError } from '../lib/api-security';

export default async function handler(req: any, res: any) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.aiInterview, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
  }

  const { fullName, positionApplied, transcript } = req.body || {};
  if (!transcript || typeof transcript !== 'object') {
    return res.status(400).json({ error: "Field 'transcript' wajib berupa object." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Analyze the following candidate interview based on the STAR method.

Context:
Candidate Name: ${fullName || 'Candidate'}
Position: ${positionApplied || 'N/A'}

Transcript:
Situation: ${transcript.situation || 'No answer'}
Task: ${transcript.task || 'No answer'}
Action: ${transcript.action || 'No answer'}
Result: ${transcript.result || 'No answer'}

Provide:
1. A brief analysis for each STAR component.
2. An overall score (0-100).
3. A summary of the candidate's performance.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            starAnalysis: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING },
              },
            },
            overallScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json({ result: parsed });
  } catch (error: unknown) {
    console.error('ai-interview-analyze error:', error);
    const message = error instanceof Error ? error.message : 'Gagal menganalisis interview.';
    return res.status(500).json({ error: sanitizeServerError(message) });
  }
}