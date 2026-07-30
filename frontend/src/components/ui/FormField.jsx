export default function FormField({ label, id, error, hint, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}{required && <span className="ml-1 text-archive-rose" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-red-300" role="alert">{error}</p> : hint ? <p className="mt-2 text-xs leading-5 text-archive-muted">{hint}</p> : null}
    </div>
  );
}
