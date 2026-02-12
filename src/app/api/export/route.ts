import { NextRequest, NextResponse } from "next/server";
import { generateExcelBuffer } from "@/lib/api/export";
import type { StudentResult, Question } from "@/lib/types/qcm";

export async function POST(request: NextRequest) {
  try {
    const { results, questions } = (await request.json()) as {
      results: StudentResult[];
      questions: Question[];
    };

    if (!results?.length) {
      return NextResponse.json(
        { error: "Aucun résultat à exporter." },
        { status: 400 }
      );
    }

    const buf = generateExcelBuffer(results, questions);
    const uint8 = new Uint8Array(buf);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="resultats_qcm.xlsx"`,
      },
    });
  } catch (err) {
    console.error("[api/export]", err);
    return NextResponse.json(
      { error: "Erreur lors de l'export Excel." },
      { status: 500 }
    );
  }
}
