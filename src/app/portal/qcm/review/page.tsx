"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQCMStore } from "@/lib/store/qcmStore";
import type { Question } from "@/lib/types/qcm";
import { StepIndicator } from "@/components/layout/StepIndicator";
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

export default function QCMReviewPage() {
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
  } = useQCMStore();

  // Init answer key
  useEffect(() => {
    if (extractedQuestions.length > 0 && Object.keys(answerKey).length === 0) {
      const key: Record<string, string> = {};
      extractedQuestions.forEach((q) => {
        key[`Q${q.number}`] = "";
      });
      setAnswerKey(key);
    }
  }, [extractedQuestions, answerKey, setAnswerKey]);

  useEffect(() => {
    if (extractedQuestions.length === 0) {
      router.replace("/portal/qcm/upload");
    }
  }, [extractedQuestions, router]);

  const answeredCount = Object.values(answerKey).filter(Boolean).length;
  const totalQ = extractedQuestions.length;

  const handleGrade = async () => {
    const missing = extractedQuestions.filter(
      (q) => !answerKey[`Q${q.number}`]
    );
    if (missing.length > 0) {
      toast({
        title: "Barème incomplet",
        description: `${missing.length} question${missing.length > 1 ? "s" : ""} sans réponse.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage(
      `Correction de ${uploadedFiles.length} copie${uploadedFiles.length > 1 ? "s" : ""}…`
    );

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => formData.append("files", file));
      formData.append("answerKey", JSON.stringify(answerKey));
      formData.append("questions", JSON.stringify(extractedQuestions));

      const res = await fetch("/api/grade", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur lors de la correction.");
      }

      const data = await res.json();
      setGradingResults(data.results);
      router.push("/portal/qcm/results");
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Erreur inconnue.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  if (extractedQuestions.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <StepIndicator currentStep={2} />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Vérification & Barème
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Vérifiez les questions détectées, ajustez si nécessaire, puis
          sélectionnez la bonne réponse pour chaque question.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h3 className="text-sm font-semibold text-foreground">
              Questions détectées ({totalQ})
            </h3>
          </div>

          <div className="space-y-3">
            {extractedQuestions.map((q, i) => (
              <QuestionCard
                key={q.number}
                question={q}
                selectedAnswer={answerKey[`Q${q.number}`] || ""}
                onSelectAnswer={(l) => updateAnswerKey(`Q${q.number}`, l)}
                onUpdateQuestion={(upd) => updateQuestion(i, upd)}
              />
            ))}
          </div>
        </div>

        {/* Barème sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h3 className="text-sm font-semibold text-foreground">Barème</h3>
          </div>

          <Card className="sticky top-20 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Réponses correctes</CardTitle>
              <p className="text-xs text-muted-foreground">
                {answeredCount}/{totalQ} définie{answeredCount > 1 ? "s" : ""}
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className="bg-[hsl(var(--primary))] h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalQ > 0 ? (answeredCount / totalQ) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {extractedQuestions.map((q) => {
                  const answer = answerKey[`Q${q.number}`];
                  return (
                    <div
                      key={q.number}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        answer
                          ? "bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20"
                          : "bg-muted/50"
                      }`}
                    >
                      <span className="font-medium text-muted-foreground">
                        Q{q.number}
                      </span>
                      {answer ? (
                        <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))] text-white text-[10px] h-5">
                          {answer}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">
                          À définir
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-muted-foreground mb-3">
                <strong>{uploadedFiles.length}</strong> copie
                {uploadedFiles.length > 1 ? "s" : ""} à corriger
              </p>

              <Button
                className="w-full gap-2 font-semibold rounded-xl"
                size="lg"
                onClick={handleGrade}
                disabled={isLoading || answeredCount < totalQ}
              >
                Corriger toutes les copies
                <ArrowRight className="h-4 w-4" />
              </Button>

              {answeredCount < totalQ && (
                <p className="text-[10px] text-amber-600 text-center mt-2">
                  Complétez le barème pour continuer
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Question Card ─── */

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

  const save = () => {
    onUpdateQuestion({ ...question, text: editText });
    setEditingText(false);
  };

  const addOption = () => {
    if (question.options.length >= 10) return;
    const next = String.fromCharCode(65 + question.options.length);
    onUpdateQuestion({
      ...question,
      options: [...question.options, { label: next, text: "" }],
    });
  };

  const removeOption = () => {
    if (question.options.length <= 2) return;
    const removed = question.options[question.options.length - 1];
    onUpdateQuestion({
      ...question,
      options: question.options.slice(0, -1),
    });
    if (selectedAnswer === removed.label) onSelectAnswer("");
  };

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Badge
            variant="outline"
            className="shrink-0 mt-0.5 font-bold text-[hsl(var(--primary))] border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5 text-xs"
          >
            Q{question.number}
          </Badge>
          {editingText ? (
            <div className="flex-1 flex gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-sm h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") setEditingText(false);
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={save}
                className="shrink-0 h-8 w-8 p-0 text-[hsl(var(--success))]"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingText(false)}
                className="shrink-0 h-8 w-8 p-0 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <CardTitle
              className="text-sm font-medium leading-relaxed cursor-pointer hover:text-[hsl(var(--primary))] transition-colors flex-1"
              onClick={() => {
                setEditText(question.text);
                setEditingText(true);
              }}
            >
              {question.text}
              <Pencil className="inline-block ml-1.5 h-3 w-3 text-muted-foreground/40" />
            </CardTitle>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
          Cliquez sur la bonne réponse
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {question.options.map((opt) => {
            const sel = selectedAnswer === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => onSelectAnswer(sel ? "" : opt.label)}
                className={`px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                  sel
                    ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] ring-1 ring-[hsl(var(--success))]/30"
                    : "border-border hover:border-[hsl(var(--primary))]/30 hover:bg-[hsl(var(--primary))]/[0.03] text-foreground"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    sel
                      ? "bg-[hsl(var(--success))] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </span>
                {opt.text && (
                  <span className="truncate text-xs font-normal max-w-[80px]">
                    {opt.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-[10px] text-muted-foreground">
            {question.options.length} option
            {question.options.length > 1 ? "s" : ""}
          </span>
          <div className="flex gap-0.5 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={removeOption}
              disabled={question.options.length <= 2}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-[hsl(var(--primary))]"
              onClick={addOption}
              disabled={question.options.length >= 10}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
