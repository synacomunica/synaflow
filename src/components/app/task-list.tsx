import { Check, CalendarClock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLookups } from "@/hooks/use-data";
import { useTaskActions } from "@/hooks/use-task-actions";
import { relativeDue, todayISO } from "@/lib/domain/rules";
import type { Task } from "@/lib/domain/types";
import { PriorityBadge, StatusBadge, ContextBadge } from "./badges";
import { useUI } from "./ui-state";
import type { ReactNode } from "react";

export function TaskCheck({ task }: { task: Task }) {
  const { toggle } = useTaskActions();
  const done = task.status === "done";
  return (
    <button
      aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"}
      onClick={(e) => { e.stopPropagation(); toggle(task.id, done); }}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border transition-colors",
        done ? "animate-complete border-success bg-success text-background" : "border-muted-foreground/50 hover:border-primary",
      )}
    >
      {done && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

export function TaskRow({ task, compact, trailing }: { task: Task; compact?: boolean | undefined; trailing?: ReactNode }) {
  const { openTask } = useUI();
  const { client, user, execution } = useLookups();
  const today = todayISO();
  const c = client(task.clientId);
  const assignee = user(task.assigneeId);
  const exec = execution(task.processExecutionId);
  const overdue = task.dueDate && task.dueDate < today && task.status !== "done";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => e.key === "Enter" && openTask(task.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
    >
      <TaskCheck task={task} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", task.status === "done" && "text-muted-foreground line-through")}>{task.title}</p>
        {!compact && (c || exec) && (
          <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
            {c && <span>{c.companyName}</span>}
            {exec && <span className="flex items-center gap-1"><GitBranch className="size-3" />{exec.templateName}</span>}
          </p>
        )}
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        {!compact && <ContextBadge context={task.context} />}
        {!compact && <StatusBadge status={task.status} />}
        <PriorityBadge priority={task.priority} />
      </div>
      {task.dueDate && (
        <span className={cn("flex w-16 items-center justify-end gap-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
          <CalendarClock className="size-3" />{relativeDue(task.dueDate, today)}
        </span>
      )}
      {!compact && assignee && (
        <span title={assignee.name} className="hidden size-6 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted-foreground md:grid">{assignee.initials}</span>
      )}
      {trailing}
    </div>
  );
}

export function TaskList({ tasks, compact, empty }: { tasks: Task[]; compact?: boolean | undefined; empty?: ReactNode }) {
  if (!tasks.length) return <>{empty}</>;
  return <div className="-mx-3 flex flex-col">{tasks.map((t) => <TaskRow key={t.id} task={t} compact={compact} />)}</div>;
}
