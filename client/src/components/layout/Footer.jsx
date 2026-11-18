import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-base font-bold text-slate-900">Shabbir <span className="text-brand-600">Traders</span></p>
          <p className="mt-2">Sanitary &amp; Electricals. All wires, lighting and building materials supplier.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Visit us</p>
          <address className="mt-2 not-italic leading-6">
            Plot No. 26, Subash Chandra Bose Nagar, Near RTA Test Ground,
            <br />New Hafeezpet, Hyderabad
          </address>
          <p className="mt-2">Call: <a href="tel:+919505297184" className="font-medium text-brand-700 hover:underline">95052 97184</a></p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Shop</p>
          <ul className="mt-2 space-y-1">
            <li><Link to="/products" className="hover:text-brand-600">All products</Link></li>
            <li><Link to="/orders" className="hover:text-brand-600">My orders</Link></li>
            <li><Link to="/cart" className="hover:text-brand-600">Cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Shabbir Traders. All rights reserved.
      </div>
    </footer>
  );
}
