import { Badge } from "@/components/ui/badge";
import { DeploymentStatus } from "@prisma/client";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MinusCircle,
} from "lucide-react";

type Props = {
  status: DeploymentStatus | "NO_DEPLOYMENTS" | string;
  size?: "sm" | "default";
};

export function DeploymentStatusBadge({ status, size = "default" }: Props) {
  const isSmall = size === "sm";
  const iconClass = isSmall ? "size-3 shrink-0" : "size-3.5 shrink-0";
  const textClass = isSmall ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  switch (status) {
    case "READY":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium ${textClass}`}
        >
          <CheckCircle2 className={iconClass} />
          <span>Ready</span>
        </Badge>
      );

    case "BUILDING":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium animate-pulse ${textClass}`}
        >
          <Loader2 className={`${iconClass} animate-spin`} />
          <span>Building</span>
        </Badge>
      );

    case "DEPLOYING":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium animate-pulse ${textClass}`}
        >
          <Loader2 className={`${iconClass} animate-spin`} />
          <span>Deploying</span>
        </Badge>
      );

    case "QUEUED":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium ${textClass}`}
        >
          <Clock className={iconClass} />
          <span>Queued</span>
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

    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-muted-foreground/30 bg-muted/40 text-muted-foreground font-medium ${textClass}`}
        >
          <MinusCircle className={iconClass} />
          <span>Cancelled</span>
        </Badge>
      );

    case "NO_DEPLOYMENTS":
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 border-muted-foreground/30 bg-muted/30 text-muted-foreground font-medium ${textClass}`}
        >
          <MinusCircle className={iconClass} />
          <span>No Deployments</span>
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
