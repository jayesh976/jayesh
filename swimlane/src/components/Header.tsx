import { useState } from "react";
import { exportPng } from "../lib/exportPng";
import { useEditor } from "../store";
import { useFitDiagram } from "./Canvas";
import { Icons } from "./Icons";

interface Props {
  onNotify: (message: string, tone?: "info" | "error") => void;
}

export function Header({ onNotify }: Props) {
  const model = useEditor((s) => s.model);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const dirty = useEditor((s) => s.dirty);
  const { undo, redo, save, autoLayout, loadModel, commit } = useEditor.getState();
  const fitDiagram = useFitDiagram();
  const [exporting, setExporting] = useState(false);

  const onSave = () => {
    if (save()) onNotify("Process saved in this browser.");
    else onNotify("Could not save. Browser storage may be full or disabled.", "error");
  };

  const onExport = async () => {
    if (!model) return;
    setExporting(true);
    try {
      await exportPng(model);
    } catch (error) {
      console.error(error);
      onNotify("PNG export failed. Try again, or zoom the canvas and retry.", "error");
    } finally {
      setExporting(false);
    }
  };

  const onNew = () => {
    if (model && dirty && !window.confirm("Start a new process? Unsaved changes can still be undone with Undo.")) return;
    loadModel(null);
  };

  return (
    <header className="app-header">
      <div className="brand">
        <Icons.logo />
        <span>Swimlane Studio</span>
      </div>
      {model && (
        <input
          className="title-input"
          aria-label="Process title"
          defaultValue={model.title}
          key={model.title}
          onBlur={(e) => {
            const title = e.target.value.trim();
            if (title && title !== model.title) commit((m) => ({ ...m, title }));
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      )}
      <nav className="toolbar" aria-label="Diagram actions">
        <button type="button" onClick={onNew} title="New process">
          <Icons.file /> <span className="label">New</span>
        </button>
        <button type="button" onClick={onSave} disabled={!model} title="Save (Ctrl+S)">
          <Icons.save /> <span className="label">{dirty ? "Save" : "Saved"}</span>
        </button>
        <span className="divider" aria-hidden />
        <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
          <Icons.undo />
        </button>
        <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
          <Icons.redo />
        </button>
        <span className="divider" aria-hidden />
        <button type="button" onClick={() => { autoLayout(); setTimeout(() => fitDiagram(), 0); }} disabled={!model} title="Auto layout">
          <Icons.layout /> <span className="label">Auto layout</span>
        </button>
        <button type="button" onClick={() => fitDiagram()} disabled={!model} title="Fit diagram to screen" aria-label="Fit to screen">
          <Icons.fit />
        </button>
        <button type="button" className="primary" onClick={onExport} disabled={!model || exporting} title="Export as PNG">
          <Icons.download /> <span className="label">{exporting ? "Exporting…" : "Export PNG"}</span>
        </button>
      </nav>
    </header>
  );
}
