import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUI } from "./ui-state";
import { useLookups, useRepo, useSnapshot } from "@/hooks/use-data";
import { useTaskActions } from "@/hooks/use-task-actions";
import { PRIORITY_LABEL, STATUS_LABEL, todayISO } from "@/lib/domain/rules";
import type { TaskPriority, TaskStatus } from "@/lib/domain/types";
import { ContextBadge } from "./badges";

const field = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm";

export function TaskDetail() {
  const { openTaskId, openTask } = useUI();
  const s = useSnapshot();
  const repo = useRepo();
  const { client, user } = useLookups();
  const actions = useTaskActions();
  const task = s.tasks.find((t) => t.id === openTaskId);
  const taskClient = client(task?.clientId);
  const taskAssignee = user(task?.assigneeId);

  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && openTask(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {task && (
          <div className="flex flex-col gap-5 pt-4">
            <ContextBadge context={task.context} />
            <SheetTitle asChild>
              <input defaultValue={task.title} key={task.id} onBlur={(e) => e.target.value.trim() && e.target.value !== task.title && repo.updateTask(task.id, { title: e.target.value.trim() }, "Título alterado")}
                className="bg-transparent text-xl font-semibold outline-none" />
            </SheetTitle>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1"><span className="eyebrow">Status</span>
                <select className={field} value={task.status} onChange={(e) => repo.updateTask(task.id, { status: e.target.value as TaskStatus })}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></label>
              <label className="space-y-1"><span className="eyebrow">Prioridade</span>
                <select className={field} value={task.priority} onChange={(e) => repo.updateTask(task.id, { priority: e.target.value as TaskPriority })}>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></label>
              <label className="space-y-1"><span className="eyebrow">Prazo</span>
                <input type="date" className={field} value={task.dueDate ?? ""} onChange={(e) => repo.updateTask(task.id, { dueDate: e.target.value || undefined }, "Prazo alterado")} /></label>
              <label className="space-y-1"><span className="eyebrow">Planejada para</span>
                <input type="date" className={field} value={task.scheduledDate ?? ""} onChange={(e) => actions.schedule(task.id, e.target.value || undefined)} /></label>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {taskClient && <span>Cliente: {taskClient.companyName}</span>}
              {taskAssignee && <span>· Responsável: {taskAssignee.name}</span>}
            </div>
            <label className="space-y-1"><span className="eyebrow">Descrição</span>
              <textarea key={task.id + "d"} rows={3} defaultValue={task.description} onBlur={(e) => repo.updateTask(task.id, { description: e.target.value })} className={field} /></label>
            <label className="space-y-1"><span className="eyebrow">Onde parei?</span>
              <textarea key={task.id + "r"} rows={2} defaultValue={task.resumeNote} placeholder="Uma frase para retomar depois" onBlur={(e) => repo.updateTask(task.id, { resumeNote: e.target.value, lastWorkedAt: new Date().toISOString() })} className={field} /></label>
            {task.checklist.length > 0 && (
              <div className="space-y-1"><span className="eyebrow">Checklist</span>
                {task.checklist.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={c.done} onChange={() => repo.updateTask(task.id, { checklist: task.checklist.map((x) => x.id === c.id ? { ...x, done: !x.done } : x) })} />
                    <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.text}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => actions.toggle(task.id, task.status === "done")} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                {task.status === "done" ? "Reabrir" : "Concluir"}
              </button>
              <button onClick={() => actions.schedule(task.id, todayISO())} className="rounded-lg border border-border px-3 py-2 text-sm">Fazer hoje</button>
              <button onClick={() => { actions.remove(task.id); openTask(null); }} className="rounded-lg border border-border px-3 py-2 text-sm text-destructive">Excluir</button>
            </div>
            {task.activity.length > 0 && (
              <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                {task.activity.slice(-5).reverse().map((a) => <p key={a.id}>{a.message}</p>)}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
