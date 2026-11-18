import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      Shabbir <span className="text-brand-600">Traders</span>
    </Link>
  );
}

function CartLink({ count }) {
  return (
    <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.4a1 1 0 0 1 .97.76L5.1 6m0 0 1.4 6.5a1 1 0 0 0 .98.8h8.9a1 1 0 0 0 .96-.72L18.8 6H5.1ZM9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
      {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">{count}</span>}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    ...(user ? [{ to: '/orders', label: 'My orders' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];
  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'}`;

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkClass}>{l.label}</NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CartLink count={count} />
          {user ? (
            <>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {user.name[0].toUpperCase()}
                </span>
                {user.name.split(' ')[0]}
              </span>
              <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Log in</Link>
              <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <CartLink count={count} />
        <button
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? <path d="M6 18 18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        </div>
      </nav>

      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkClass} onClick={() => setOpen(false)}>
              <span className="block">{l.label}</span>
            </NavLink>
          ))}
          {user ? (
            <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:text-slate-900">
              Log out ({user.name.split(' ')[0]})
            </button>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}><span className="block">Log in</span></NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}><span className="block">Sign up</span></NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
