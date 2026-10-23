import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/layout/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 md:px-8">
      <div className="flex flex-col gap-10 md:flex-row md:gap-14">
        <AdminSidebar />
        <div className="min-w-0 flex-1"><Outlet /></div>
      </div>
    </div>
  );
}
