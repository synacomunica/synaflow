import { createFileRoute } from "@tanstack/react-router";
import { ProcessesPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/processos/")({ head: () => pageMeta("Processos e rotinas", "Inicie processos e acompanhe o progresso pelas demandas geradas."), component: ProcessesPage });
