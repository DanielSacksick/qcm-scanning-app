import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/api/vision";
import { extractQCMStructure } from "@/lib/api/extract";

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

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    const questions = await extractQCMStructure(files[0]);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Aucune question détectée. Vérifiez la qualité de l'image." },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[api/extract]", err);
    const message =
      err instanceof Error ? err.message : "Erreur interne.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 120;
export const dynamic = "force-dynamic";
