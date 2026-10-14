import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUI } from "./ui-state";
import { useRepo } from "@/hooks/use-data";

/** Captura rápida: só o título é obrigatório. Enter salva. */
export function QuickCapture() {
  const { captureOpen, setCaptureOpen } = useUI();
  const repo = useRepo();
  const [title, setTitle] = useState("");
  const [work, setWork] = useState(false);

  const save = () => {
    const t = title.trim();
    if (!t) return;
    const s = repo.getSnapshot().session;
    repo.createTask(
      work
        ? { title: t, context: "work", organizationId: s.organizationId, assigneeId: s.userId, status: "inbox" }
        : { title: t, context: "personal", ownerId: s.userId, assigneeId: s.userId, status: "inbox" },
    );
    toast.success("Capturada na caixa de entrada");
    setTitle("");
    setCaptureOpen(false);
  };

  return (
    <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
      <DialogContent className="gap-4 sm:max-w-lg">
        <DialogTitle className="text-base">O que precisa ser feito?</DialogTitle>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Ex.: Enviar proposta para cliente"
          className="w-full rounded-lg border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
            {[["Pessoal", false], ["Syna", true]].map(([l, v]) => (
              <button key={String(l)} onClick={() => setWork(v as boolean)} className={`rounded-md px-3 py-1 ${work === v ? "bg-background text-foreground" : "text-muted-foreground"}`}>{l as string}</button>
            ))}
          </div>
          <button onClick={save} disabled={!title.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">Salvar ↵</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
