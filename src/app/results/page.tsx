"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
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

export default function ResultsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { gradingResults, extractedQuestions, resetAll } = useAppStore();

  useEffect(() => {
    if (gradingResults.length === 0) {
      router.replace("/upload");
    }
  }, [gradingResults, router]);

  if (gradingResults.length === 0) return null;

  const totalStudents = gradingResults.length;
  const avgScore =
    gradingResults.reduce((sum, r) => sum + r.score, 0) / totalStudents;
  const maxScore = Math.max(...gradingResults.map((r) => r.score));
  const totalQuestions = gradingResults[0]?.total || 0;

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: gradingResults,
          questions: extractedQuestions,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'export.");

      const blob = await response.blob();
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
    resetAll();
    router.push("/upload");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Résultats</h1>
              <p className="text-muted-foreground mt-1">
                Résumé de la correction de {totalStudents} copie
                {totalStudents > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleNewSession}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Nouvelle session
              </Button>
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter Excel
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">
                    Copie{totalStudents > 1 ? "s" : ""} corrigée
                    {totalStudents > 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-50">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {avgScore.toFixed(1)}/{totalQuestions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Moyenne de la classe
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {maxScore}/{totalQuestions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Meilleur score
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results table */}
          <Card>
            <CardHeader>
              <CardTitle>Détail par étudiant</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] sticky left-0 bg-white z-10">
                          Fichier
                        </TableHead>
                        <TableHead className="w-[100px] text-center">
                          Score
                        </TableHead>
                        {extractedQuestions.map((q) => (
                          <TableHead key={q.number} className="text-center w-16">
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
                            <TableCell className="font-medium truncate max-w-[200px] sticky left-0 bg-white z-10">
                              {result.filename}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={pct >= 50 ? "default" : "destructive"}
                                className={
                                  pct >= 50
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : ""
                                }
                              >
                                {result.score}/{result.total}
                              </Badge>
                            </TableCell>
                            {extractedQuestions.map((q) => {
                              const detail =
                                result.details[`Q${q.number}`];
                              if (!detail) return <TableCell key={q.number} />;
                              return (
                                <TableCell
                                  key={q.number}
                                  className="text-center"
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    {detail.isCorrect ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span
                                      className={`text-xs font-medium ${
                                        detail.isCorrect
                                          ? "text-green-700"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {detail.given || "—"}
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
        </main>
      </div>
    </AuthGuard>
  );
}
