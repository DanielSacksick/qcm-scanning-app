import type { Question } from "@/lib/types/qcm";
import { fileToBase64, tryModels, parseJSON, getModels } from "./vision";

const SYSTEM_PROMPT = `You are an expert OCR and document analysis AI. You analyze scanned exam papers (QCM / multiple choice questionnaires). You must extract all questions and their answer options with precision. Focus on structure, not on detecting student answers.`;

const USER_PROMPT = `Analyze this QCM (multiple choice exam) image carefully.

For EACH question found, extract:
1. The question number
2. The question text  
3. ALL answer options with their labels (A, B, C, D, etc.) and text

Return a JSON object with this EXACT structure:
{
  "questions": [
    {
      "number": 1,
      "text": "Question text here",
      "options": [
        {"label": "A", "text": "Option A text"},
        {"label": "B", "text": "Option B text"},
        {"label": "C", "text": "Option C text"},
        {"label": "D", "text": "Option D text"}
      ]
    }
  ]
}

Rules:
- Keep option labels as single uppercase letters (A, B, C, D, etc.)
- Preserve original question numbering
- Include ALL options for each question
- Do NOT try to detect student answers — only extract the structure
- Return ONLY the JSON, no other text`;

export async function extractQCMStructure(file: File): Promise<Question[]> {
  const { base64, mimeType } = await fileToBase64(file);
  const models = getModels("ocr");
  const result = await tryModels(models, SYSTEM_PROMPT, USER_PROMPT, base64, mimeType);
  const parsed = parseJSON(result) as { questions: Question[] };
  return parsed.questions || [];
}
