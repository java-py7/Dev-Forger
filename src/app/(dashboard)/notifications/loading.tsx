import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

export default function NotificationsLoading() {
  return (
    <main className="min-h-full">
      {/* Header Skeleton */}
      <div className="border-b">
        <div className="px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Bell className="size-5" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Tabs Toolbar Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>

          {/* List Skeleton */}
          <div className="rounded-xl border border-border/80 bg-card/40 divide-y divide-border/60 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3.5 px-4 py-3.5">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
