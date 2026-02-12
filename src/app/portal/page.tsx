"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Lock, ArrowRight, Sparkles } from "lucide-react";

const APPS = [
  {
    id: "qcm",
    title: "QCM Corrector",
    description:
      "Corrigez vos QCM automatiquement par reconnaissance d'image. Importez vos copies, définissez le barème, exportez les résultats.",
    icon: GraduationCap,
    href: "/portal/qcm/upload",
    status: "active" as const,
    color: "bg-[hsl(var(--primary))]",
  },
  {
    id: "coming-1",
    title: "Prochaine application",
    description: "Un nouvel outil est en cours de développement pour simplifier votre quotidien.",
    icon: Lock,
    href: "#",
    status: "coming" as const,
    color: "bg-muted",
  },
  {
    id: "coming-2",
    title: "Prochaine application",
    description: "Un nouvel outil est en cours de développement pour simplifier votre quotidien.",
    icon: Lock,
    href: "#",
    status: "coming" as const,
    color: "bg-muted",
  },
];

export default function PortalDashboard() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--primary))]">
            Portail
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Olivier Albrecht · Apps Portal
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Vos outils personnalisés, propulsés par l&apos;intelligence artificielle.
        </p>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {APPS.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {/* Footer credit */}
      <div className="mt-16 pt-6 border-t">
        <p className="text-xs text-muted-foreground/50">
          Développé par{" "}
          <a
            href="https://luteceia.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            luteceia · luteceia.ch
          </a>
        </p>
      </div>
    </div>
  );
}

function AppCard({
  app,
}: {
  app: (typeof APPS)[0];
}) {
  const isActive = app.status === "active";

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 ${
        isActive
          ? "hover:shadow-lg hover:shadow-[hsl(var(--primary))]/5 hover:-translate-y-0.5 cursor-pointer"
          : "opacity-60"
      }`}
    >
      <CardContent className="p-6 flex flex-col h-full min-h-[200px]">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${app.color}`}
          >
            <app.icon
              className={`h-5 w-5 ${
                isActive ? "text-white" : "text-muted-foreground"
              }`}
            />
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))] text-white text-[10px]"
                : "text-[10px]"
            }
          >
            {isActive ? "Actif" : "Bientôt"}
          </Badge>
        </div>

        <h3 className="font-semibold text-foreground mb-1.5">{app.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {app.description}
        </p>

        {isActive ? (
          <Link href={app.href} className="mt-4">
            <Button
              className="w-full gap-2 font-semibold group-hover:shadow-md transition-shadow"
              size="sm"
            >
              Ouvrir
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        ) : (
          <div className="mt-4">
            <Button
              variant="secondary"
              className="w-full font-medium"
              size="sm"
              disabled
            >
              En développement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
