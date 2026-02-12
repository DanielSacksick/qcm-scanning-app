"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-[hsl(var(--primary))]/15 border-t-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay />
      <Sidebar />
      {/* Main area — offset by sidebar width. Using pl-60 for expanded sidebar, 
          but since sidebar can collapse, we use a flexible approach */}
      <div className="pl-60 min-h-screen bg-background transition-all duration-200">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </>
  );
}
