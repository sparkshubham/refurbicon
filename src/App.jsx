import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import Warranties from './pages/Warranties';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Payslip from './pages/Payslip';
import Performance from './pages/Performance';
import HrReports from './pages/HrReports';
import Users from './pages/Users';
import Roles from './pages/Roles';
import SettingsPage from './pages/Settings';
import MobileAttendance from './pages/mobile/MobileAttendance';
import ShopLayout from './shop/ShopLayout';
import ShopHome from './shop/ShopHome';
import ShopProducts from './shop/ShopProducts';
import ShopProductDetail from './shop/ShopProductDetail';
import ShopCart from './shop/ShopCart';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading REFURBICON...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/shop" element={<ShopLayout />}>
        <Route index element={<ShopHome />} />
        <Route path="products" element={<ShopProducts />} />
        <Route path="products/:id" element={<ShopProductDetail />} />
        <Route path="cart" element={<ShopCart />} />
      </Route>
      <Route
        path="/m/*"
        element={
          <PrivateRoute>
            <MobileAttendance />
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="customers" element={<Customers />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="warranties" element={<Warranties />} />
        <Route path="reports" element={<Reports />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll/:id" element={<Payslip />} />
        <Route path="performance" element={<Performance />} />
        <Route path="hr-reports" element={<HrReports />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
