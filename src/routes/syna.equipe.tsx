import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/equipe")({ head: () => pageMeta("Equipe", "Consulte a carga de trabalho e responsabilidades da equipe."), component: TeamPage });
