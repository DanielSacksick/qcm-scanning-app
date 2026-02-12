import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const VISION_MODELS = [
  "qwen/qwen2.5-vl-72b-instruct",
  "deepseek/deepseek-vl2",
  "thudm/glm-4v-plus",
];

interface GradeDetail {
  given: string;
  correct: string;
  isCorrect: boolean;
}

interface StudentResult {
  filename: string;
  score: number;
  total: number;
  details: Record<string, GradeDetail>;
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
      const result = await callVisionAPI(
        model,
        systemPrompt,
        userPrompt,
        imageBase64,
        mimeType
      );
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
    if (objectMatch) return JSON.parse(objectMatch[0]);
    throw new Error("Could not parse JSON from response");
  }
}

// ──────────────────────────────────────────────
// This endpoint receives ALL student copies + the answer key,
// sends each copy to AI vision to detect answers, then grades.
// ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Clé API OpenRouter non configurée." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const answerKeyRaw = formData.get("answerKey") as string;
    const questionsRaw = formData.get("questions") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucune copie fournie." },
        { status: 400 }
      );
    }

    if (!answerKeyRaw || !questionsRaw) {
      return NextResponse.json(
        { error: "Barème ou questions manquants." },
        { status: 400 }
      );
    }

    const answerKey: Record<string, string> = JSON.parse(answerKeyRaw);
    const questions: { number: number; text: string; options: { label: string }[] }[] =
      JSON.parse(questionsRaw);

    const questionKeys = Object.keys(answerKey).filter((k) => answerKey[k]);
    const total = questionKeys.length;

    // Build the prompt describing the QCM structure
    const questionsSummary = questions
      .map(
        (q) =>
          `Q${q.number}: ${q.text} — Options possibles : ${q.options
            .map((o) => o.label)
            .join(", ")}`
      )
      .join("\n");

    const systemPrompt = `You are an expert OCR and document analysis AI specialized in detecting student answers on scanned multiple choice exam papers (QCM). You detect which answer option each student selected by looking for checked checkboxes, filled circles, circled letters, crossed options, underlined options, or handwritten letters.`;

    const userPrompt = `This is a student's completed exam copy for a QCM with the following questions:

${questionsSummary}

For each question, detect which answer the student selected. Look for:
- Checked checkboxes (✓, ✗, X marks)
- Filled or circled bubbles/circles
- Circled or underlined letters
- Handwritten letters next to questions

Return a JSON object with this EXACT structure:
{
  "answers": {
    "Q1": "B",
    "Q2": "A",
    "Q3": "C"
  }
}

Rules:
- Use the exact question numbers listed above (Q1, Q2, etc.)
- Use the exact option labels (A, B, C, D, etc.)
- If you truly cannot determine an answer for a question, use ""
- Return ONLY the JSON, no other text`;

    // Process all files — in batches of 3 to avoid rate limits
    const allResults: StudentResult[] = [];
    const batchSize = 3;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (file): Promise<StudentResult> => {
          try {
            const { base64, mimeType } = await fileToBase64(file);
            const aiResult = await tryModels(
              systemPrompt,
              userPrompt,
              base64,
              mimeType
            );
            const parsed = parseJSON(aiResult) as {
              answers: Record<string, string>;
            };
            const studentAnswers = parsed.answers || {};

            // Grade this student
            let score = 0;
            const details: Record<string, GradeDetail> = {};

            questionKeys.forEach((qKey) => {
              const correct = answerKey[qKey];
              const given = studentAnswers[qKey] || "";
              const isCorrect =
                given !== "" &&
                given.toUpperCase().trim() === correct.toUpperCase().trim();

              if (isCorrect) score++;
              details[qKey] = { given, correct, isCorrect };
            });

            return {
              filename: file.name,
              score,
              total,
              details,
            };
          } catch (err) {
            console.error(`Error processing ${file.name}:`, err);
            // Return zero score on failure with empty answers
            const details: Record<string, GradeDetail> = {};
            questionKeys.forEach((qKey) => {
              details[qKey] = {
                given: "⚠",
                correct: answerKey[qKey],
                isCorrect: false,
              };
            });
            return {
              filename: file.name,
              score: 0,
              total,
              details,
            };
          }
        })
      );

      allResults.push(...batchResults);
    }

    return NextResponse.json({ results: allResults });
  } catch (err) {
    console.error("Grade API error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la correction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 300; // 5 min for processing multiple copies
export const dynamic = "force-dynamic";
