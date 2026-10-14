import { createFileRoute } from "@tanstack/react-router";
import { DemandsPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/demandas")({ head: () => pageMeta("Minhas demandas", "Organize, filtre e acompanhe suas demandas pessoais e profissionais."), component: DemandsPage });
