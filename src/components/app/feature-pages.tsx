import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  CirclePause, Clock3, FolderKanban, Lightbulb, ListChecks, Mail, Pause, Play, Plus,
  RotateCcw, Search, Sparkles, Target, Trash2, UserRound, UsersRound, Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section, EmptyState } from "./page-header";
import { DemoBadge, StatusBadge } from "./badges";
import { TaskList, TaskRow } from "./task-list";
import { useLookups, useMyTasks, useRepo, useSnapshot, useVisibleTasks } from "@/hooks/use-data";
import { useUI } from "./ui-state";
import {
  addDays, CLIENT_STATUS_LABEL, executionProgress, formatShort, isDone, matchesFilter,
  SERVICE_LABEL, sortByPriority, todayISO, weekDays, type TaskFilter,
} from "@/lib/domain/rules";
import type { ClientStatus, ProcessKind, ServiceType, Task } from "@/lib/domain/types";

const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const filters: Array<[TaskFilter, string]> = [["all", "Abertas"], ["inbox", "Caixa de entrada"], ["today", "Hoje"], ["upcoming", "Próximas"], ["in_progress", "Em andamento"], ["waiting", "Aguardando"], ["done", "Concluídas"]];
const dateLabel = (iso: string) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(`${iso}T12:00:00`)).replace(".", "");

function Segments<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: Array<[T, string]> }) {
  return <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">{items.map(([id, label]) => <Button key={id} size="sm" variant={value === id ? "secondary" : "ghost"} onClick={() => onChange(id)} className="shrink-0">{label}</Button>)}</div>;
}

export function DemandsPage({ agency = false }: { agency?: boolean }) {
  const all = useVisibleTasks();
  const mine = useMyTasks();
  const s = useSnapshot();
  const { setCaptureOpen } = useUI();
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState("all");
  const source = agency ? all.filter((t) => t.context === "work") : mine;
  const tasks = source.filter((t) => matchesFilter(t, filter, todayISO())).filter((t) => clientId === "all" || t.clientId === clientId).filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).sort(sortByPriority);
  return <div>
    <PageHeader eyebrow={agency ? "Operação" : "Meu trabalho"} title={agency ? "Demandas da Syna" : "Minhas demandas"} description={`${tasks.length} item(ns) nesta visão`} actions={<><DemoBadge/><Button onClick={() => setCaptureOpen(true)}><Plus className="size-4"/>Nova demanda</Button></>} />
    <div className="mb-5 space-y-3">
      <Segments value={filter} onChange={setFilter} items={filters} />
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar demanda" className="pl-9"/></label>
        <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}><option value="all">Todos os clientes</option>{s.clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select>
      </div>
    </div>
    <Section title={agency ? "Fila da equipe" : "Sua lista"}><TaskList tasks={tasks} empty={<EmptyState icon={CheckCircle2} title="Nenhuma demanda aqui" description="Altere os filtros ou registre uma nova demanda."/>}/></Section>
  </div>;
}

