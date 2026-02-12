import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// Models to try in order of preference
const VISION_MODELS = [
  "qwen/qwen2.5-vl-72b-instruct",
  "deepseek/deepseek-vl2",
  "thudm/glm-4v-plus",
];

interface QuestionOption {
  label: string;
  text: string;
}

interface ExtractedQuestion {
  number: number;
  text: string;
  options: QuestionOption[];
}

async function fileToBase64(file: File): Promise<{
  base64: string;
  mimeType: string;
}> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mimeType: file.type || "image/jpeg" };
}

async function callVisionAPI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://qcm-scanner.vercel.app",
      "X-Title": "QCM Scanner",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function tryModels(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of VISION_MODELS) {
    try {
      console.log(`Trying model: ${model}`);
      const result = await callVisionAPI(
        model,
        systemPrompt,
        userPrompt,
        imageBase64,
        mimeType
      );
      console.log(`Success with model: ${model}`);
      return result;
    } catch (err) {
      console.warn(`Model ${model} failed:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All models failed");
}

function parseJSON(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error("Could not parse JSON from response");
  }
}

// ──────────────────────────────────────────────
// This endpoint ONLY processes the FIRST uploaded file
// to extract the QCM structure (questions + options).
// Student answer detection happens later at /api/grade.
// ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Clé API OpenRouter non configurée. Ajoutez OPENROUTER_API_KEY dans les variables d'environnement.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    // Only process the FIRST file to extract QCM structure
    const firstFile = files[0];
    const { base64, mimeType } = await fileToBase64(firstFile);

    const systemPrompt = `You are an expert OCR and document analysis AI. You analyze scanned exam papers (QCM / multiple choice questionnaires). You must extract all questions and their answer options with precision. Focus on structure, not on detecting student answers.`;

    const userPrompt = `Analyze this QCM (multiple choice exam) image carefully.

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

    const result = await tryModels(systemPrompt, userPrompt, base64, mimeType);
    const parsed = parseJSON(result) as { questions: ExtractedQuestion[] };
    const questions: ExtractedQuestion[] = parsed.questions || [];

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Aucune question n'a pu être extraite. Vérifiez la qualité de l'image.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Extract API error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 120;
export const dynamic = "force-dynamic";
