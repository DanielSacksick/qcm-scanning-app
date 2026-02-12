"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/portal" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-[hsl(var(--primary))]/15 border-t-[hsl(var(--primary))]" />
    </div>
  );
}
