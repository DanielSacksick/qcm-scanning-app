import type { Question, AnswerKey, StudentResult, GradeDetail } from "@/lib/types/qcm";
import { fileToBase64, tryModels, parseJSON, getModels } from "./vision";

function buildPrompts(questions: Question[]) {
  // Use sequential 1-based numbering to guarantee unique question IDs
  const questionsSummary = questions
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.text} — Options: ${q.options.map((o) => o.label).join(", ")}`
    )
    .join("\n");

  const systemPrompt = `You are an expert at VISUALLY analyzing scanned exam papers (QCM / multiple choice). Your task is NOT to read text — it is to LOOK at the image and detect visual marks that indicate which answer a student selected. Focus on the VISUAL appearance of the document: look for pen marks, filled shapes, circled items, crossed items, and any hand-drawn marks.`;

  const userPrompt = `IMPORTANT: This task requires VISUAL analysis, not text extraction. Look at the IMAGE carefully.

This is a student's completed QCM exam. The questions are:

${questionsSummary}

Your job: For EACH question, VISUALLY detect which answer option the student marked. 

Look carefully at the image for these VISUAL indicators next to each option:
- Checkmarks or tick marks drawn in or next to a box/circle
- X marks or crosses drawn in or next to a box/circle  
- Filled/darkened circles or bubbles (vs empty ones)
- Circled letters or circled option text
- Underlined option letters
- Handwritten letters written next to question numbers
- Any pen/pencil mark that distinguishes one option from the others

Compare marked vs unmarked options — the one that looks DIFFERENT (has an extra mark) is the selected answer.

Return a JSON object with this EXACT structure:
{
  "answers": {
    "Q1": "B",
    "Q2": "A",
    "Q3": "C"
  }
}

Rules:
- Use the exact question numbers (Q1, Q2, etc.)
- Use the exact option labels (A, B, C, D, etc.)
- If you truly cannot determine an answer for a question, use ""
- Return ONLY the JSON, no other text`;

  return { systemPrompt, userPrompt };
}

async function gradeOneFile(
  file: File,
  answerKey: AnswerKey,
  questionKeys: string[],
  total: number,
  systemPrompt: string,
  userPrompt: string
): Promise<StudentResult> {
  try {
    const { base64, mimeType } = await fileToBase64(file);
    const models = getModels("grading");
    const aiResult = await tryModels(models, systemPrompt, userPrompt, base64, mimeType);
    const parsed = parseJSON(aiResult) as { answers: Record<string, string> };
    const studentAnswers = parsed.answers || {};

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

    return { filename: file.name, score, total, details };
  } catch (err) {
    console.error(`[grade] Error processing ${file.name}:`, err);
    const details: Record<string, GradeDetail> = {};
    questionKeys.forEach((qKey) => {
      details[qKey] = { given: "⚠", correct: answerKey[qKey], isCorrect: false };
    });
    return { filename: file.name, score: 0, total, details };
  }
}

export async function gradeAllFiles(
  files: File[],
  questions: Question[],
  answerKey: AnswerKey
): Promise<StudentResult[]> {
  const questionKeys = Object.keys(answerKey).filter((k) => answerKey[k]);
  const total = questionKeys.length;
  const { systemPrompt, userPrompt } = buildPrompts(questions);

  const results: StudentResult[] = [];
  const batchSize = 3;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((file) =>
        gradeOneFile(file, answerKey, questionKeys, total, systemPrompt, userPrompt)
      )
    );
    results.push(...batchResults);
  }

  return results;
}
