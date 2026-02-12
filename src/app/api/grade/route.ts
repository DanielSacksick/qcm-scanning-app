import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/api/vision";
import { gradeAllFiles } from "@/lib/api/grade";
import type { AnswerKey, Question } from "@/lib/types/qcm";

export async function POST(request: NextRequest) {
  try {
    if (!getApiKey()) {
      return NextResponse.json(
        { error: "Clé API OpenRouter non configurée." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const answerKeyRaw = formData.get("answerKey") as string;
    const questionsRaw = formData.get("questions") as string;

    if (!files?.length) {
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

    const answerKey: AnswerKey = JSON.parse(answerKeyRaw);
    const questions: Question[] = JSON.parse(questionsRaw);
    const results = await gradeAllFiles(files, questions, answerKey);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/grade]", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la correction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 300;
export const dynamic = "force-dynamic";
