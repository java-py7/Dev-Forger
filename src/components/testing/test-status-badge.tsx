import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  HelpCircle,
} from "lucide-react";

type TestStatus =
  | "PASSED"
  | "FAILED"
  | "RUNNING"
  | "PENDING"
  | "UNRUN"
  | "NOT_CONFIGURED"
  | "IDLE"
  | "ERROR"
  | "CANCELLED";

type Props = {
  status: TestStatus | string;
  size?: "sm" | "default";
};

export function TestStatusBadge({ status, size = "default" }: Props) {
  const isSmall = size === "sm";
  const iconClass = isSmall ? "size-3 shrink-0" : "size-3.5 shrink-0";
  const textClass = isSmall ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  switch (status) {
    case "PASSED":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium ${textClass}`}
        >
          <CheckCircle2 className={iconClass} />
          <span>Passed</span>
        </Badge>
      );

    case "FAILED":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium ${textClass}`}
        >
          <XCircle className={iconClass} />
          <span>Failed</span>
        </Badge>
      );

    case "RUNNING":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium animate-pulse ${textClass}`}
        >
          <Loader2 className={`${iconClass} animate-spin`} />
          <span>Running</span>
        </Badge>
      );

    case "PENDING":
    case "UNRUN":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium ${textClass}`}
        >
          <Clock className={iconClass} />
          <span>Pending</span>
        </Badge>
      );

    case "NOT_CONFIGURED":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-muted-foreground/30 bg-muted/40 text-muted-foreground font-medium ${textClass}`}
        >
          <HelpCircle className={iconClass} />
          <span>Not Configured</span>
        </Badge>
      );

    case "IDLE":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-muted-foreground/30 bg-muted/30 text-muted-foreground font-medium ${textClass}`}
        >
          <Clock className={iconClass} />
          <span>No Runs</span>
        </Badge>
      );

    case "ERROR":
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium ${textClass}`}
        >
          <AlertTriangle className={iconClass} />
          <span>{status === "CANCELLED" ? "Cancelled" : "Error"}</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="secondary" className={textClass}>
          {status}
        </Badge>
      );
  }
}
