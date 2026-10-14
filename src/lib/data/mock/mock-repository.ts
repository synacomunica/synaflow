// Repositório em memória (DEMONSTRAÇÃO). Os dados são reiniciados ao recarregar a página.
import { addDays } from "../../domain/rules";
import type { Idea, ProcessExecution, Task } from "../../domain/types";
import type { DataSnapshot, Repository } from "../repository";
import { buildSeed } from "./seed";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

export function createMockRepository(): Repository {
  let state: DataSnapshot = buildSeed();
  const history: DataSnapshot[] = [];
  const listeners = new Set<() => void>();

  const commit = (next: DataSnapshot) => {
    history.push(state);
    if (history.length > 20) history.shift();
    state = next;
    listeners.forEach((l) => l());
  };

  const act = (message: string) => ({ id: uid("a"), actorId: state.session.userId, message, createdAt: nowISO() });

  const patchTask = (id: string, fn: (t: Task) => Task) =>
    commit({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...fn(t), updatedAt: nowISO() } : t)) });

  const repo: Repository = {
    getSnapshot: () => state,
    subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },

    createTask(input) {
      const { userId, organizationId } = state.session;
      const context = input.context ?? "personal";
      const task: Task = {
        status: "inbox", priority: "medium", checklist: [], comments: [],
        ...input,
        id: uid("t"),
        context,
        // Pessoal → proprietário; Trabalho → organização. Nunca ambos implicitamente.
        ownerId: context === "personal" ? userId : undefined,
        organizationId: context === "work" ? organizationId : undefined,
        assigneeId: input.assigneeId ?? userId,
        createdBy: userId,
        createdAt: nowISO(), updatedAt: nowISO(),
        activity: [act("Criou a tarefa")],
      };
      commit({ ...state, tasks: [task, ...state.tasks] });
      return task;
    },
    updateTask(id, patch, activity) {
      patchTask(id, (t) => ({ ...t, ...patch, activity: activity ? [...t.activity, act(activity)] : t.activity }));
    },
    deleteTask(id) { commit({ ...state, tasks: state.tasks.filter((t) => t.id !== id) }); },
    completeTask(id) {
      patchTask(id, (t) => ({ ...t, status: "done", completedAt: nowISO(), activity: [...t.activity, act("Concluiu")] }));
    },
    reopenTask(id) {
      patchTask(id, (t) => ({ ...t, status: "todo", completedAt: undefined, activity: [...t.activity, act("Reabriu")] }));
    },
    rescheduleTask(id, date, order) {
      patchTask(id, (t) => ({
        ...t, scheduledDate: date, scheduledOrder: order ?? 999,
        status: t.status === "inbox" && date ? "todo" : t.status,
        activity: [...t.activity, act(date ? `Planejou para ${date}` : "Removeu do planejamento")],
      }));
    },
    reorderDay(date, ids) {
      commit({ ...state, tasks: state.tasks.map((t) => (t.scheduledDate === date && ids.includes(t.id) ? { ...t, scheduledOrder: ids.indexOf(t.id) } : t)) });
    },

    createClient(input) {
      const c = { ...input, id: uid("c"), organizationId: state.session.organizationId, createdAt: nowISO() };
      commit({ ...state, clients: [c, ...state.clients] });
      return c;
    },

    saveTemplate(t) {
      const saved = { ...t, id: t.id ?? uid("pt"), organizationId: state.session.organizationId, updatedAt: nowISO() };
      const exists = state.templates.some((x) => x.id === saved.id);
      commit({ ...state, templates: exists ? state.templates.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...state.templates] });
      return saved;
    },

    startProcess({ templateId, clientId, assigneeId, startDate }) {
      const tpl = state.templates.find((t) => t.id === templateId);
      if (!tpl) throw new Error("Modelo não encontrado");
      const { organizationId, userId } = state.session;
      const exec: ProcessExecution = {
        id: uid("ex"), organizationId, templateId, templateName: tpl.name, clientId, assigneeId, startDate,
        createdAt: nowISO(),
        steps: tpl.steps.map((s) => ({ stepId: s.id, order: s.order, title: s.title, description: s.description, instructions: s.instructions, relativeDueDays: s.relativeDueDays })),
      };
      const tasks: Task[] = tpl.steps.map((s) => ({
        id: uid("t"), title: s.title, description: s.instructions ?? s.description,
        status: "todo", priority: "medium", context: "work", organizationId,
        clientId, processExecutionId: exec.id, processStepId: s.id,
        assigneeId: s.suggestedAssigneeId ?? assigneeId ?? userId,
        createdBy: userId, dueDate: addDays(startDate, s.relativeDueDays),
        createdAt: nowISO(), updatedAt: nowISO(),
        checklist: s.checklist.map((text) => ({ id: uid("k"), text, done: false })),
        comments: [], activity: [act(`Gerada pelo processo "${tpl.name}"`)],
      }));
      commit({ ...state, executions: [exec, ...state.executions], tasks: [...tasks, ...state.tasks] });
      return exec;
    },

    createIdea(text) {
      const idea: Idea = { id: uid("i"), ownerId: state.session.userId, text, createdAt: nowISO() };
      commit({ ...state, ideas: [idea, ...state.ideas] });
      return idea;
    },
    deleteIdea(id) { commit({ ...state, ideas: state.ideas.filter((i) => i.id !== id) }); },
    ideaToTask(id) {
      const idea = state.ideas.find((i) => i.id === id);
      if (!idea) throw new Error("Ideia não encontrada");
      const t = repo.createTask({ title: idea.text });
      state = { ...state, ideas: state.ideas.filter((i) => i.id !== id) };
      listeners.forEach((l) => l());
      return t;
    },

    undo() {
      const prev = history.pop();
      if (!prev) return false;
      state = prev;
      listeners.forEach((l) => l());
      return true;
    },
  };
  return repo;
}
