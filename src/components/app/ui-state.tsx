import { createContext, useContext, useState, type ReactNode } from "react";
import type { ID } from "@/lib/domain/types";

interface UIState {
  captureOpen: boolean;
  setCaptureOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  openTaskId: ID | null;
  openTask: (id: ID | null) => void;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openTaskId, openTask] = useState<ID | null>(null);
  return (
    <Ctx.Provider value={{ captureOpen, setCaptureOpen, searchOpen, setSearchOpen, openTaskId, openTask }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUI = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI fora do UIProvider");
  return v;
};
