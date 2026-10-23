import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Home from '../pages/customer/Home';
import ProductDetail from '../pages/customer/ProductDetail';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import OrderPlaced from '../pages/customer/OrderPlaced';
import Help from '../pages/customer/Help';
import Login from '../pages/customer/Login';
import Register from '../pages/customer/Register';
import ForgotPassword from '../pages/customer/ForgotPassword';
import ResetPassword from '../pages/customer/ResetPassword';
import VerifyEmail from '../pages/customer/VerifyEmail';
import AccountLayout from '../pages/customer/Account/AccountLayout';
import Overview from '../pages/customer/Account/Overview';
import Orders from '../pages/customer/Account/Orders';
import Wishlist from '../pages/customer/Account/Wishlist';
import Inbox from '../pages/customer/Account/Inbox';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminCustomers from '../pages/admin/AdminCustomers';
import AdminInquiries from '../pages/admin/AdminInquiries';

const NotFound = () => (
  <div className="mx-auto max-w-xl px-5 py-32 text-center">
    <h1 className="font-display text-4xl">Page not found</h1>
    <Link to="/" className="mt-8 inline-block text-xs uppercase tracking-[0.18em] underline underline-offset-4">Back to all bags</Link>
  </div>
);

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'bags/:slug', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'help', element: <Help /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout', element: <Checkout /> },
          { path: 'order/:id/placed', element: <OrderPlaced /> },
          {
            path: 'account', element: <AccountLayout />,
            children: [
              { index: true, element: <Overview /> },
              { path: 'orders', element: <Orders /> },
              { path: 'wishlist', element: <Wishlist /> },
              { path: 'inbox', element: <Inbox /> },
            ],
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [{
          path: 'admin', element: <AdminLayout />,
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'orders', element: <AdminOrders /> },
            { path: 'products', element: <AdminProducts /> },
            { path: 'customers', element: <AdminCustomers /> },
            { path: 'inquiries', element: <AdminInquiries /> },
          ],
        }],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
