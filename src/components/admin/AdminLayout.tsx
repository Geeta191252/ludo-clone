import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Gamepad2, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Plane,
  Crown,
  Dice5
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { title: "Users", icon: Users, path: "/admin/users" },
  { title: "Transactions", icon: CreditCard, path: "/admin/transactions" },
  { title: "Games", icon: Gamepad2, path: "/admin/games" },
  { title: "Ludo Classic", icon: Dice5, path: "/admin/ludo-control" },
  { title: "Aviator Control", icon: Plane, path: "/admin/aviator-control" },
  { title: "Dragon Tiger", icon: Crown, path: "/admin/dragon-tiger-control" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check token immediately - no async needed
  const token = localStorage.getItem("admin_token");
  
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Redirect only if no token - use useEffect to prevent redirect loop
  useEffect(() => {
    if (!token) {
      navigate("/admin", { replace: true });
    }
  }, [token, navigate]);
  
  // If no token, show nothing (will redirect)
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-slate-800/95 backdrop-blur-lg border-r border-slate-700
        transition-all duration-300 ease-in-out w-56
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive(item.path) 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.title}</span>
              
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="transition-all duration-300 ml-0 lg:ml-56">
        {/* Top Bar */}
        <header className="h-16 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">Welcome, Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
