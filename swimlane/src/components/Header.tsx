import { useState } from "react";
import { exportPng, renderPng } from "../lib/exportPng";
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const onSave = () => {
    if (save()) onNotify("Process saved in this browser.");
    else onNotify("Could not save. Browser storage may be full or disabled.", "error");
  };

  const onExport = async () => {
    if (!model) return;
    setExporting(true);
    try {
      // Hosted previews cannot start downloads, so show the image to save instead.
      if (import.meta.env.VITE_PREVIEW === "1") setPreviewImage(await renderPng(model));
      else await exportPng(model);
    } catch (error) {
      console.error(error);
      onNotify("PNG export failed. Try again, or zoom the canvas and retry.", "error");
    } finally {
      setExporting(false);
    }
  };

  const onNew = () => {
    const hadModel = Boolean(model);
    loadModel(null);
    if (hadModel && dirty) onNotify("Started a new process. Press Undo to return to the previous diagram.");
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
      {previewImage && (
        <div className="dialog-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="png-title" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-head">
              <h2 id="png-title">PNG export</h2>
              <button type="button" autoFocus onClick={() => setPreviewImage(null)}>Close</button>
            </div>
            <p className="muted small">Right-click the image and choose “Save image as” to keep it. The full app downloads the file directly.</p>
            <div className="dialog-body">
              <img src={previewImage} alt={`Exported diagram: ${model?.title ?? "process"}`} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
