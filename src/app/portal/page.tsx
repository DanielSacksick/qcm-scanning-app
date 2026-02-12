"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus, ArrowRight, Sparkles, Mail } from "lucide-react";

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
        <RequestCard />
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
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(var(--primary))]/5 hover:-translate-y-0.5 cursor-pointer">
      <CardContent className="p-6 flex flex-col h-full min-h-[200px]">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${app.color}`}
          >
            <app.icon className="h-5 w-5 text-white" />
          </div>
          <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))] text-white text-[10px]">
            Actif
          </Badge>
        </div>

        <h3 className="font-semibold text-foreground mb-1.5">{app.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {app.description}
        </p>

        <Link href={app.href} className="mt-4">
          <Button
            className="w-full gap-2 font-semibold group-hover:shadow-md transition-shadow"
            size="sm"
          >
            Ouvrir
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function RequestCard() {
  const subject = encodeURIComponent("Nouvelle application · OA Portal");
  const body = encodeURIComponent(
    `Bonjour Dan,

J'aimerais discuter d'une nouvelle application pour mon portail.

Besoin : [décrivez brièvement votre besoin]

Merci,
Olivier`
  );
  const mailto = `mailto:dan.saffar@luteceia.com?subject=${subject}&body=${body}`;

  return (
    <a href={mailto}>
      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-dashed border-2 h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px] text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/10 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Demander une application
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un besoin spécifique ? Décrivez-le et nous le construisons.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors mt-1">
            <Mail className="h-3.5 w-3.5" />
            <span>Envoyer une demande</span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
