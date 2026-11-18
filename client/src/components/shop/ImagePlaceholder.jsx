import { CATEGORY_ICONS } from '../../utils/format.js';

// Shown when a product has no photo yet. Fills its parent box.
export default function ImagePlaceholder({ category, className = '' }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 ${className}`} aria-hidden="true">
      <span className="text-5xl">{CATEGORY_ICONS[category] || '🛠️'}</span>
    </div>
  );
}
