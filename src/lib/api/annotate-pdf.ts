// ─── Annotated PDF generation ───────────────────────
//
// Flow per student file:
//   1. Send image to vision model → get CENTER POINT coordinates of every
//      answer checkbox / bubble (returned as % of page dimensions).
//   2. Load (or create) a PDF with pdf-lib.
//   3. Draw small ✓ (green) on correct answers, ✗ (red) on wrong ones
//      + label the correct answer next to the cross.
//   4. Stamp a score badge at the top of the page.
//   5. Return the annotated PDF bytes.
// ────────────────────────────────────────────────────

import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";
import type {
  Question,
  GradeDetail,
} from "@/lib/types/qcm";
import { fileToBase64, tryModels, parseJSON, getModels } from "./vision";

// ─── Types (internal) ───────────────────────────────

/** Vertical position of an answer option, as % of page height (0–100). */
interface OptionY {
  cy: number; // vertical center, % of page height (0 = top, 100 = bottom)
}

/** Map of question → option → vertical position. */
interface AnswerYMap {
  [questionKey: string]: {
    [optionLabel: string]: OptionY;
  };
}

// ─── Colours ────────────────────────────────────────

const GREEN = rgb(0.13, 0.69, 0.3);
const RED = rgb(0.87, 0.18, 0.18);
const GREEN_BG = rgb(0.13, 0.69, 0.3);
const RED_BG = rgb(0.87, 0.18, 0.18);
const AMBER_BG = rgb(0.92, 0.69, 0.12);
const WHITE = rgb(1, 1, 1);

// Mark size: ~1% of page height, clamped between 7 and 11 pt.
// This gives a small pen-like mark that doesn't overwhelm the page.
function markSize(pageH: number) {
  return Math.min(Math.max(pageH * 0.012, 7), 11);
}

// ─── 1. Vertical-position detection via vision model ─

function buildYPrompts(questions: Question[]) {
  const questionsSummary = questions
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.text} — Options: ${q.options.map((o) => o.label).join(", ")}`
    )
    .join("\n");

  const systemPrompt = `You are an expert at analyzing scanned exam documents. Your task is to find the VERTICAL position of each answer option on the page. Return only the vertical coordinate as a percentage of page height.`;

  const userPrompt = `Analyze this scanned QCM (multiple choice exam) page.

The exam has these questions:
${questionsSummary}

For EACH option of EACH question, find its VERTICAL position on the page.
Return the vertical center of the checkbox / bubble / option line as a PERCENTAGE of the page height (0 = top edge, 100 = bottom edge).

Return a JSON object with this EXACT structure:
{
  "answers": {
    "Q1": {
      "A": {"cy": 21.5},
      "B": {"cy": 25.0}
    },
    "Q2": {
      "A": {"cy": 45.1},
      "B": {"cy": 48.8}
    }
  }
}

