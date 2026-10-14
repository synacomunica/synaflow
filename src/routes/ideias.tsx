import { createFileRoute } from "@tanstack/react-router";
import { IdeasPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/ideias")({ head: () => pageMeta("Ideias", "Capture ideias rapidamente e transforme-as em demandas."), component: IdeasPage });
