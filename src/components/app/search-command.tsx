import { useNavigate } from "@tanstack/react-router";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useUI } from "./ui-state";
import { useSnapshot, useVisibleTasks } from "@/hooks/use-data";

export function SearchCommand() {
  const { searchOpen, setSearchOpen, openTask } = useUI();
  const tasks = useVisibleTasks();
  const { clients } = useSnapshot();
  const navigate = useNavigate();
  const close = () => setSearchOpen(false);

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder="Buscar demandas, clientes…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Demandas">
          {tasks.slice(0, 50).map((t) => (
            <CommandItem key={t.id} value={`${t.title} ${t.id}`} onSelect={() => { close(); openTask(t.id); }}>{t.title}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Clientes">
          {clients.map((c) => (
            <CommandItem key={c.id} value={`${c.companyName} ${c.id}`} onSelect={() => { close(); navigate({ to: "/syna/clientes" }); }}>{c.companyName}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
