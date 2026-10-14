// DADOS DE DEMONSTRAÇÃO — fictícios, apenas para visualização e testes.
import { addDays, todayISO } from "../../domain/rules";
import type { DataSnapshot } from "../repository";
import type { Task } from "../../domain/types";

export function buildSeed(): DataSnapshot {
  const today = todayISO();
  const now = new Date().toISOString();
  const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  const org = "org-syna";
  const me = "u-1";

  const base = (t: Partial<Task> & { id: string; title: string }): Task => ({
    status: "todo",
    priority: "medium",
    context: "work",
    organizationId: org,
    createdBy: me,
    assigneeId: me,
    createdAt: ago(48),
    updatedAt: ago(2),
    checklist: [],
    comments: [],
    activity: [{ id: `a-${t.id}`, actorId: me, message: "Criou a tarefa", createdAt: ago(48) }],
    ...t,
  });

  const tasks: Task[] = [
    base({ id: "t-1", title: "Planejar calendário de posts de novembro", clientId: "c-1", priority: "high", status: "in_progress", dueDate: addDays(today, 2), scheduledDate: today, scheduledOrder: 0, lastWorkedAt: ago(3), resumeNote: "Faltam as datas comemorativas da segunda quinzena.", description: "Montar a grade de conteúdo com 12 posts e 4 reels.", checklist: [{ id: "k1", text: "Levantar datas", done: true }, { id: "k2", text: "Definir pilares", done: true }, { id: "k3", text: "Distribuir formatos", done: false }] }),
    base({ id: "t-2", title: "Revisar relatório de tráfego pago", clientId: "c-2", priority: "urgent", dueDate: today, scheduledDate: today, scheduledOrder: 1 }),
    base({ id: "t-3", title: "Enviar orçamento de vídeo institucional", clientId: "c-3", priority: "medium", status: "waiting", dueDate: addDays(today, 4) }),
    base({ id: "t-4", title: "Marcar consulta no dentista", context: "personal", organizationId: undefined, ownerId: me, priority: "low", scheduledDate: addDays(today, 1) }),
    base({ id: "t-5", title: "Ideia de campanha para Black Friday", status: "inbox", priority: "medium" }),
    base({ id: "t-6", title: "Pagar boleto do coworking", context: "personal", organizationId: undefined, ownerId: me, status: "inbox", priority: "high", dueDate: addDays(today, 3) }),
    base({ id: "t-7", title: "Editar reels do evento", clientId: "c-1", priority: "high", dueDate: addDays(today, 5), scheduledDate: addDays(today, 2), assigneeId: "u-2" }),
    base({ id: "t-8", title: "Atualizar proposta comercial padrão", priority: "low" }),
    base({ id: "t-9", title: "Aprovar artes da semana", clientId: "c-2", status: "done", completedAt: ago(20), priority: "medium" }),
  ];

  return {
    session: { userId: me, organizationId: org },
    users: [
      { id: me, name: "Allan Eduardo", email: "allan@syna.com.br", initials: "AE" },
      { id: "u-2", name: "Marina Costa", email: "marina@syna.com.br", initials: "MC" },
      { id: "u-3", name: "Lucas Prado", email: "lucas@syna.com.br", initials: "LP" },
    ],
    organizations: [{ id: org, name: "Syna" }],
    memberships: [
      { userId: me, organizationId: org, role: "admin" },
      { userId: "u-2", organizationId: org, role: "partner" },
      { userId: "u-3", organizationId: org, role: "collaborator" },
    ],
    tasks,
    clients: [
      { id: "c-1", organizationId: org, companyName: "Café Aurora", contactName: "Beatriz Lima", email: "bia@cafeaurora.com", phone: "(85) 99999-0001", startDate: addDays(today, -120), services: ["social_media", "audiovisual"], ownerUserId: me, status: "active", createdAt: ago(3000) },
      { id: "c-2", organizationId: org, companyName: "Clínica Vitta", contactName: "Dr. Rafael Nunes", email: "contato@vitta.com", services: ["paid_traffic", "social_media"], ownerUserId: "u-2", status: "active", startDate: addDays(today, -60), createdAt: ago(1500) },
      { id: "c-3", organizationId: org, companyName: "Studio Maré", contactName: "Paula Reis", services: ["audiovisual"], ownerUserId: me, status: "onboarding", startDate: addDays(today, -3), createdAt: ago(72) },
    ],
    projects: [
      { id: "p-1", organizationId: org, clientId: "c-1", name: "Lançamento linha de inverno", status: "active" },
      { id: "p-2", organizationId: org, clientId: "c-2", name: "Campanha captação Q4", status: "active" },
    ],
    templates: [
      {
        id: "pt-1", organizationId: org, kind: "process", name: "Onboarding de cliente", category: "Clientes",
        description: "Da assinatura do contrato à primeira entrega.", updatedAt: ago(200),
        steps: [
          { id: "s1", order: 1, title: "Reunião de kickoff", relativeDueDays: 2, suggestedAssigneeId: me, instructions: "Agendar 1h com o cliente. Apresentar equipe e cronograma.", checklist: ["Enviar convite", "Preparar pauta"] },
          { id: "s2", order: 2, title: "Coletar acessos e materiais", relativeDueDays: 4, suggestedAssigneeId: "u-2", instructions: "Solicitar acessos às redes, gerenciador de anúncios e manual de marca.", checklist: [] },
          { id: "s3", order: 3, title: "Diagnóstico das redes", relativeDueDays: 7, suggestedAssigneeId: "u-3", instructions: "Analisar últimos 90 dias de publicações.", checklist: [] },
          { id: "s4", order: 4, title: "Apresentar plano estratégico", relativeDueDays: 10, suggestedAssigneeId: me, checklist: [] },
        ],
      },
      {
        id: "pt-2", organizationId: org, kind: "process", name: "Produção de vídeo", category: "Audiovisual",
        description: "Roteiro, captação, edição e aprovação.", updatedAt: ago(500),
        steps: [
          { id: "v1", order: 1, title: "Roteiro", relativeDueDays: 3, checklist: [] },
          { id: "v2", order: 2, title: "Captação", relativeDueDays: 7, checklist: [] },
          { id: "v3", order: 3, title: "Edição", relativeDueDays: 10, checklist: [] },
          { id: "v4", order: 4, title: "Aprovação do cliente", relativeDueDays: 12, checklist: [] },
        ],
      },
      {
        id: "pt-3", organizationId: org, kind: "routine", name: "Fechamento mensal de relatórios", category: "Rotina",
        description: "Relatórios de desempenho para todos os clientes ativos.", recurrenceLabel: "Todo dia 1º", updatedAt: ago(800),
        steps: [
          { id: "r1", order: 1, title: "Exportar métricas", relativeDueDays: 1, checklist: [] },
          { id: "r2", order: 2, title: "Montar relatório", relativeDueDays: 3, checklist: [] },
          { id: "r3", order: 3, title: "Enviar aos clientes", relativeDueDays: 4, checklist: [] },
        ],
      },
    ],
    executions: [],
    ideas: [
      { id: "i-1", ownerId: me, text: "Série de vídeos 'bastidores da agência'", createdAt: ago(30) },
      { id: "i-2", ownerId: me, text: "Template de briefing em formulário", createdAt: ago(80) },
    ],
  } satisfies DataSnapshot;
  void now;
}
