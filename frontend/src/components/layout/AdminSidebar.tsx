import { NavLink } from 'react-router-dom';

const link = ({ isActive }: { isActive: boolean }) =>
  `block whitespace-nowrap py-2 text-sm transition-colors ${isActive ? 'text-accent' : 'text-ink hover:text-accent'}`;

export default function AdminSidebar() {
  return (
    <nav aria-label="Admin" className="flex gap-6 overflow-x-auto md:block md:w-44 md:shrink-0 md:space-y-1">
      <NavLink to="/admin" end className={link}>Overview</NavLink>
      <NavLink to="/admin/orders" className={link}>Orders and payments</NavLink>
      <NavLink to="/admin/products" className={link}>Products</NavLink>
      <NavLink to="/admin/customers" className={link}>Customers</NavLink>
      <NavLink to="/admin/inquiries" className={link}>Inquiries</NavLink>
    </nav>
  );
}
