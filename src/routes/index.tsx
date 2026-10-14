import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, PlayCircle } from "lucide-react";
import { useMyTasks, useLookups } from "@/hooks/use-data";
import { isDone, lastResumable, pickPriorities, todayISO } from "@/lib/domain/rules";
import { pageMeta } from "@/lib/meta";
import { PageHeader, Section } from "@/components/app/page-header";
import { TaskList } from "@/components/app/task-list";
import { DemoBadge } from "@/components/app/badges";
import { useUI } from "@/components/app/ui-state";

export const Route = createFileRoute("/")({
  head: () => pageMeta("Início", "Suas prioridades do dia, o que retomar e o que chegou na caixa de entrada."),
  component: Home,
});

function Home() {
  const tasks = useMyTasks();
  const { me } = useLookups();
  const { openTask } = useUI();
  const today = todayISO();
  const priorities = pickPriorities(tasks, today);
  const resume = lastResumable(tasks);
  const inbox = tasks.filter((t) => t.status === "inbox");
  const todayTasks = tasks.filter((t) => t.scheduledDate === today);
  const doneToday = todayTasks.filter(isDone).length;

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Fortaleza" }).format(now));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Fortaleza" }).format(now);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow={date}
        title={`${greeting}, ${me?.name.split(" ")[0] ?? ""}`}
        description={todayTasks.length ? `${doneToday} de ${todayTasks.length} tarefas de hoje concluídas.` : "Nada planejado para hoje ainda."}
        actions={<DemoBadge />} />

      {resume && (
        <button onClick={() => openTask(resume.id)} className="surface-panel flex w-full items-start gap-3 p-4 text-left hover:border-primary/40">
          <PlayCircle className="mt-0.5 size-5 text-primary" />
          <div><p className="eyebrow">Retomar de onde parou</p>
            <p className="font-medium">{resume.title}</p>
            {resume.resumeNote && <p className="text-sm text-muted-foreground">{resume.resumeNote}</p>}</div>
        </button>
      )}

      <Section title="Até 3 prioridades" action={<Link to="/foco" className="text-sm text-primary">Entrar no foco →</Link>}>
        <TaskList tasks={priorities} empty="Sem prioridades. Aproveite!" />
      </Section>

      <Section title={`Caixa de entrada (${inbox.length})`} action={<Link to="/demandas" className="text-sm text-muted-foreground">Ver todas</Link>}>
        {inbox.length ? <TaskList tasks={inbox.slice(0, 5)} compact /> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Inbox className="size-4" /> Tudo organizado.</p>}
      </Section>
    </div>
  );
}
