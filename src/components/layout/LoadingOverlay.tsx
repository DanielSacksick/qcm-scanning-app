"use client";

import { useQCMStore } from "@/lib/store/qcmStore";

export function LoadingOverlay() {
  const isLoading = useQCMStore((s) => s.isLoading);
  const loadingMessage = useQCMStore((s) => s.loadingMessage);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-5 max-w-sm mx-4 border">
        <div className="relative">
          <div className="animate-spin rounded-full h-11 w-11 border-[3px] border-[hsl(var(--primary))]/15 border-t-[hsl(var(--primary))]" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">
            {loadingMessage || "Chargement..."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Veuillez patienter, cela peut prendre quelques instants.
          </p>
        </div>
      </div>
    </div>
  );
}
