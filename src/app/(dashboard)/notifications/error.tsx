"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Notifications error:", error);
  }, [error]);

  return (
    <main className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="size-6" />
        </div>

        <h2 className="text-lg font-medium text-foreground">
          Unable to load notifications
        </h2>

        <p className="mt-1.5 text-sm text-muted-foreground">
          An unexpected error occurred while loading your notifications. Please try again.
        </p>

        <div className="mt-6">
          <Button
            onClick={() => reset()}
            variant="outline"
            size="sm"
            className="cursor-pointer gap-2"
          >
            <RotateCcw className="size-3.5" />
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
