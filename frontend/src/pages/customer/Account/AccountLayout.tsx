import { Outlet } from 'react-router-dom';
import AccountSidebar from '../../../components/layout/AccountSidebar';

export default function AccountLayout() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-10 md:px-8">
      <h1 className="font-display text-4xl md:text-5xl">My account</h1>
      <div className="mt-10 flex flex-col gap-10 md:flex-row md:gap-16">
        <AccountSidebar />
        <div className="min-w-0 flex-1"><Outlet /></div>
      </div>
    </div>
  );
}
