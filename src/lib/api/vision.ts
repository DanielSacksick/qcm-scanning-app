// ─── Shared OpenRouter Vision API utilities ─────────

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const VISION_MODELS_OCR = [
  "qwen/qwen2.5-vl-72b-instruct",
  "deepseek/deepseek-vl2",
  "thudm/glm-4v-plus",
];

const VISION_MODELS_GRADING = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
];

export function getApiKey(): string | undefined {
  return OPENROUTER_API_KEY;
}

export function getModels(purpose: "ocr" | "grading"): string[] {
  return purpose === "ocr" ? VISION_MODELS_OCR : VISION_MODELS_GRADING;
}

export async function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { base64, mimeType: file.type || "image/jpeg" };
}

export async function callVisionAPI(
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
      "HTTP-Referer": "https://oa-portal.vercel.app",
      "X-Title": "OA Portal · QCM",
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
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
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

export async function tryModels(
  models: string[],
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`[vision] Trying: ${model}`);
      const result = await callVisionAPI(
        model,
        systemPrompt,
        userPrompt,
        imageBase64,
        mimeType
      );
      console.log(`[vision] Success: ${model}`);
      return result;
    } catch (err) {
      console.warn(`[vision] ${model} failed:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All vision models failed");
}

export function parseJSON(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) return JSON.parse(objectMatch[0]);
    throw new Error("Could not parse JSON from AI response");
  }
}
