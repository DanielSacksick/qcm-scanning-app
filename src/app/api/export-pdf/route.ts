import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getApiKey } from "@/lib/api/vision";
import { annotateAllFiles } from "@/lib/api/annotate-pdf";
import type { StudentResult, Question } from "@/lib/types/qcm";

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
    const resultsRaw = formData.get("results") as string;
    const questionsRaw = formData.get("questions") as string;

    if (!files?.length) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }
    if (!resultsRaw || !questionsRaw) {
      return NextResponse.json(
        { error: "Résultats ou questions manquants." },
        { status: 400 }
      );
    }

    const results: StudentResult[] = JSON.parse(resultsRaw);
    const questions: Question[] = JSON.parse(questionsRaw);

    // Annotate all student files
    const annotatedMap = await annotateAllFiles(files, questions, results);

    if (annotatedMap.size === 0) {
      return NextResponse.json(
        { error: "Aucun PDF n'a pu être annoté." },
        { status: 500 }
      );
    }

    // Build ZIP
    const zip = new JSZip();
    annotatedMap.forEach((bytes, name) => {
      zip.file(name, bytes);
    });
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(Buffer.from(zipBuffer) as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="copies_corrigees_${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (err) {
    console.error("[api/export-pdf]", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'export PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 300;
export const dynamic = "force-dynamic";
