import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./components/Canvas";
import { GeneratorPanel } from "./components/GeneratorPanel";
import { Header } from "./components/Header";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Sidebar } from "./components/Sidebar";
import { useEditor } from "./store";

type Toast = { message: string; tone: "info" | "error" } | null;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export default function App() {
  const model = useEditor((s) => s.model);
  const [toast, setToast] = useState<Toast>(null);
  const clipboard = useRef<string[]>([]);

  const notify = useCallback((message: string, tone: "info" | "error" = "info") => setToast({ message, tone }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.tone === "error" ? 8000 : 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (useEditor.getState().restoreSaved()) notify("Restored your last saved process.");
  }, [notify]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (s.model) notify(s.save() ? "Process saved in this browser." : "Could not save. Browser storage may be full or disabled.", s.model ? "info" : "error");
        return;
      }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        s.duplicateSelection();
      } else if (mod && e.key.toLowerCase() === "c" && s.selection?.kind === "node") {
        clipboard.current = s.selection.ids;
      } else if (mod && e.key.toLowerCase() === "v" && clipboard.current.length) {
        const existing = new Set(s.model?.nodes.map((n) => n.id));
        const ids = clipboard.current.filter((id) => existing.has(id));
        if (ids.length) {
          s.select({ kind: "node", ids });
          s.duplicateSelection();
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && s.selection) {
        e.preventDefault();
        s.deleteSelection();
      } else if (e.key === "Escape") {
        s.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notify]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  return (
    <ReactFlowProvider>
      <div className={`app${model ? " has-model" : ""}`}>
        <Header onNotify={notify} />
        {model ? (
          <main className="workspace">
            <Sidebar onNotify={notify} />
            <div className="canvas" role="region" aria-label="Diagram">
              <Canvas model={model} />
            </div>
            <PropertiesPanel />
          </main>
        ) : (
          <main className="landing">
            <GeneratorPanel variant="hero" onNotify={notify} />
          </main>
        )}
        {toast && (
          <div className={`toast toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
            {toast.message}
            <button type="button" className="icon" onClick={() => setToast(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}
