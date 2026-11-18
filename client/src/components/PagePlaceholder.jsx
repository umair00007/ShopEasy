// Temporary page body used until a feature's real phase is built.
export default function PagePlaceholder({ title, phase, note }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Coming in {phase}</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">{note}</p>
    </section>
  );
}
