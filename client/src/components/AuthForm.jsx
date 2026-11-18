// Shared card + input styling for Login and Register.
export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </section>
  );
}

export function Field({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40 ${
          error ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
