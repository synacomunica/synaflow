import { createFileRoute } from "@tanstack/react-router";
import { PlanningPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/planejamento")({ head: () => pageMeta("Planejamento", "Planeje tarefas para hoje ou para a semana sem alterar seus prazos."), component: PlanningPage });
