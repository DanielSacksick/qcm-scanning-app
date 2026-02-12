"use client";

import { usePathname } from "next/navigation";
import { User } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/portal": "Tableau de bord",
  "/portal/qcm": "QCM Corrector",
  "/portal/qcm/upload": "QCM Corrector — Import",
  "/portal/qcm/review": "QCM Corrector — Barème",
  "/portal/qcm/results": "QCM Corrector — Résultats",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "OA Portal";

  return (
    <header className="h-14 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block">
          Olivier Albrecht
        </span>
      </div>
    </header>
  );
}
