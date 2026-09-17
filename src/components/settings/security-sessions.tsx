"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { revokeOtherSessionsAction } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Check, Laptop, LogOut, ShieldAlert, Loader2 } from "lucide-react";

type SessionItem = {
  id: string;
  expires: string;
};

type SecuritySessionsProps = {
  sessions: SessionItem[];
};

export function SecuritySessions({ sessions }: SecuritySessionsProps) {
  const [sessionList, setSessionList] = useState(sessions);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRevokeOthers = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await revokeOtherSessionsAction();
      if (res.success) {
        setSuccess("All other active sessions have been revoked.");
        setSessionList((prev) => prev.slice(0, 1));
      } else {
        setError(res.error || "Failed to revoke sessions.");
      }
    });
  };

  const hasMultipleSessions = sessionList.length > 1;

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

      {/* Session list items */}
      <div className="rounded-xl border border-border/80 bg-card/40 divide-y divide-border/60 overflow-hidden">
        {sessionList.map((s, index) => {
          const isCurrent = index === 0;
          const expiryDate = new Date(s.expires).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={s.id}
              className="flex items-center justify-between p-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/70 text-foreground">
                  <Laptop className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {isCurrent ? "Current Active Session" : "Active Session"}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-medium px-2 py-0.5">
                        Active Now
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Valid until {expiryDate}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          {hasMultipleSessions && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={isPending}
              className="cursor-pointer text-xs gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Revoking...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="size-3.5" />
                  <span>Sign out of other sessions</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Global Sign out */}
        <AlertDialog>
          <AlertDialogTrigger className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 text-xs font-medium transition-colors ml-auto">
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of DevForge?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be signed out of your current session. You can sign back in at any time with your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() =>
                  signOut({
                    redirectTo: "/login",
                  })
                }
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