export function PlanningPage() {
  const tasks = useMyTasks();
  const repo = useRepo();
  const today = todayISO();
  const [mode, setMode] = useState<"today" | "week">("today");
  const days = mode === "today" ? [today] : weekDays(today);
  const unplanned = tasks.filter((t) => !isDone(t) && !t.scheduledDate).sort(sortByPriority);
  return <div>
    <PageHeader eyebrow="Organize sem mudar prazos" title="Planejamento" description="A data planejada define quando trabalhar; o prazo de entrega permanece separado." actions={<Segments value={mode} onChange={setMode} items={[["today", "Hoje"], ["week", "Semana"]]}/>} />
    <div className={mode === "week" ? "grid gap-3 lg:grid-cols-2" : "space-y-4"}>{days.map((day) => {
      const dayTasks = tasks.filter((t) => t.scheduledDate === day && !isDone(t)).sort((a,b) => (a.scheduledOrder ?? 999) - (b.scheduledOrder ?? 999));
      return <section key={day} className="surface-panel min-h-40 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-display font-semibold capitalize">{day === today ? "Hoje" : dateLabel(day)}</h2><span className="text-xs text-muted-foreground">{dayTasks.length} tarefa(s)</span></div>{dayTasks.length ? <div className="-mx-2">{dayTasks.map((task) => <TaskRow key={task.id} task={task} compact trailing={<Button variant="ghost" size="icon" title="Remover do planejamento" onClick={(e) => { e.stopPropagation(); repo.rescheduleTask(task.id, undefined); }}><RotateCcw className="size-3"/></Button>}/>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Dia livre</p>}</section>;
    })}</div>
    <div className="mt-6"><Section title={`Não planejadas (${unplanned.length})`}>{unplanned.length ? <div className="-mx-3">{unplanned.map((task) => <TaskRow key={task.id} task={task} compact trailing={<select aria-label={`Planejar ${task.title}`} className="rounded-md border border-border bg-background px-2 py-1 text-xs" defaultValue="" onClick={(e) => e.stopPropagation()} onChange={(e) => { if (e.target.value) repo.rescheduleTask(task.id, e.target.value); }}><option value="">Planejar…</option>{weekDays(today).map((day) => <option key={day} value={day}>{day === today ? "Hoje" : dateLabel(day)}</option>)}</select>}/>)}</div> : <p className="text-sm text-muted-foreground">Tudo foi planejado.</p>}</Section></div>
  </div>;
}

export function FocusPage() {
  const tasks = useMyTasks();
  const repo = useRepo();
  const { openTask } = useUI();
  const candidates = tasks.filter((t) => !isDone(t) && t.status !== "inbox").sort(sortByPriority);
  const [selected, setSelected] = useState(candidates[0]?.id ?? "");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const task = tasks.find((t) => t.id === selected) ?? candidates[0];
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds((v) => v + 1), 1000); return () => window.clearInterval(timer); }, [running]);
  if (!task) return <div><PageHeader title="Modo Foco"/><EmptyState icon={Target} title="Nada para focar" description="Planeje ou crie uma tarefa para começar."/></div>;
  const pause = () => { setRunning(false); repo.updateTask(task.id, { status: "in_progress", resumeNote: note.trim() || task.resumeNote, lastWorkedAt: new Date().toISOString() }, "Pausou uma sessão de foco"); toast.success("Progresso salvo"); };
  return <div className="mx-auto max-w-2xl">
    <PageHeader eyebrow="Uma coisa por vez" title="Modo Foco" description="Reduza distrações e registre exatamente onde parou." actions={<DemoBadge/>}/>
    <section className="surface-panel p-6 sm:p-8">
      <select className={inputClass} value={task.id} onChange={(e) => { setSelected(e.target.value); setSeconds(0); setRunning(false); }}>{candidates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
      <div className="py-10 text-center"><p className="mb-3 text-sm text-muted-foreground">Tempo nesta sessão</p><p className="font-display text-6xl font-bold tabular-nums">{String(Math.floor(seconds / 60)).padStart(2,"0")}:{String(seconds % 60).padStart(2,"0")}</p><h2 className="mt-8 text-xl font-semibold">{task.title}</h2></div>
      {task.checklist.length > 0 && <div className="mb-6 space-y-2">{task.checklist.map((item) => <label key={item.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={item.done} onChange={() => repo.updateTask(task.id, { checklist: task.checklist.map((x) => x.id === item.id ? { ...x, done: !x.done } : x) })}/><span className={item.done ? "text-muted-foreground line-through" : ""}>{item.text}</span></label>)}</div>}
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Onde parei? Registre uma frase antes de pausar." />
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Button size="lg" onClick={() => { setRunning((v) => !v); if (task.status !== "in_progress") repo.updateTask(task.id, { status: "in_progress" }); }}>{running ? <Pause/> : <Play/>}{running ? "Pausar relógio" : "Começar"}</Button><Button size="lg" variant="outline" onClick={pause}><CirclePause/>Salvar pausa</Button><Button size="lg" variant="outline" onClick={() => { repo.completeTask(task.id); setRunning(false); toast.success("Tarefa concluída"); }}><CheckCircle2/>Concluir</Button><Button size="lg" variant="ghost" onClick={() => openTask(task.id)}>Ver detalhes</Button></div>
    </section>
  </div>;
}

export function IdeasPage() {
  const s = useSnapshot(); const repo = useRepo(); const [text, setText] = useState("");
  const save = () => { if (!text.trim()) return; repo.createIdea(text.trim()); setText(""); toast.success("Ideia registrada"); };
  return <div><PageHeader eyebrow="Caixa de criação" title="Ideias" description="Capture primeiro; organize quando estiver pronto." actions={<DemoBadge/>}/>
    <section className="surface-panel mb-6 p-4"><div className="flex gap-2"><Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Escreva uma ideia rápida…"/><Button onClick={save} disabled={!text.trim()}><Plus/>Adicionar</Button></div></section>
    <div className="grid gap-3 sm:grid-cols-2">{s.ideas.map((idea) => <article key={idea.id} className="surface-panel flex min-h-32 flex-col justify-between p-4"><p>{idea.text}</p><div className="mt-6 flex items-center justify-between"><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR").format(new Date(idea.createdAt))}</span><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { repo.ideaToTask(idea.id); toast.success("Transformada em demanda"); }}><ArrowRight/>Virar demanda</Button><Button size="icon" variant="ghost" title="Excluir ideia" onClick={() => repo.deleteIdea(idea.id)}><Trash2/></Button></div></div></article>)}</div>
  </div>;
}

export function AgencyOverviewPage() {
  const s = useSnapshot(); const work = s.tasks.filter((t) => t.context === "work"); const today = todayISO();
  const open = work.filter((t) => !isDone(t)); const overdue = open.filter((t) => t.dueDate && t.dueDate < today); const done = work.filter(isDone);
  const memberLoad = s.users.map((u) => ({ user: u, total: open.filter((t) => t.assigneeId === u.id).length }));
  const metrics = [{ label: "Demandas abertas", value: open.length, icon: ListChecks }, { label: "Vencidas", value: overdue.length, icon: Clock3 }, { label: "Concluídas", value: done.length, icon: CheckCircle2 }, { label: "Clientes ativos", value: s.clients.filter((c) => c.status === "active").length, icon: BriefcaseBusiness }];
  return <div><PageHeader eyebrow="Syna Comunicação" title="Visão geral" description="Pulso da operação e distribuição do trabalho." actions={<DemoBadge/>}/>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="surface-panel p-4"><Icon className="mb-5 size-5 text-primary"/><p className="font-display text-3xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><Section title="Saúde da operação"><div className="space-y-4"><div><div className="mb-1 flex justify-between text-sm"><span>Conclusão geral</span><span>{work.length ? Math.round(done.length / work.length * 100) : 0}%</span></div><Progress value={work.length ? done.length / work.length * 100 : 0}/></div><div className="flex justify-between border-t border-border pt-3 text-sm"><span className="text-muted-foreground">Prazos vencidos</span><span className={overdue.length ? "text-destructive" : "text-success"}>{overdue.length}</span></div></div></Section><Section title="Carga da equipe"><div className="space-y-3">{memberLoad.map(({user,total}) => <div key={user.id} className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-surface-2 text-xs">{user.initials}</span><span className="flex-1 text-sm">{user.name}</span><span className="text-sm text-muted-foreground">{total} abertas</span></div>)}</div></Section></div>
    <div className="mt-6"><Section title="Próximas entregas" action={<Link to="/syna/demandas" className="text-sm text-primary">Ver demandas</Link>}><TaskList tasks={open.filter((t) => t.dueDate).sort(sortByPriority).slice(0,5)}/></Section></div>
  </div>;
}

export function ClientsPage() {
  const s = useSnapshot(); const repo = useRepo(); const [open,setOpen] = useState(false); const [name,setName] = useState(""); const [contact,setContact] = useState("");
  const create = () => { if (!name.trim()) return; repo.createClient({ companyName: name.trim(), contactName: contact.trim() || undefined, services: [], status: "onboarding" }); setName(""); setContact(""); setOpen(false); toast.success("Cliente criado"); };
  return <div><PageHeader eyebrow="Relacionamentos" title="Clientes" description={`${s.clients.length} clientes cadastrados`} actions={<><DemoBadge/><Button onClick={() => setOpen(true)}><Plus/>Novo cliente</Button></>}/>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{s.clients.map((client) => { const pending = s.tasks.filter((t) => t.clientId === client.id && !isDone(t)).length; return <Link key={client.id} to="/syna/clientes/$id" params={{id:client.id}} className="surface-panel p-5 transition-colors hover:border-primary/50"><div className="mb-5 flex items-start justify-between"><span className="grid size-10 place-items-center rounded-lg bg-surface-2 font-semibold">{client.companyName.slice(0,2).toUpperCase()}</span><span className="text-xs text-muted-foreground">{CLIENT_STATUS_LABEL[client.status]}</span></div><h2 className="font-display text-lg font-semibold">{client.companyName}</h2><p className="mt-1 text-sm text-muted-foreground">{client.services.map((x) => SERVICE_LABEL[x]).join(" · ") || "Serviços a definir"}</p><div className="mt-5 flex justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>{pending} demandas abertas</span><ArrowRight className="size-4"/></div></Link>; })}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da empresa"/><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Pessoa de contato"/><Button onClick={create} disabled={!name.trim()}>Criar cliente</Button></DialogContent></Dialog>
  </div>;
}

export function ClientDetailPage({ id }: { id: string }) {
  const s = useSnapshot(); const { user } = useLookups(); const client = s.clients.find((c) => c.id === id); const [tab,setTab] = useState<"overview"|"demands"|"projects"|"processes"|"history">("overview");
  if (!client) return <EmptyState icon={UserRound} title="Cliente não encontrado"/>;
  const tasks = s.tasks.filter((t) => t.clientId === id); const projects = s.projects.filter((p) => p.clientId === id); const executions = s.executions.filter((e) => e.clientId === id);
  return <div><PageHeader eyebrow="Cliente" title={client.companyName} description={`${CLIENT_STATUS_LABEL[client.status]} · Responsável: ${user(client.ownerUserId)?.name ?? "Não definido"}`} actions={<Link to="/syna/clientes" className="text-sm text-muted-foreground">← Voltar</Link>}/><Segments value={tab} onChange={setTab} items={[["overview","Visão geral"],["demands","Demandas"],["projects","Projetos"],["processes","Processos"],["history","Histórico"]]}/><div className="mt-6">{tab === "overview" && <div className="grid gap-6 lg:grid-cols-2"><Section title="Contato"><div className="space-y-2 text-sm"><p>{client.contactName ?? "Sem contato principal"}</p><p className="text-muted-foreground">{client.email ?? "E-mail não cadastrado"}</p><p className="text-muted-foreground">{client.phone ?? "Telefone não cadastrado"}</p></div></Section><Section title="Serviços"><div className="flex flex-wrap gap-2">{client.services.length ? client.services.map((x) => <span key={x} className="rounded-md border border-border px-2 py-1 text-sm">{SERVICE_LABEL[x]}</span>) : <p className="text-sm text-muted-foreground">Nenhum serviço definido.</p>}</div></Section></div>}{tab === "demands" && <Section title={`${tasks.length} demandas`}><TaskList tasks={tasks}/></Section>}{tab === "projects" && <Section title="Projetos">{projects.map((p) => <p key={p.id} className="border-b border-border py-3 text-sm">{p.name}</p>)}</Section>}{tab === "processes" && <Section title="Execuções">{executions.length ? executions.map((e) => <Link key={e.id} to="/syna/processos/$id" params={{id:e.id}} className="flex justify-between border-b border-border py-3 text-sm"><span>{e.templateName}</span><span>{executionProgress(e,s.tasks).percent}%</span></Link>) : <p className="text-sm text-muted-foreground">Nenhum processo iniciado.</p>}</Section>}{tab === "history" && <Section title="Atividade recente"><div className="space-y-2 text-sm text-muted-foreground">{tasks.flatMap((t) => t.activity.map((a) => ({...a,title:t.title}))).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,10).map((a) => <p key={a.id}><span className="text-foreground">{a.title}</span> — {a.message}</p>)}</div></Section>}</div></div>;
}

export function ProjectsPage() {
 const s=useSnapshot(); const {client}=useLookups();
 return <div><PageHeader eyebrow="Entregas maiores" title="Projetos" description="Acompanhe frentes de trabalho sem duplicar as demandas." actions={<DemoBadge/>}/><div className="grid gap-4 md:grid-cols-2">{s.projects.map((project)=>{const tasks=s.tasks.filter((t)=>t.projectId===project.id);const done=tasks.filter(isDone).length;return <article key={project.id} className="surface-panel p-5"><div className="mb-5 flex items-start justify-between"><FolderKanban className="size-5 text-primary"/><span className="text-xs text-muted-foreground capitalize">{project.status}</span></div><h2 className="font-display text-lg font-semibold">{project.name}</h2><p className="text-sm text-muted-foreground">{client(project.clientId)?.companyName ?? "Projeto interno"}</p><div className="mt-5"><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progresso</span><span>{done}/{tasks.length}</span></div><Progress value={tasks.length ? done/tasks.length*100 : 0}/></div></article>})}</div></div>;
}

export function ProcessesPage() {
 const s=useSnapshot(); const repo=useRepo(); const [kind,setKind]=useState<ProcessKind>("process"); const [startId,setStartId]=useState<string|null>(null); const [clientId,setClientId]=useState("");
 const templates=s.templates.filter((t)=>t.kind===kind); const start=()=>{if(!startId)return;const exec=repo.startProcess({templateId:startId,...(clientId ? { clientId } : {}),startDate:todayISO()});setStartId(null);setClientId("");toast.success(`Processo iniciado com ${executionProgress(exec,repo.getSnapshot().tasks).total} tarefas`)};
 return <div><PageHeader eyebrow="Operação padronizada" title="Processos e rotinas" description="Cada início gera tarefas reais para os responsáveis; o progresso vem dessas tarefas." actions={<DemoBadge/>}/><Segments value={kind} onChange={setKind} items={[["process","Processos"],["routine","Rotinas"]]}/><div className="mt-6 grid gap-4 md:grid-cols-2">{templates.map((tpl)=><article key={tpl.id} className="surface-panel p-5"><div className="mb-4 flex justify-between"><Workflow className="size-5 text-primary"/><span className="text-xs text-muted-foreground">{tpl.steps.length} etapas</span></div><h2 className="font-display text-lg font-semibold">{tpl.name}</h2><p className="mt-1 min-h-10 text-sm text-muted-foreground">{tpl.description}</p>{tpl.recurrenceLabel&&<p className="mt-3 text-xs text-info">{tpl.recurrenceLabel}</p>}<div className="mt-5 flex items-center justify-between"><span className="text-xs text-muted-foreground">{tpl.category}</span><Button size="sm" onClick={()=>setStartId(tpl.id)}><Play/>Iniciar</Button></div></article>)}</div>{s.executions.length>0&&<div className="mt-8"><Section title="Em execução">{s.executions.map((exec)=>{const p=executionProgress(exec,s.tasks);return <Link key={exec.id} to="/syna/processos/$id" params={{id:exec.id}} className="block border-b border-border py-3"><div className="mb-2 flex justify-between text-sm"><span>{exec.templateName}</span><span>{p.percent}%</span></div><Progress value={p.percent}/></Link>})}</Section></div>}<Dialog open={!!startId} onOpenChange={(o)=>!o&&setStartId(null)}><DialogContent><DialogHeader><DialogTitle>Iniciar processo</DialogTitle></DialogHeader><select className={inputClass} value={clientId} onChange={(e)=>setClientId(e.target.value)}><option value="">Sem cliente</option>{s.clients.map((c)=><option key={c.id} value={c.id}>{c.companyName}</option>)}</select><p className="text-sm text-muted-foreground">As etapas serão criadas como demandas e aparecerão na fila dos responsáveis.</p><Button onClick={start}>Criar execução e tarefas</Button></DialogContent></Dialog></div>;
}

export function ProcessDetailPage({id}:{id:string}) { const s=useSnapshot(); const exec=s.executions.find((e)=>e.id===id); if(!exec)return <EmptyState icon={Workflow} title="Execução não encontrada"/>; const p=executionProgress(exec,s.tasks); return <div><PageHeader eyebrow="Execução de processo" title={exec.templateName} description={`Iniciado em ${formatShort(exec.startDate)}`} actions={<Link to="/syna/processos" className="text-sm text-muted-foreground">← Voltar</Link>}/><section className="surface-panel p-5"><div className="mb-2 flex justify-between text-sm"><span>Progresso</span><strong>{p.percent}%</strong></div><Progress value={p.percent}/><div className="mt-6 space-y-2">{exec.steps.sort((a,b)=>a.order-b.order).map((step)=>{const task=p.tasks.find((t)=>t.processStepId===step.stepId);return <div key={step.stepId} className="flex items-center gap-3 rounded-lg border border-border p-3"><span className="grid size-7 place-items-center rounded-full bg-surface-2 text-xs">{step.order}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{step.title}</p><p className="text-xs text-muted-foreground">Prazo relativo: {step.relativeDueDays} dia(s)</p></div>{task&&<StatusBadge status={task.status}/>}</div>})}</div></section></div> }

export function CalendarPage() { const tasks=useVisibleTasks(); const [anchor,setAnchor]=useState(todayISO()); const days=weekDays(anchor); return <div><PageHeader eyebrow="Agenda de entregas" title="Calendário" description="Planejamento e prazos reunidos por dia." actions={<div className="flex gap-1"><Button variant="outline" size="icon" onClick={()=>setAnchor(addDays(anchor,-7))}><ChevronLeft/></Button><Button variant="outline" onClick={()=>setAnchor(todayISO())}>Hoje</Button><Button variant="outline" size="icon" onClick={()=>setAnchor(addDays(anchor,7))}><ChevronRight/></Button></div>}/><div className="grid gap-3 lg:grid-cols-7">{days.map((day)=>{const items=tasks.filter((t)=>!isDone(t)&&(t.scheduledDate===day||t.dueDate===day));return <section key={day} className="surface-panel min-h-40 p-3"><h2 className={`mb-3 text-sm font-semibold capitalize ${day===todayISO()?"text-primary":""}`}>{dateLabel(day)}</h2><div className="space-y-2">{items.map((t)=><div key={t.id} className="rounded-md bg-surface-2 p-2 text-xs"><p>{t.title}</p><p className="mt-1 text-muted-foreground">{t.dueDate===day?"Prazo":"Planejada"}</p></div>)}</div></section>})}</div></div> }

export function TeamPage() { const s=useSnapshot(); return <div><PageHeader eyebrow="Pessoas" title="Equipe" description="Carga atual e responsabilidades de cada membro." actions={<DemoBadge/>}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{s.users.map((u)=>{const tasks=s.tasks.filter((t)=>t.assigneeId===u.id&&!isDone(t));const due=tasks.filter((t)=>t.dueDate&&t.dueDate<todayISO()).length;const role=s.memberships.find((m)=>m.userId===u.id)?.role;return <article key={u.id} className="surface-panel p-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-surface-2 font-semibold">{u.initials}</span><div><h2 className="font-semibold">{u.name}</h2><p className="text-xs text-muted-foreground capitalize">{role}</p></div></div><div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center"><div><p className="font-display text-2xl font-bold">{tasks.length}</p><p className="text-xs text-muted-foreground">abertas</p></div><div><p className={due?"font-display text-2xl font-bold text-destructive":"font-display text-2xl font-bold"}>{due}</p><p className="text-xs text-muted-foreground">vencidas</p></div></div></article>})}</div></div> }

export function SettingsPage() { const [desktop,setDesktop]=useState(true);const [summary,setSummary]=useState(false);const [weekStart,setWeekStart]=useState("monday"); const save=()=>toast.success("Preferências salvas nesta demonstração"); return <div><PageHeader eyebrow="Preferências" title="Configurações" description="Ajuste como a Syna organiza seu trabalho."/><div className="grid gap-6 lg:grid-cols-2"><Section title="Notificações"><div className="space-y-5"><label className="flex items-center justify-between gap-4 text-sm"><span><strong className="block">Alertas de prazo</strong><span className="text-muted-foreground">Avisos no navegador sobre entregas próximas.</span></span><Switch checked={desktop} onCheckedChange={setDesktop}/></label><label className="flex items-center justify-between gap-4 text-sm"><span><strong className="block">Resumo semanal</strong><span className="text-muted-foreground">Um resumo da operação toda segunda-feira.</span></span><Switch checked={summary} onCheckedChange={setSummary}/></label></div></Section><Section title="Planejamento"><label className="space-y-2 text-sm"><span>Início da semana</span><select className={inputClass} value={weekStart} onChange={(e)=>setWeekStart(e.target.value)}><option value="monday">Segunda-feira</option><option value="sunday">Domingo</option></select></label></Section></div><Button className="mt-6" onClick={save}>Salvar preferências</Button></div> }

export function ProfilePage() { const {me}=useLookups();const [name,setName]=useState(me?.name??"");const [email,setEmail]=useState(me?.email??""); return <div><PageHeader eyebrow="Conta" title="Meu perfil" description="Suas informações pessoais na plataforma."/><section className="surface-panel max-w-2xl p-6"><div className="mb-6 flex items-center gap-4"><span className="grid size-16 place-items-center rounded-full bg-surface-2 font-display text-xl font-bold">{me?.initials}</span><div><h2 className="font-semibold">{name}</h2><p className="text-sm text-muted-foreground">Administrador da Syna</p></div></div><div className="space-y-4"><label className="block space-y-1 text-sm"><span>Nome</span><Input value={name} onChange={(e)=>setName(e.target.value)}/></label><label className="block space-y-1 text-sm"><span>E-mail</span><Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}/></label><Button onClick={()=>toast.success("Perfil atualizado nesta demonstração")}>Salvar perfil</Button></div></section></div> }
