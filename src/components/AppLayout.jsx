import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, TrendingUp, ShoppingCart, Users, ClipboardList,
  CreditCard, Truck, Shield, BarChart3, UserCog, CalendarCheck, CalendarOff, Wallet,
  Award, FileBarChart, UserRound, KeyRound, Settings, LogOut, Smartphone, Store,
  FileText, Receipt, Ticket, UserCircle2, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function roleName(user) {
  return user?.role?.name || '';
}

function canAccess(user, item) {
  const role = roleName(user);
  if (role === 'Admin' || (user?.role?.permissions || []).includes('*')) return true;
  if (role === 'Manager') {
    if (item.staffOnly) return false;
    return true;
  }
  // Staff — limited panel
  return !!item.staffOk;
}

const allSections = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, staffOk: false },
      { to: '/staff-panel', icon: UserCircle2, label: 'My Panel', staffOk: true, staffOnly: true },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/products', icon: Package, label: 'Products', staffOk: true },
      { to: '/inventory', icon: Warehouse, label: 'Inventory' },
      { to: '/sales', icon: TrendingUp, label: 'Sales' },
      { to: '/purchases', icon: ShoppingCart, label: 'Purchase' },
      { to: '/invoices', icon: FileText, label: 'Invoices' },
      { to: '/bills', icon: Receipt, label: 'Bills' },
      { to: '/customers', icon: Users, label: 'Customers' },
      { to: '/orders', icon: ClipboardList, label: 'Orders', staffOk: true },
      { to: '/tickets', icon: Ticket, label: 'Tickets', staffOk: true },
      { to: '/payments', icon: CreditCard, label: 'Payments' },
      { to: '/deliveries', icon: Truck, label: 'Delivery', staffOk: true },
      { to: '/warranties', icon: Shield, label: 'Warranty' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'HR Management',
    items: [
      { to: '/employees', icon: UserCog, label: 'Employees' },
      { to: '/attendance', icon: CalendarCheck, label: 'Attendance', staffOk: true },
      { to: '/leaves', icon: CalendarOff, label: 'Leaves', staffOk: true },
      { to: '/payroll', icon: Wallet, label: 'Payroll' },
      { to: '/staff-review', icon: Star, label: 'Sales Review' },
      { to: '/performance', icon: Award, label: 'Performance' },
      { to: '/hr-reports', icon: FileBarChart, label: 'HR Reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/users', icon: UserRound, label: 'Users' },
      { to: '/roles', icon: KeyRound, label: 'Roles & Permissions' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const titles = {
  '/': 'Dashboard',
  '/staff-panel': 'Staff Panel',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/sales': 'Sales',
  '/purchases': 'Purchase',
  '/invoices': 'Invoices',
  '/bills': 'Bills',
  '/customers': 'Customers',
  '/orders': 'Orders',
  '/tickets': 'Tickets',
  '/payments': 'Payments',
  '/deliveries': 'Delivery',
  '/warranties': 'Warranty',
  '/reports': 'Business Reports',
  '/employees': 'Employees',
  '/attendance': 'Attendance',
  '/leaves': 'Leaves',
  '/payroll': 'Payroll',
  '/staff-review': 'Staff Sales Review',
  '/performance': 'Performance',
  '/hr-reports': 'HR Reports',
  '/users': 'Users',
  '/roles': 'Roles & Permissions',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const base = '/' + (location.pathname.split('/')[1] || '');
  const title = titles[base] || titles[location.pathname] || 'REFURBICON';
  const isStaff = roleName(user) === 'Staff';

  const sections = allSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => canAccess(user, item)),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">R</div>
          <div>
            <h1 className="brand-font">REFURBICON</h1>
            <span>{isStaff ? 'Staff Panel' : 'Enterprise ERP'}</span>
          </div>
        </div>
        {sections.map((sec) => (
          <div className="nav-section" key={sec.label}>
            <div className="nav-label">{sec.label}</div>
            {sec.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="nav-section" style={{ marginTop: 'auto', paddingBottom: 20 }}>
          {!isStaff && (
            <a href="/shop" target="_blank" rel="noreferrer" className="nav-link">
              <Store size={18} /> Customer Panel
            </a>
          )}
          <NavLink to="/m" className="nav-link">
            <Smartphone size={18} /> Mobile Attendance
          </NavLink>
          <button
            className="nav-link"
            style={{ width: '100%', background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <h2 className="brand-font">{title}</h2>
            <div className="breadcrumb">Home / {title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.role?.name}</div>
            </div>
            <div className="avatar sm" style={{ display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700 }}>
              {(user?.name || 'U')[0]}
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
