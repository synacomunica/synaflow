import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/domain/rules";
import type { TaskPriority, TaskStatus, TaskContext } from "@/lib/domain/types";
import { Lock } from "lucide-react";

const pill = "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap";

const PRIORITY_CLS: Record<TaskPriority, string> = {
  urgent: "border-destructive/40 text-destructive",
  high: "border-warning/40 text-warning",
  medium: "border-border text-muted-foreground",
  low: "border-border text-muted-foreground/70",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn(pill, PRIORITY_CLS[priority])}>
      <span className="size-1.5 rounded-full bg-current" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

const STATUS_CLS: Record<TaskStatus, string> = {
  inbox: "border-info/40 text-info",
  todo: "border-border text-muted-foreground",
  in_progress: "border-primary/40 text-primary",
  waiting: "border-warning/30 text-warning",
  done: "border-success/40 text-success",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn(pill, STATUS_CLS[status])}>{STATUS_LABEL[status]}</span>;
}

export function ContextBadge({ context }: { context: TaskContext }) {
  return context === "personal" ? (
    <span className={cn(pill, "border-border text-muted-foreground")}><Lock className="size-3" />Pessoal</span>
  ) : (
    <span className={cn(pill, "border-border text-muted-foreground")}>Syna</span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn(pill, "border-warning/30 bg-warning/10 text-warning", className)} title="Dados de demonstração — não persistem ao recarregar">
      Demonstração
    </span>
  );
}

export function SoonBadge() {
  return <span className={cn(pill, "border-border text-muted-foreground/70")}>Em breve</span>;
}
