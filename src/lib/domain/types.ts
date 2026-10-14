// Tipos de domínio — preparados para multiusuário/multiambiente (Supabase + RLS no futuro).

export type ID = string;
export type ISODate = string; // "2026-10-14"
export type ISODateTime = string;

export type Role = "admin" | "partner" | "collaborator";

export interface User {
  id: ID;
  name: string;
  email: string;
  initials: string;
}

export interface Organization {
  id: ID;
  name: string;
}

export interface Membership {
  userId: ID;
  organizationId: ID;
  role: Role;
}

export type TaskStatus = "inbox" | "todo" | "in_progress" | "waiting" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
/** personal = privado ao dono (ownerId); work = pertence à organização. */
export type TaskContext = "personal" | "work";

export interface ChecklistItem {
  id: ID;
  text: string;
  done: boolean;
}

export interface TaskComment {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: ISODateTime;
}

export interface TaskActivity {
  id: ID;
  actorId: ID;
  message: string;
  createdAt: ISODateTime;
}

/** Entidade única de tarefa. Aparece em diferentes visões via relacionamentos. */
export interface Task {
  id: ID;
  title: string;
  description?: string | undefined;
  status: TaskStatus;
  priority: TaskPriority;
  context: TaskContext;
  /** Obrigatório quando context = personal. Dados pessoais nunca são compartilhados. */
  ownerId?: ID | undefined;
  /** Obrigatório quando context = work. */
  organizationId?: ID | undefined;
  clientId?: ID | undefined;
  projectId?: ID | undefined;
  processExecutionId?: ID | undefined;
  processStepId?: ID | undefined;
  parentTaskId?: ID | undefined;
  assigneeId?: ID | undefined;
  createdBy: ID;
  /** Prazo de entrega. */
  dueDate?: ISODate | undefined;
  /** Data planejada de execução. Independente do prazo. */
  scheduledDate?: ISODate | undefined;
  /** Ordem dentro do dia planejado. */
  scheduledOrder?: number | undefined;
  completedAt?: ISODateTime | undefined;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  checklist: ChecklistItem[];
  comments: TaskComment[];
  activity: TaskActivity[];
  /** Nota "Onde parei?" registrada ao pausar o foco. */
  resumeNote?: string | undefined;
  lastWorkedAt?: ISODateTime | undefined;
}

export type ServiceType = "paid_traffic" | "social_media" | "audiovisual";
export type ClientStatus = "active" | "onboarding" | "paused" | "ended";

export interface Client {
  id: ID;
  organizationId: ID;
  companyName: string;
  contactName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  startDate?: ISODate | undefined;
  services: ServiceType[];
  ownerUserId?: ID | undefined;
  status: ClientStatus;
  notes?: string | undefined;
  createdAt: ISODateTime;
}

export interface Project {
  id: ID;
  organizationId: ID;
  clientId?: ID | undefined;
  name: string;
  status: "active" | "done" | "paused";
}

export interface ProcessTemplateStep {
  id: ID;
  order: number;
  title: string;
  description?: string | undefined;
  suggestedRole?: Role | undefined;
  suggestedAssigneeId?: ID | undefined;
  /** Dias após o início da execução. */
  relativeDueDays: number;
  instructions?: string | undefined;
  checklist: string[];
}

export type ProcessKind = "process" | "routine";

export interface ProcessTemplate {
  id: ID;
  organizationId: ID;
  kind: ProcessKind;
  name: string;
  description?: string | undefined;
  category: string;
  steps: ProcessTemplateStep[];
  /** Apenas visual nesta versão — sem recorrência automática. */
  recurrenceLabel?: string | undefined;
  updatedAt: ISODateTime;
}

/** Cópia das definições da etapa no momento da execução. */
export interface ExecutionStepSnapshot {
  stepId: ID;
  order: number;
  title: string;
  description?: string | undefined;
  instructions?: string | undefined;
  relativeDueDays: number;
}

export interface ProcessExecution {
  id: ID;
  organizationId: ID;
  templateId: ID;
  templateName: string;
  clientId?: ID | undefined;
  assigneeId?: ID | undefined;
  startDate: ISODate;
  steps: ExecutionStepSnapshot[];
  cancelled?: boolean | undefined;
  createdAt: ISODateTime;
}

export interface Idea {
  id: ID;
  ownerId: ID;
  text: string;
  createdAt: ISODateTime;
}

export interface Session {
  userId: ID;
  organizationId: ID;
}
