import { useEffect, useState } from 'react';

// − [ 12 ] +  : tap the buttons, or type a number (handy for bulk orders like 40 cement bags).
// The typed value is applied when you leave the box or press Enter, and is clamped to 1..max (the stock).
export default function QuantityInput({ value, max, onChange, disabled = false, size = 'h-11 w-11', className = '' }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const clamp = (n) => Math.max(1, Math.min(Number.isFinite(n) ? Math.floor(n) : 1, max));
  const commit = () => {
    const next = clamp(Number(text));
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const btn = `${size} text-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40`;
  return (
    <div className={`flex items-center rounded-lg border border-slate-300 ${className}`}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= 1} aria-label="Decrease quantity" className={btn}>−</button>
      <input
        type="text" inputMode="numeric" value={disabled ? 0 : text} disabled={disabled} aria-label="Quantity"
        onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
        onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
        className="w-12 bg-transparent text-center text-sm font-semibold outline-none"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity" className={btn}>+</button>
    </div>
  );
}
