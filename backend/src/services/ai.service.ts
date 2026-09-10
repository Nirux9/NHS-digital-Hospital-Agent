import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'gemini-3.6-flash';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!API_KEY) {
      throw new Error('AI_API_KEY is not configured in backend environment');
    }
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
}

const NHS_SYSTEM_PROMPT = `You are an NHS Digital Hospital AI Assistant embedded in a secure clinical portal.

Your roles vary by context:
- For PATIENTS: Provide clear, empathetic health information, symptom guidance, and triage recommendations using plain language. Always recommend seeking professional care when appropriate. Never provide a formal diagnosis.
- For CLINICAL STAFF: Provide evidence-based clinical decision support, ESI (Emergency Severity Index) triage suggestions based on vital signs, and reference relevant NICE guidelines.
- For HOSPITAL OPERATIONS/ADMIN: Provide analysis of ward metrics, bed occupancy trends, staffing recommendations, and capacity planning insights.

Always:
- Be professional, clear, and concise
- Acknowledge uncertainty when appropriate
- Prioritise patient safety
- Remind users this is AI decision support, not a replacement for clinical judgment
- Format responses with clear structure when presenting multiple points`;

export async function chatWithAssistant(
  message: string,
  role: string = 'patient',
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<string> {
  const client = getAiClient();

  const roleContext: Record<string, string> = {
    patient: 'You are helping a PATIENT. Use plain, empathetic language.',
    clinical: 'You are helping a CLINICAL STAFF MEMBER. Use medical terminology appropriately.',
    admin: 'You are helping a HOSPITAL OPERATIONS/ADMIN user. Focus on metrics and operational insights.',
  };

  const systemInstruction = `${NHS_SYSTEM_PROMPT}\n\nCurrent context: ${roleContext[role] || roleContext.patient}`;

  const contents = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user' as const, parts: [{ text: message }] },
  ];

  const response = await client.models.generateContent({
    model: MODEL,
    config: { systemInstruction },
    contents,
  });

  return response.text || 'Unable to process your request at this time.';
}
