import { useEffect, useRef, useState } from "react";
import { GenerateError, generateProcess } from "../lib/api";
import { buildModel } from "../shared/layout";
import { useEditor } from "../store";
import { Icons } from "./Icons";

export const DEMO_PROCESS =
  "Customer sends a purchase order. Sales verifies the order and checks inventory. If inventory is available, warehouse prepares the material. Quality checks the material. If quality is approved, dispatch prepares and ships the order. If inventory is unavailable, procurement contacts suppliers and purchases the required material.";

const STAGES = ["Understanding process…", "Identifying departments…", "Building workflow…", "Creating swimlane…"];
const MAX_LENGTH = 8000;

interface Props {
  variant: "hero" | "sidebar";
  onNotify: (message: string, tone?: "info" | "error") => void;
}

export function GeneratorPanel({ variant, onNotify }: Props) {
  const model = useEditor((s) => s.model);
  const loadModel = useEditor((s) => s.loadModel);
  const [text, setText] = useState(model?.description ?? "");
  const [stage, setStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (stage === null || stage >= STAGES.length - 1) return;
    const timer = setTimeout(() => setStage((s) => (s === null ? s : s + 1)), 1800);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = async () => {
    const description = text.trim();
    if (description.length < 15) {
      setError("Describe the process in at least one full sentence.");
      return;
    }
    if (model && !window.confirm("Replace the current diagram with a newly generated one? You can undo this.")) return;
    setError(null);
    setStage(0);
    abortRef.current = new AbortController();
    try {
      const result = await generateProcess(description, abortRef.current.signal);
      loadModel(buildModel(result.process, description));
      if (result.source === "offline") {
        onNotify("Generated with the offline parser because no AI key is configured. Review the result.");
      } else if (result.warnings.length) {
        onNotify(`Generated with ${result.warnings.length} automatic correction(s). Review the diagram.`);
      }
    } catch (e) {
      setError(e instanceof GenerateError ? e.message : "Something went wrong while generating the diagram.");
    } finally {
      setStage(null);
      abortRef.current = null;
    }
  };

  const busy = stage !== null;
  const id = `process-input-${variant}`;

  return (
    <section className={`generator generator-${variant}`} aria-labelledby={`${id}-label`}>
      <h2 id={`${id}-label`}>{variant === "hero" ? "Describe your process" : "AI process generator"}</h2>
      {variant === "hero" && (
        <p className="muted">
          Write how the work flows between departments. The generator identifies departments, activities and decisions and
          builds an editable swimlane diagram.
        </p>
      )}
      <textarea
        id={id}
        value={text}
        maxLength={MAX_LENGTH}
        rows={variant === "hero" ? 8 : 6}
        disabled={busy}
        placeholder="Describe your manufacturing, purchasing, sales, logistics, HR, or other business process..."
        aria-describedby={error ? `${id}-error` : `${id}-count`}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
        }}
      />
      <div className="generator-meta">
        <span id={`${id}-count`} className="muted">
          {text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </span>
        {!busy && (
          <button type="button" className="link" onClick={() => setText(DEMO_PROCESS)}>
            Use example
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
      {busy ? (
        <div className="progress" role="status" aria-live="polite">
          <ol>
            {STAGES.map((label, i) => (
              <li key={label} className={i < stage! ? "done" : i === stage ? "active" : ""}>
                {label}
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => abortRef.current?.abort()}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="primary wide" onClick={generate}>
          <Icons.sparkle /> {model ? "Regenerate swimlane" : "Generate swimlane"}
        </button>
      )}
    </section>
  );
}
