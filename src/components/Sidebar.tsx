import { X, User, Wallet, Trophy, History, Clock, Gift, Users, Bell, HelpCircle, LogOut, ChevronRight, ArrowDownToLine } from "lucide-react";
import { Link } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: User, label: "My Profile", href: "/profile" },
  { icon: Trophy, label: "Win Cash", href: "/" },
  { icon: Wallet, label: "My Wallet", href: "/wallet" },
  { icon: History, label: "Games History", href: "/game-history" },
  { icon: ArrowDownToLine, label: "Withdraw History", href: "/withdraw-history" },
  { icon: Clock, label: "Transaction History", href: "/game-history" },
  { icon: Gift, label: "Refer & Earn", href: "/refer-earn" },
  { icon: Users, label: "Referral History", href: "/refer-earn" },
  { icon: Bell, label: "Notification", href: "/" },
  { icon: HelpCircle, label: "Support", href: "/" },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-sidebar z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              Hey, <span className="text-primary">👋RockyPlayers</span>
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-sidebar-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </nav>
          
          {/* Logout */}
          <button className="flex items-center gap-3 p-3 mt-4 w-full rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
