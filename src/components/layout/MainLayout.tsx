import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Map, 
  Briefcase, 
  FileText, 
  Settings,
  Users,
  Receipt,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Vendors', path: '/vendors', icon: Users },
  { name: 'Invoices', path: '/invoices', icon: Receipt },
  { name: 'Accounts (COA)', path: '/accounting', icon: BookOpen },
  { name: 'Journal Entries', path: '/journals', icon: FileText },
  { name: 'General Ledger', path: '/ledger', icon: BookOpen },
  { name: 'Vendor Ledger', path: '/vendor-ledger', icon: BookOpen },
  { name: 'Visa Processing', path: '/visa', icon: Briefcase },
  { name: 'Umrah & Hajj', path: '/umrah', icon: Map },
  { name: 'Reports / Profit', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-blue-400">
              TRAVEL<span className="text-white">SYS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Accounting & Management</p>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium w-full text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
          <div className="text-xs text-slate-500 text-center mt-4">
            &copy; {new Date().getFullYear()} TravelSys
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Placeholder */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shadow-sm flex-shrink-0">
          <button 
            className="mr-4 p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-600 md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
              {user?.username?.charAt(0) || 'A'}
            </div>
            <span className="text-sm font-medium">{user?.username || 'Admin User'}</span>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
