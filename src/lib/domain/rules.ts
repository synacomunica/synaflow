// Regras de negócio puras — independentes da fonte de dados.
import type { ISODate, ProcessExecution, Session, Task, TaskPriority, TaskStatus } from "./types";

export const todayISO = (d = new Date()): ISODate => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDays = (iso: ISODate, n: number): ISODate => {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return todayISO(new Date(y, m - 1, d + n));
};

export const parseISO = (iso: ISODate) => {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Semana começando na segunda-feira. */
export const weekDays = (anchor: ISODate): ISODate[] => {
  const d = parseISO(anchor);
  const dow = (d.getDay() + 6) % 7;
  const monday = addDays(anchor, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

/** Autorização de leitura (espelha o que a RLS fará no futuro). */
export const canView = (task: Task, s: Session): boolean => {
  if (task.context === "personal") return task.ownerId === s.userId;
  return task.organizationId === s.organizationId;
};

export const isDone = (t: Task) => t.status === "done";

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export const sortByPriority = (a: Task, b: Task) =>
  PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
  (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");

export type TaskFilter = "all" | "inbox" | "today" | "upcoming" | "in_progress" | "waiting" | "done";

export const matchesFilter = (t: Task, f: TaskFilter, today: ISODate): boolean => {
  switch (f) {
    case "all": return !isDone(t);
    case "inbox": return t.status === "inbox";
    case "today": return !isDone(t) && (t.scheduledDate === today || (!!t.dueDate && t.dueDate <= today));
    case "upcoming": return !isDone(t) && ((t.scheduledDate ?? "") > today || (t.dueDate ?? "") > today);
    case "in_progress": return t.status === "in_progress";
    case "waiting": return t.status === "waiting";
    case "done": return isDone(t);
  }
};

/** Prioridades: em andamento/urgentes primeiro, até `limit`. */
export const pickPriorities = (tasks: Task[], today: ISODate, limit = 3) =>
  tasks
    .filter((t) => !isDone(t) && t.status !== "inbox")
    .sort((a, b) => {
      const aToday = a.scheduledDate === today ? 0 : 1;
      const bToday = b.scheduledDate === today ? 0 : 1;
      return aToday - bToday || sortByPriority(a, b);
    })
    .slice(0, limit);

export const lastResumable = (tasks: Task[]) =>
  tasks
    .filter((t) => !isDone(t) && t.lastWorkedAt)
    .sort((a, b) => (b.lastWorkedAt ?? "").localeCompare(a.lastWorkedAt ?? ""))[0];

/** Progresso sempre derivado das tarefas da execução — sem contadores próprios. */
export const executionProgress = (exec: ProcessExecution, tasks: Task[]) => {
  const own = tasks.filter((t) => t.processExecutionId === exec.id);
  const done = own.filter(isDone).length;
  const total = own.length;
  const next = own
    .filter((t) => !isDone(t))
    .sort((a, b) => {
      const oa = exec.steps.find((s) => s.stepId === a.processStepId)?.order ?? 0;
      const ob = exec.steps.find((s) => s.stepId === b.processStepId)?.order ?? 0;
      return oa - ob;
    })[0];
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, next, tasks: own };
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  inbox: "Caixa de entrada",
  todo: "A fazer",
  in_progress: "Em andamento",
  waiting: "Aguardando",
  done: "Concluída",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const SERVICE_LABEL = {
  paid_traffic: "Tráfego pago",
  social_media: "Social media",
  audiovisual: "Produção audiovisual",
} as const;

export const CLIENT_STATUS_LABEL = {
  active: "Ativo",
  onboarding: "Onboarding",
  paused: "Pausado",
  ended: "Encerrado",
} as const;

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
export const formatShort = (iso?: ISODate) => (iso ? fmt.format(parseISO(iso)).replace(".", "") : "");

export const relativeDue = (iso: ISODate | undefined, today: ISODate) => {
  if (!iso) return "";
  if (iso === today) return "Hoje";
  if (iso === addDays(today, 1)) return "Amanhã";
  if (iso === addDays(today, -1)) return "Ontem";
  return formatShort(iso);
};

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};
