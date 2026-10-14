// Contrato da camada de dados. As páginas dependem apenas deste contrato,
// nunca da implementação simulada. Uma implementação Supabase substituirá a mock.
import type {
  Client, ID, Idea, ISODate, Membership, Organization, ProcessExecution,
  ProcessTemplate, Project, Session, Task, User,
} from "../domain/types";

export interface DataSnapshot {
  session: Session;
  users: User[];
  organizations: Organization[];
  memberships: Membership[];
  tasks: Task[];
  clients: Client[];
  projects: Project[];
  templates: ProcessTemplate[];
  executions: ProcessExecution[];
  ideas: Idea[];
}

export type NewTaskInput = Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">> & { title: string };

export interface Repository {
  getSnapshot(): DataSnapshot;
  subscribe(listener: () => void): () => void;

  createTask(input: NewTaskInput): Task;
  updateTask(id: ID, patch: Partial<Task>, activity?: string): void;
  deleteTask(id: ID): void;
  completeTask(id: ID): void;
  reopenTask(id: ID): void;
  /** Altera apenas scheduledDate — nunca o prazo. */
  rescheduleTask(id: ID, date: ISODate | undefined, order?: number): void;
  reorderDay(date: ISODate, orderedIds: ID[]): void;

  createClient(input: Omit<Client, "id" | "createdAt" | "organizationId">): Client;

  saveTemplate(t: Omit<ProcessTemplate, "id" | "updatedAt" | "organizationId"> & { id?: ID }): ProcessTemplate;
  startProcess(args: { templateId: ID; clientId?: ID; assigneeId?: ID; startDate: ISODate }): ProcessExecution;

  createIdea(text: string): Idea;
  deleteIdea(id: ID): void;
  ideaToTask(id: ID): Task;

  /** Desfaz a última mutação (pilha curta em memória). */
  undo(): boolean;
}
