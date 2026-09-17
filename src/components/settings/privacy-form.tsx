"use client";

import { useState, useTransition } from "react";
import { ProfileVisibility } from "@prisma/client";
import { updatePrivacyAction } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Globe, Lock, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type PrivacyFormProps = {
  initialVisibility: ProfileVisibility;
};

const visibilityOptions: {
  value: ProfileVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Your developer profile and public projects are visible to all visitors on DevForge.",
    icon: Globe,
  },
  {
    value: "DEVELOPERS_ONLY",
    label: "Developers Only",
    description: "Your profile is visible only to authenticated developers signed into the platform.",
    icon: Users,
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Your profile is hidden from discovery. Visible only to you and collaborators in your projects.",
    icon: Lock,
  },
];

export function PrivacyForm({ initialVisibility }: PrivacyFormProps) {
  const [visibility, setVisibility] = useState<ProfileVisibility>(initialVisibility);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updatePrivacyAction({ visibility });
      if (res.success) {
        setSuccess("Privacy preferences updated successfully.");
      } else {
        setError(res.error || "Failed to update privacy settings.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-3">
        {visibilityOptions.map((opt) => {
          const Icon = opt.icon;
          const selected = visibility === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              disabled={isPending}
              className={cn(
                "relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-foreground bg-accent/40 shadow-xs"
                  : "border-border/70 hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                  selected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/60 text-muted-foreground border-border/80"
                )}
              >
                <Icon className="size-4" />
              </div>

              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {opt.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {opt.description}
                </p>
              </div>

              {selected && (
                <div className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending || visibility === initialVisibility}
          size="sm"
          className="cursor-pointer gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Preferences</span>
          )}
        </Button>
      </div>
    </div>
  );
}
