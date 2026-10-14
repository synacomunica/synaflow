import { toast } from "sonner";
import { useRepo } from "./use-data";
import type { ID, ISODate } from "@/lib/domain/types";

/** Ações de tarefa com feedback imediato e opção de desfazer. */
export function useTaskActions() {
  const repo = useRepo();
  const undoable = (msg: string) =>
    toast.success(msg, { action: { label: "Desfazer", onClick: () => repo.undo() } });

  return {
    toggle(id: ID, done: boolean) {
      if (done) { repo.reopenTask(id); undoable("Tarefa reaberta"); }
      else { repo.completeTask(id); undoable("Tarefa concluída"); }
    },
    schedule(id: ID, date: ISODate | undefined) {
      repo.rescheduleTask(id, date);
      undoable(date ? "Tarefa planejada" : "Removida do planejamento");
    },
    remove(id: ID) { repo.deleteTask(id); undoable("Tarefa excluída"); },
  };
}
