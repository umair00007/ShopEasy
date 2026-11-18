export default function Rating({ value = 0, count, className = '' }) {
  return (
    <div className={`flex items-center gap-1 text-sm ${className}`} aria-label={`Rated ${value} out of 5`}>
      <span className="text-amber-500">★</span>
      <span className="font-medium text-slate-700">{value ? value.toFixed(1) : 'New'}</span>
      {count > 0 && <span className="text-slate-400">({count})</span>}
    </div>
  );
}
