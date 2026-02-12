"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    if (login(username, password)) {
      router.push("/portal");
    } else {
      setError("Identifiant ou mot de passe incorrect.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--sidebar))] p-4">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 via-transparent to-transparent" />

      <div className="relative w-full max-w-sm">
        {/* Branding above card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--primary))] mb-4">
            <span className="text-white font-bold text-lg">OA</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Olivier Albrecht
          </h1>
          <p className="text-sm text-white/50 mt-0.5">Apps Portal</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Connexion</CardTitle>
            <CardDescription>
              Accédez à votre portail d&apos;applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-medium">
                  Identifiant
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Votre identifiant"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center font-medium">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Connexion...
                  </span>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-[10px] text-white/25 text-center mt-8 tracking-wide uppercase">
          Développé par{" "}
          <a
            href="https://luteceia.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors"
          >
            luteceia
          </a>
        </p>
      </div>
    </div>
  );
}
