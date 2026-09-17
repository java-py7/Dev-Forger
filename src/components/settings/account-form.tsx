"use client";

import { useState, useTransition } from "react";
import { updateAccountAction } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, Loader2 } from "lucide-react";

type AccountFormProps = {
  initialName: string;
  initialUsername: string;
  email: string;
};

export function AccountForm({
  initialName,
  initialUsername,
  email,
}: AccountFormProps) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateAccountAction({ name, username });
      if (res.success) {
        setSuccess("Account information updated successfully.");
      } else {
        setError(res.error || "Failed to update account.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Display Name */}
      <div className="space-y-1.5">
        <Label htmlFor="account-name" className="text-xs font-medium">
          Display Name
        </Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
          disabled={isPending}
          className="h-9 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Your public name visible on projects, teams, and discussions.
        </p>
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="account-username" className="text-xs font-medium">
          Username
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
            @
          </span>
          <Input
            id="account-username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
            placeholder="username"
            disabled={isPending}
            className="h-9 pl-7 text-sm"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Unique handle across DevForge. Lowercase letters, numbers, and hyphens.
        </p>
      </div>

      {/* Email (Read-only from Auth provider) */}
      <div className="space-y-1.5">
        <Label htmlFor="account-email" className="text-xs font-medium text-muted-foreground">
          Email Address
        </Label>
        <Input
          id="account-email"
          value={email}
          disabled
          readOnly
          className="h-9 bg-muted/40 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-[11px] text-muted-foreground">
          Managed by your connected authentication provider.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className="cursor-pointer gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </Button>
      </div>
    </form>
  );
}
