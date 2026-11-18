import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/products', label: 'Products', icon: '🏷️' },
];

// Sidebar on desktop, a horizontal tab bar on phones. The page content renders in <Outlet />.
export default function AdminLayout() {
  const cls = ({ isActive }) =>
    `flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pt-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="lg:sticky lg:top-24">
          <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">Admin</p>
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-2 lg:flex-col lg:border-0 lg:pb-0" aria-label="Admin">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={cls}><span aria-hidden="true">{l.icon}</span>{l.label}</NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1"><Outlet /></div>
    </div>
  );
}
