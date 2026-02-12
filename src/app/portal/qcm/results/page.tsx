"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQCMStore } from "@/lib/store/qcmStore";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  RefreshCw,
  Trophy,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function QCMResultsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { gradingResults, extractedQuestions, resetSession } = useQCMStore();

  useEffect(() => {
    if (gradingResults.length === 0) {
      router.replace("/portal/qcm/upload");
    }
  }, [gradingResults, router]);

  if (gradingResults.length === 0) return null;

  const totalStudents = gradingResults.length;
  const avgScore =
    gradingResults.reduce((s, r) => s + r.score, 0) / totalStudents;
  const maxScore = Math.max(...gradingResults.map((r) => r.score));
  const totalQ = gradingResults[0]?.total || 0;

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: gradingResults,
          questions: extractedQuestions,
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resultats_qcm_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Le fichier Excel a été téléchargé.",
      });
    } catch {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier Excel.",
        variant: "destructive",
      });
    }
  };

  const handleNewSession = () => {
    resetSession();
    router.push("/portal/qcm/upload");
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]";
    if (pct >= 50) return "bg-amber-100 text-amber-700";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <StepIndicator currentStep={3} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Résultats
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalStudents} copie{totalStudents > 1 ? "s" : ""} corrigée
            {totalStudents > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSession}
            className="gap-1.5 rounded-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Nouvelle session
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            className="gap-1.5 rounded-lg font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-xl">
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--primary))]/10">
              <Users className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Copies corrigées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--success))]/10">
              <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {avgScore.toFixed(1)}/{totalQ}
              </p>
              <p className="text-xs text-muted-foreground">Moyenne</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {maxScore}/{totalQ}
              </p>
              <p className="text-xs text-muted-foreground">Meilleur score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Détail par copie</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] sticky left-0 bg-white z-10 text-xs">
                      Fichier
                    </TableHead>
                    <TableHead className="w-[90px] text-center text-xs">
                      Score
                    </TableHead>
                    {extractedQuestions.map((q) => (
                      <TableHead
                        key={q.number}
                        className="text-center w-14 text-xs"
                      >
                        Q{q.number}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingResults.map((result) => {
                    const pct = (result.score / result.total) * 100;
                    return (
                      <TableRow key={result.filename}>
                        <TableCell className="font-medium text-sm truncate max-w-[200px] sticky left-0 bg-white z-10">
                          {result.filename}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`${getScoreColor(pct)} text-xs font-bold border-0`}
                          >
                            {result.score}/{result.total}
                          </Badge>
                        </TableCell>
                        {extractedQuestions.map((q) => {
                          const d = result.details[`Q${q.number}`];
                          if (!d)
                            return (
                              <TableCell key={q.number} className="text-center">
                                —
                              </TableCell>
                            );
                          return (
                            <TableCell key={q.number} className="text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                {d.isCorrect ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                                )}
                                <span
                                  className={`text-[11px] font-medium ${
                                    d.isCorrect
                                      ? "text-[hsl(var(--success))]"
                                      : "text-destructive"
                                  }`}
                                >
                                  {d.given || "—"}
                                </span>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
