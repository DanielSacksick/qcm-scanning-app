"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { AuthGuard } from "@/components/auth-guard";
import { LoadingOverlay } from "@/components/loading-overlay";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, X, FileText, ArrowRight } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    uploadedFiles,
    setUploadedFiles,
    setExtractedQuestions,
    setIsLoading,
    setLoadingMessage,
    isLoading,
  } = useAppStore();

  const [dragActive, setDragActive] = useState(false);

  const acceptedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const newFiles = Array.from(files).filter((f) => {
        if (!acceptedTypes.includes(f.type)) {
          toast({
            title: "Format non supporté",
            description: `Le fichier "${f.name}" n'est pas un format accepté (PDF, JPG, PNG).`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadedFiles, setUploadedFiles, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez ajouter au moins une copie à analyser.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyse de la structure du QCM...");

    try {
      // Only send the FIRST file for QCM structure extraction
      const formData = new FormData();
      formData.append("files", uploadedFiles[0]);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || "Erreur lors de l'analyse de la copie."
        );
      }

      const data = await response.json();
      setExtractedQuestions(data.questions);
      router.push("/review");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inconnue est survenue.";
      toast({
        title: "Erreur d'analyse",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <AuthGuard>
      <LoadingOverlay />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Importer les copies
            </h1>
            <p className="text-muted-foreground mt-2">
              Glissez-déposez vos copies d&apos;examen (PDF, JPG, PNG). Chaque
              fichier correspond à une copie d&apos;étudiant.
              <br />
              <span className="text-xs">
                La première copie sera utilisée pour détecter la structure du
                QCM. Toutes les copies seront corrigées ensuite.
              </span>
            </p>
          </div>

          {/* Drop zone */}
          <Card
            className={`border-2 border-dashed transition-all cursor-pointer ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/[0.02]"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div
                className={`p-4 rounded-2xl transition-colors ${
                  dragActive ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <Upload
                  className={`h-10 w-10 ${
                    dragActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  Glissez vos fichiers ici
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou cliquez pour sélectionner — PDF, JPG, PNG acceptés
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

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Copies sélectionnées ({uploadedFiles.length})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFiles([])}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Tout supprimer
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uploadedFiles.map((file, index) => (
                  <FilePreviewCard
                    key={`${file.name}-${index}`}
                    file={file}
                    isFirst={index === 0}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="text-base font-semibold px-8 gap-2"
                >
                  Analyser le QCM
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

function FilePreviewCard({
  file,
  isFirst,
  onRemove,
}: {
  file: File;
  isFirst: boolean;
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
      className={`group relative overflow-hidden ${
        isFirst ? "ring-2 ring-primary/40" : ""
      }`}
    >
      {isFirst && (
        <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold text-center py-0.5 z-10">
          RÉFÉRENCE QCM
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
      <CardContent className={`p-3 flex items-center gap-3 ${isFirst ? "pt-6" : ""}`}>
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : isPdf ? (
            <FileText className="h-6 w-6 text-red-500" />
          ) : (
            <FileImage className="h-6 w-6 text-primary" />
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
