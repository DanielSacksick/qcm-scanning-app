"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FileCheck2, LogOut } from "lucide-react";

export function AppHeader() {
  const router = useRouter();
  const resetAll = useAppStore((s) => s.resetAll);

  const handleLogout = () => {
    logout();
    resetAll();
    router.push("/login");
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileCheck2 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">
            QCM Scanner
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
