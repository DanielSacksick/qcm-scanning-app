"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQCMStore } from "@/lib/store/qcmStore";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, X, FileText, ArrowRight } from "lucide-react";

const ACCEPTED = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

export default function QCMUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    uploadedFiles,
    setUploadedFiles,
    setExtractedQuestions,
    setIsLoading,
    setLoadingMessage,
    isLoading,
  } = useQCMStore();

  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const valid = Array.from(files).filter((f) => {
        if (!ACCEPTED.includes(f.type)) {
          toast({
            title: "Format non supporté",
            description: `"${f.name}" — seuls PDF, JPG, PNG sont acceptés.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setUploadedFiles([...uploadedFiles, ...valid]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadedFiles, setUploadedFiles, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    const f = [...uploadedFiles];
    f.splice(index, 1);
    setUploadedFiles(f);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Ajoutez au moins une copie à analyser.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyse de la structure du QCM…");

    try {
      const formData = new FormData();
      formData.append("files", uploadedFiles[0]);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur lors de l'analyse.");
      }

      const data = await res.json();
      setExtractedQuestions(data.questions);
      router.push("/portal/qcm/review");
    } catch (err: unknown) {
      toast({
        title: "Erreur d'analyse",
        description:
          err instanceof Error ? err.message : "Erreur inconnue.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={1} />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Importer les copies
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Glissez-déposez vos copies d&apos;examen. La première copie servira
          de référence pour détecter la structure du QCM.
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-all cursor-pointer rounded-xl ${
          dragActive
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 scale-[1.005]"
            : "border-border hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))]/[0.02]"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
          <div
            className={`p-3.5 rounded-2xl transition-colors ${
              dragActive
                ? "bg-[hsl(var(--primary))]/10"
                : "bg-muted"
            }`}
          >
            <Upload
              className={`h-8 w-8 ${
                dragActive
                  ? "text-[hsl(var(--primary))]"
                  : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              Glissez vos fichiers ici
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              ou cliquez pour sélectionner — PDF, JPG, PNG
            </p>
          </div>
        </CardContent>
      </Card>

      <input
        id="file-input"
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* File grid */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {uploadedFiles.length} fichier
              {uploadedFiles.length > 1 ? "s" : ""} sélectionné
              {uploadedFiles.length > 1 ? "s" : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadedFiles([])}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Tout supprimer
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map((file, i) => (
              <FileCard
                key={`${file.name}-${i}`}
                file={file}
                isRef={i === 0}
                onRemove={() => removeFile(i)}
              />
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="font-semibold gap-2 px-7 rounded-xl"
            >
              Analyser le QCM
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── File Preview Card ─── */

function FileCard({
  file,
  isRef,
  onRemove,
}: {
  file: File;
  isRef: boolean;
  onRemove: () => void;
}) {
  const isPdf = file.type === "application/pdf";
  const [preview, setPreview] = useState<string | null>(null);

  if (!isPdf && !preview) {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <Card
      className={`group relative overflow-hidden rounded-xl ${
        isRef ? "ring-2 ring-[hsl(var(--primary))]/40" : ""
      }`}
    >
      {isRef && (
        <div className="absolute top-0 left-0 right-0 bg-[hsl(var(--primary))] text-white text-[10px] font-bold text-center py-0.5 z-10 uppercase tracking-wider">
          Référence QCM
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <CardContent
        className={`p-3 flex items-center gap-3 ${isRef ? "pt-6" : ""}`}
      >
        <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : isPdf ? (
            <FileText className="h-5 w-5 text-red-500" />
          ) : (
            <FileImage className="h-5 w-5 text-[hsl(var(--primary))]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} Ko
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
