"use client";

import { useAppStore } from "@/lib/store";

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useAppStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
        </div>
        <p className="text-lg font-medium text-foreground text-center">
          {loadingMessage || "Chargement..."}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Veuillez patienter, cela peut prendre quelques instants.
        </p>
      </div>
    </div>
  );
}
