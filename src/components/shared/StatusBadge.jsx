import React from "react";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary" },
  blocked: { label: "Blocked", className: "bg-destructive/10 text-destructive" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
  need_help: { label: "Need Help", className: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-primary/10 text-primary" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
  on_track: { label: "On Track", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="secondary" className={`${config.className} font-medium text-xs border-0`}>
      {config.label}
    </Badge>
  );
}