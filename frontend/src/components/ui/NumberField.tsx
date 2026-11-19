import { useId, type ReactNode } from "react";

export function NumberField({ label, unit, value, onChange, error }: {
  label: ReactNode; unit: string; value: string; onChange: (value: string) => void; error?: string;
}) {
  const id = useId();
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="number-control">
      <input id={id} inputMode="decimal" value={value} onChange={(event) => onChange(event.currentTarget.value)}
        aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off" spellCheck={false} />
      <span aria-hidden="true">{unit}</span>
    </div>
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>;
}

export function parseDecimal(value: string) {
  const text = value.trim();
  return /^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(text) ? Number(text.replace(",", ".")) : NaN;
}
