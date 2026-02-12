import * as XLSX from "xlsx";
import type { StudentResult, Question } from "@/lib/types/qcm";

export function generateExcelBuffer(
  results: StudentResult[],
  questions: Question[]
): Buffer {
  const headers = [
    "Fichier",
    "Score",
    "Total",
    "Pourcentage",
    ...questions.map((_, i) => `Q${i + 1}`),
  ];

  const rows = results.map((r) => {
    const row: (string | number)[] = [
      r.filename,
      r.score,
      r.total,
      `${((r.score / r.total) * 100).toFixed(1)}%`,
    ];
    questions.forEach((_, i) => {
      const detail = r.details[`Q${i + 1}`];
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

  const answerKeyRow: (string | number)[] = [
    "BARÈME",
    "",
    "",
    "",
    ...questions.map((_, i) => {
      const detail = results[0]?.details[`Q${i + 1}`];
      return detail ? detail.correct : "";
    }),
  ];

  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const statsRow: (string | number)[] = [
    "MOYENNE",
    avgScore.toFixed(1),
    results[0]?.total || 0,
    `${((avgScore / (results[0]?.total || 1)) * 100).toFixed(1)}%`,
  ];

  const wsData = [headers, answerKeyRow, ...rows, [], statsRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 30 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    ...questions.map(() => ({ wch: 15 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Résultats QCM");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