Rules:
- cy = vertical center of the option line as % of page HEIGHT (0 = top, 100 = bottom)
- Be as precise as possible
- Return ONLY the JSON, no other text`;

  return { systemPrompt, userPrompt };
}

export async function detectAnswerYPositions(
  file: File,
  questions: Question[]
): Promise<AnswerYMap> {
  const { base64, mimeType } = await fileToBase64(file);
  const models = getModels("spatial");
  const { systemPrompt, userPrompt } = buildYPrompts(questions);

  const raw = await tryModels(models, systemPrompt, userPrompt, base64, mimeType);
  const parsed = parseJSON(raw) as { answers: AnswerYMap };
  return parsed.answers || {};
}

// ─── 2. Drawing helpers ─────────────────────────────

// Right-margin placement: annotations go at ~90% of page width.
const MARGIN_X_PCT = 90;

/** Convert a cy% (top-origin) to pdf-lib y (bottom-origin), placed in the right margin. */
function toAbsolute(cy: number, pageW: number, pageH: number) {
  return {
    x: (MARGIN_X_PCT / 100) * pageW,
    y: pageH - (cy / 100) * pageH, // flip y-axis
  };
}

/** Draw a green checkmark ✓ centred at (cx, cy). */
function drawCheckmark(page: PDFPage, cx: number, cy: number, s: number) {
  const t = Math.max(s * 0.18, 1.2);
  // Short downward-right stroke
  page.drawLine({
    start: { x: cx - s * 0.3, y: cy + s * 0.05 },
    end:   { x: cx,           y: cy - s * 0.3 },
    color: GREEN, thickness: t, opacity: 0.9,
  });
  // Long upward-right stroke
  page.drawLine({
    start: { x: cx,           y: cy - s * 0.3 },
    end:   { x: cx + s * 0.4, y: cy + s * 0.35 },
    color: GREEN, thickness: t, opacity: 0.9,
  });
}

/** Draw a red cross ✗ centred at (cx, cy). */
function drawCross(page: PDFPage, cx: number, cy: number, s: number) {
  const t = Math.max(s * 0.18, 1.2);
  const r = s * 0.3;
  page.drawLine({
    start: { x: cx - r, y: cy + r },
    end:   { x: cx + r, y: cy - r },
    color: RED, thickness: t, opacity: 0.9,
  });
  page.drawLine({
    start: { x: cx - r, y: cy - r },
    end:   { x: cx + r, y: cy + r },
    color: RED, thickness: t, opacity: 0.9,
  });
}

// ─── 3. Score badge ─────────────────────────────────

async function drawScoreBadge(
  page: PDFPage,
  pdfDoc: PDFDocument,
  score: number,
  total: number,
  filename: string
) {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width: pageW, height: pageH } = page.getSize();

  const pct = total > 0 ? (score / total) * 100 : 0;
  const bgColor = pct >= 75 ? GREEN_BG : pct >= 50 ? AMBER_BG : RED_BG;

  const badgeW = Math.min(280, pageW * 0.45);
  const badgeH = 44;
  const margin = 12;
  const badgeX = pageW - badgeW - margin;
  const badgeY = pageH - badgeH - margin;

  // Background rounded rect (approximated as rect + lighter bg)
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: bgColor,
    opacity: 0.9,
    borderWidth: 0,
  });

  // Score text
  const scoreText = `${score} / ${total}`;
  const scoreFontSize = 20;
  page.drawText(scoreText, {
    x: badgeX + 14,
    y: badgeY + badgeH / 2 - scoreFontSize * 0.35,
    size: scoreFontSize,
    font,
    color: WHITE,
  });

  // Percentage
  const pctText = `${pct.toFixed(0)}%`;
  const pctWidth = font.widthOfTextAtSize(pctText, 14);
  page.drawText(pctText, {
    x: badgeX + badgeW - pctWidth - 14,
    y: badgeY + badgeH / 2 - 5,
    size: 14,
    font,
    color: WHITE,
  });

  // Filename at very top-left (small, grey)
  const nameText =
    filename.length > 50 ? filename.slice(0, 47) + "..." : filename;
  page.drawText(nameText, {
    x: margin,
    y: pageH - 20,
    size: 8,
    font: fontRegular,
    color: rgb(0.45, 0.45, 0.45),
    opacity: 0.7,
  });
}

// ─── 4. Main annotation function ────────────────────

export async function annotateStudentFile(
  file: File,
  questions: Question[],
  details: Record<string, GradeDetail>,
  score: number,
  total: number
): Promise<Uint8Array> {
  // --- Detect vertical positions ---
  let yMap: AnswerYMap;
  try {
    yMap = await detectAnswerYPositions(file, questions);
  } catch (err) {
    console.warn("[annotate] y-detection failed, using fallback:", err);
    yMap = buildFallbackYMap(questions);
  }

  // --- Load or create PDF ---
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  let pdfDoc: PDFDocument;
  let page: PDFPage;

  if (file.type === "application/pdf") {
    pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    page = pdfDoc.getPage(0);
  } else {
    // Image → embed into a new PDF page
    pdfDoc = await PDFDocument.create();
    let img;
    if (file.type === "image/png") {
      img = await pdfDoc.embedPng(fileBytes);
    } else {
      img = await pdfDoc.embedJpg(fileBytes);
    }
    const dims = img.scaleToFit(595, 842); // A4-ish
    page = pdfDoc.addPage([dims.width, dims.height]);
    page.drawImage(img, { x: 0, y: 0, width: dims.width, height: dims.height });
  }

  const { width: pageW, height: pageH } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const s = markSize(pageH);       // small, consistent mark size
  const labelSize = Math.max(s * 0.75, 6); // text label next to crosses

  // --- Draw annotations per question (right margin, same vertical level) ---
  for (let i = 0; i < questions.length; i++) {
    const qKey = `Q${i + 1}`;
    const detail = details[qKey];
    if (!detail) continue;

    const qYMap = yMap[qKey];
    if (!qYMap) continue;

    const givenLabel = detail.given?.toUpperCase().trim();
    const correctLabel = detail.correct?.toUpperCase().trim();

    if (detail.isCorrect) {
      // ✓ in the right margin at the student's answer vertical level
      const entry = qYMap[givenLabel];
      if (entry) {
        const abs = toAbsolute(entry.cy, pageW, pageH);
        drawCheckmark(page, abs.x, abs.y, s);
      }
    } else {
      // ✗ in the right margin + "-> B" correction label
      if (givenLabel && qYMap[givenLabel]) {
        const abs = toAbsolute(qYMap[givenLabel].cy, pageW, pageH);
        drawCross(page, abs.x, abs.y, s);

        // "-> B" label right after the cross
        page.drawText(`-> ${correctLabel}`, {
          x: abs.x + s * 0.5,
          y: abs.y - labelSize * 0.35,
          size: labelSize,
          font,
          color: GREEN,
          opacity: 0.95,
        });
      }
    }
  }

  // --- Score badge ---
  await drawScoreBadge(page, pdfDoc, score, total, file.name);

  return pdfDoc.save();
}

// ─── 5. Fallback layout (when y-detection fails) ────

function buildFallbackYMap(questions: Question[]): AnswerYMap {
  const yMap: AnswerYMap = {};
  const startY = 18;
  const stepY = Math.min(70 / Math.max(questions.length, 1), 12);

  questions.forEach((q, qi) => {
    const qKey = `Q${qi + 1}`;
    yMap[qKey] = {};
    const baseY = startY + qi * stepY;
    q.options.forEach((opt, oi) => {
      yMap[qKey][opt.label] = { cy: baseY + oi * 2.5 };
    });
  });

  return yMap;
}

// ─── 6. Parallel processing (all students) ──────────

const CONCURRENCY = 5; // max parallel vision API calls

export async function annotateAllFiles(
  files: File[],
  questions: Question[],
  results: { filename: string; score: number; total: number; details: Record<string, GradeDetail> }[]
): Promise<Map<string, Uint8Array>> {
  const annotatedMap = new Map<string, Uint8Array>();

  // Build tasks
  const tasks = files.map((file) => {
    const result = results.find((r) => r.filename === file.name);
    if (!result) return null;
    return { file, result };
  }).filter(Boolean) as { file: File; result: typeof results[number] }[];

  // Process with bounded concurrency (CONCURRENCY simultaneous calls)
  let cursor = 0;
  async function runNext(): Promise<void> {
    while (cursor < tasks.length) {
      const idx = cursor++;
      const { file, result } = tasks[idx];
      try {
        const bytes = await annotateStudentFile(
          file,
          questions,
          result.details,
          result.score,
          result.total
        );
        const pdfName = file.name.replace(/\.[^.]+$/, "") + "_corrige.pdf";
        annotatedMap.set(pdfName, bytes);
      } catch (err) {
        console.error(`[annotate] Failed to annotate ${file.name}:`, err);
      }
    }
  }

  // Launch CONCURRENCY workers in parallel
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, () => runNext()));

  return annotatedMap;
}
