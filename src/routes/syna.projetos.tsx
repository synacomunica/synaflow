import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/projetos")({ head: () => pageMeta("Projetos", "Acompanhe projetos, clientes e progresso das entregas."), component: ProjectsPage });
