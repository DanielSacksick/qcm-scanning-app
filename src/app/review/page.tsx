"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { Question } from "@/lib/store";
import { AuthGuard } from "@/components/auth-guard";
import { LoadingOverlay } from "@/components/loading-overlay";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Pencil,
  Check,
  X,
  Plus,
  Minus,
  ClipboardCheck,
  ListChecks,
} from "lucide-react";

export default function ReviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    extractedQuestions,
    answerKey,
    setAnswerKey,
    updateAnswerKey,
    updateQuestion,
    uploadedFiles,
    setGradingResults,
    setIsLoading,
    setLoadingMessage,
    isLoading,
  } = useAppStore();

  // Initialize answer key
  useEffect(() => {
    if (extractedQuestions.length > 0 && Object.keys(answerKey).length === 0) {
      const key: Record<string, string> = {};
      extractedQuestions.forEach((q) => {
        key[`Q${q.number}`] = "";
      });
      setAnswerKey(key);
    }
  }, [extractedQuestions, answerKey, setAnswerKey]);

  // Redirect if no data
  useEffect(() => {
    if (extractedQuestions.length === 0) {
      router.replace("/upload");
    }
  }, [extractedQuestions, router]);

  const answeredCount = Object.values(answerKey).filter(Boolean).length;
  const totalQuestions = extractedQuestions.length;

  const handleGrade = async () => {
    const missingKeys = extractedQuestions.filter(
      (q) => !answerKey[`Q${q.number}`]
    );
    if (missingKeys.length > 0) {
      toast({
        title: "Barème incomplet",
        description: `Veuillez sélectionner la bonne réponse pour chaque question (${missingKeys.length} manquante${missingKeys.length > 1 ? "s" : ""}).`,
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Aucune copie",
        description: "Aucun fichier d'étudiant à corriger.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage(
      `Correction de ${uploadedFiles.length} copie${uploadedFiles.length > 1 ? "s" : ""} en cours...`
    );

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append("files", file));
      formData.append("answerKey", JSON.stringify(answerKey));
      formData.append("questions", JSON.stringify(extractedQuestions));

      const response = await fetch("/api/grade", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la correction.");
      }

      const data = await response.json();
      setGradingResults(data.results);
      router.push("/results");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inconnue est survenue.";
      toast({
        title: "Erreur de correction",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  if (extractedQuestions.length === 0) return null;

  return (
    <AuthGuard>
      <LoadingOverlay />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50">
        <AppHeader />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Vérification & Barème
            </h1>
            <p className="text-muted-foreground mt-2">
              Vérifiez les questions détectées, ajustez si nécessaire, puis
              sélectionnez la bonne réponse pour chaque question.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT — Questions list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Questions détectées ({totalQuestions})
                </h2>
              </div>

              <div className="space-y-4">
                {extractedQuestions.map((question, qIndex) => (
                  <QuestionCard
                    key={question.number}
                    question={question}
                    selectedAnswer={answerKey[`Q${question.number}`] || ""}
                    onSelectAnswer={(label) =>
                      updateAnswerKey(`Q${question.number}`, label)
                    }
                    onUpdateQuestion={(q) => updateQuestion(qIndex, q)}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT — Barème summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Barème</h2>
              </div>

              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Réponses correctes</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {answeredCount}/{totalQuestions} définie
                    {answeredCount > 1 ? "s" : ""}
                  </p>
                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          totalQuestions > 0
                            ? (answeredCount / totalQuestions) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {extractedQuestions.map((q) => {
                      const answer = answerKey[`Q${q.number}`];
                      return (
                        <div
                          key={q.number}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            answer
                              ? "bg-green-50 border border-green-200"
                              : "bg-muted/50 border border-transparent"
                          }`}
                        >
                          <span className="font-medium text-muted-foreground">
                            Q{q.number}
                          </span>
                          {answer ? (
                            <Badge className="bg-green-600 hover:bg-green-600 text-white">
                              {answer}
                            </Badge>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium">
                              À définir
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="text-xs text-muted-foreground mb-4">
                    <strong>{uploadedFiles.length}</strong> copie
                    {uploadedFiles.length > 1 ? "s" : ""} à corriger
                  </div>

                  <Button
                    className="w-full gap-2 font-semibold"
                    size="lg"
                    onClick={handleGrade}
                    disabled={isLoading || answeredCount < totalQuestions}
                  >
                    Corriger toutes les copies
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {answeredCount < totalQuestions && (
                    <p className="text-xs text-amber-600 text-center mt-2">
                      Complétez le barème pour continuer
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

/* ─────────── Question Card ─────────── */

function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  onUpdateQuestion,
}: {
  question: Question;
  selectedAnswer: string;
  onSelectAnswer: (label: string) => void;
  onUpdateQuestion: (q: Question) => void;
}) {
  const [editingText, setEditingText] = useState(false);
  const [editText, setEditText] = useState(question.text);

  const saveTextEdit = () => {
    onUpdateQuestion({ ...question, text: editText });
    setEditingText(false);
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(
      65 + question.options.length // A=65, B=66, ...
    );
    if (question.options.length >= 10) return; // max J
    onUpdateQuestion({
      ...question,
      options: [...question.options, { label: nextLabel, text: "" }],
    });
  };

  const removeLastOption = () => {
    if (question.options.length <= 2) return; // minimum 2 options
    const removed = question.options[question.options.length - 1];
    const newOptions = question.options.slice(0, -1);
    onUpdateQuestion({ ...question, options: newOptions });
    // If the removed option was selected, clear it
    if (selectedAnswer === removed.label) {
      onSelectAnswer("");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Badge
              variant="outline"
              className="shrink-0 mt-0.5 font-bold text-primary border-primary/30 bg-primary/5"
            >
              Q{question.number}
            </Badge>
            {editingText ? (
              <div className="flex-1 flex gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTextEdit();
                    if (e.key === "Escape") setEditingText(false);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveTextEdit}
                  className="shrink-0 text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingText(false)}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <CardTitle
                className="text-sm font-medium leading-relaxed cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  setEditText(question.text);
                  setEditingText(true);
                }}
              >
                {question.text}
                <Pencil className="inline-block ml-2 h-3 w-3 text-muted-foreground/50" />
              </CardTitle>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Options — click to set as correct answer */}
        <p className="text-xs text-muted-foreground mb-2">
          Cliquez sur la bonne réponse :
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.label;
            return (
              <button
                key={option.label}
                onClick={() =>
                  onSelectAnswer(isSelected ? "" : option.label)
                }
                className={`px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                  isSelected
                    ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-400 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-primary/[0.03] text-foreground"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {option.label}
                </span>
                {option.text && (
                  <span className="truncate text-xs font-normal max-w-[80px]">
                    {option.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add / Remove options */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {question.options.length} option{question.options.length > 1 ? "s" : ""}
          </span>
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={removeLastOption}
              disabled={question.options.length <= 2}
              title="Retirer la dernière option"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
              onClick={addOption}
              disabled={question.options.length >= 10}
              title="Ajouter une option"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
