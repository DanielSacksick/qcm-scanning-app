"use client";

import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Import" },
  { number: 2, label: "Barème" },
  { number: 3, label: "Résultats" },
];

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map((step, i) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-[hsl(var(--success))] text-white"
                    : isActive
                    ? "bg-[hsl(var(--primary))] text-white shadow-md shadow-[hsl(var(--primary))]/25"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : isCompleted
                    ? "text-[hsl(var(--success))]"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`w-10 h-px mx-2 transition-colors ${
                  isCompleted ? "bg-[hsl(var(--success))]" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
