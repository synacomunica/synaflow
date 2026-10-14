import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home, ListChecks, CalendarDays, Target, Lightbulb, Building2, Users, FolderKanban,
  Workflow, Calendar, UsersRound, Settings, User, Plus, Search, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { UIProvider, useUI } from "./ui-state";
import { QuickCapture } from "./quick-capture";
import { SearchCommand } from "./search-command";
import { TaskDetail } from "./task-detail";
import { useLookups } from "@/hooks/use-data";
import logo from "@/assets/syna-logo.png.asset.json";

const PERSONAL = [
  { to: "/", label: "Início", icon: Home },
  { to: "/demandas", label: "Minhas demandas", icon: ListChecks },
  { to: "/planejamento", label: "Planejamento", icon: CalendarDays },
  { to: "/foco", label: "Modo Foco", icon: Target },
  { to: "/ideias", label: "Ideias", icon: Lightbulb },
] as const;
const SYNA = [
  { to: "/syna", label: "Visão geral", icon: Building2 },
  { to: "/syna/clientes", label: "Clientes", icon: Users },
  { to: "/syna/demandas", label: "Demandas", icon: ListChecks },
  { to: "/syna/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/syna/processos", label: "Processos", icon: Workflow },
  { to: "/syna/calendario", label: "Calendário", icon: Calendar },
  { to: "/syna/equipe", label: "Equipe", icon: UsersRound },
] as const;

function NavItem({ to, label, icon: Icon, collapsed }: { to: string; label: string; icon: typeof Home; collapsed: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to;
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { setCaptureOpen, setSearchOpen } = useUI();
  const { me } = useLookups();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
      const typing = (e.target as HTMLElement)?.closest("input,textarea,[contenteditable]");
      if (!typing && e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setCaptureOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCaptureOpen, setSearchOpen]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/40 p-3 md:flex ${collapsed ? "w-16" : "w-60"}`}>
        <div className="mb-4 flex items-center justify-between px-2 py-1">
          {!collapsed && <img src={logo.url} alt="Syna" className="h-5 w-auto" />}
          <button onClick={() => setCollapsed((c) => !c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Recolher menu">
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {PERSONAL.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}
          {!collapsed && <p className="eyebrow mt-5 mb-1 px-3">Syna</p>}
          {collapsed && <div className="my-3 border-t border-border" />}
          {SYNA.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}
        </nav>
        <div className="flex flex-col gap-0.5 border-t border-border pt-2">
          <NavItem to="/configuracoes" label="Configurações" icon={Settings} collapsed={collapsed} />
          <NavItem to="/perfil" label={me?.name ?? "Meu perfil"} icon={User} collapsed={collapsed} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <button onClick={() => setSearchOpen(true)} className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 md:max-w-md">
            <Search className="size-4" /> Buscar…
            <kbd className="ml-auto hidden rounded border border-border px-1.5 text-xs sm:inline">⌘K</kbd>
          </button>
          <button onClick={() => setCaptureOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> <span className="hidden sm:inline">Nova demanda</span>
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 md:px-8 md:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-background/95 py-2 md:hidden">
          {PERSONAL.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 px-2 text-[10px] text-muted-foreground" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
              <Icon className="size-5" />{label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>
      <QuickCapture />
      <SearchCommand />
      <TaskDetail />
      <Toaster position="bottom-right" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <UIProvider><Shell>{children}</Shell></UIProvider>;
}
