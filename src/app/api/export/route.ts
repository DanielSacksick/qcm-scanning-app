import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

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

interface ExtractedQuestion {
  number: number;
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, questions } = body as {
      results: StudentResult[];
      questions: ExtractedQuestion[];
    };

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "Aucun résultat à exporter." },
        { status: 400 }
      );
    }

    // Build header row
    const headers = [
      "Fichier",
      "Score",
      "Total",
      "Pourcentage",
      ...questions.map((q) => `Q${q.number}`),
    ];

    // Build data rows
    const rows = results.map((r) => {
      const row: (string | number)[] = [
        r.filename,
        r.score,
        r.total,
        `${((r.score / r.total) * 100).toFixed(1)}%`,
      ];
      questions.forEach((q) => {
        const detail = r.details[`Q${q.number}`];
        if (detail) {
          row.push(
            detail.isCorrect
              ? `${detail.given} ✓`
              : `${detail.given || "—"} ✗ (${detail.correct})`
          );
        } else {
          row.push("—");
        }
      });
      return row;
    });

    // Add answer key row
    const answerKeyRow: (string | number)[] = [
      "BARÈME",
      "",
      "",
      "",
      ...questions.map((q) => {
        const detail = results[0]?.details[`Q${q.number}`];
        return detail ? detail.correct : "";
      }),
    ];

    // Add stats row
    const avgScore =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const statsRow: (string | number)[] = [
      "MOYENNE",
      avgScore.toFixed(1),
      results[0]?.total || 0,
      `${((avgScore / (results[0]?.total || 1)) * 100).toFixed(1)}%`,
    ];

    // Create workbook
    const wsData = [headers, answerKeyRow, ...rows, [], statsRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { wch: 30 }, // Filename
      { wch: 8 }, // Score
      { wch: 8 }, // Total
      { wch: 12 }, // Percentage
      ...questions.map(() => ({ wch: 15 })),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Résultats QCM");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="resultats_qcm.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Export API error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'export Excel." },
      { status: 500 }
    );
  }
}
