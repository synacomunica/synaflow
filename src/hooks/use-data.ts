import { useMemo, useSyncExternalStore } from "react";
import { getRepository } from "@/lib/data";
import { canView } from "@/lib/domain/rules";
import type { ID } from "@/lib/domain/types";

const repo = getRepository();

export function useSnapshot() {
  return useSyncExternalStore(repo.subscribe, repo.getSnapshot, repo.getSnapshot);
}

export const useRepo = () => repo;

/** Tarefas visíveis para a sessão atual (pessoais do próprio usuário + organização). */
export function useVisibleTasks() {
  const s = useSnapshot();
  return useMemo(() => s.tasks.filter((t) => canView(t, s.session)), [s.tasks, s.session]);
}

/** Tarefas atribuídas a mim (ou pessoais minhas). */
export function useMyTasks() {
  const s = useSnapshot();
  const visible = useVisibleTasks();
  return useMemo(() => visible.filter((t) => t.assigneeId === s.session.userId || t.ownerId === s.session.userId), [visible, s.session.userId]);
}

export function useLookups() {
  const s = useSnapshot();
  return useMemo(() => {
    const user = (id?: ID) => s.users.find((u) => u.id === id);
    const client = (id?: ID) => s.clients.find((c) => c.id === id);
    const project = (id?: ID) => s.projects.find((p) => p.id === id);
    const execution = (id?: ID) => s.executions.find((e) => e.id === id);
    return { user, client, project, execution, me: user(s.session.userId) };
  }, [s]);
}
