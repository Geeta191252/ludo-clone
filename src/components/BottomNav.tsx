import { User, Wallet, Home, History, Share2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <Link to="/profile" className={`nav-item ${isActive("/profile") ? "text-primary" : ""}`}>
          <User className="nav-item-icon" />
          <span>Profile</span>
        </Link>
        
        <Link to="/wallet" className={`nav-item ${isActive("/wallet") ? "text-primary" : ""}`}>
          <Wallet className="nav-item-icon" />
          <span>Wallet</span>
        </Link>
        
        <Link to="/" className="nav-item">
          <div className="home-btn">
            <Home className="w-7 h-7 text-white" />
          </div>
        </Link>
        
        <Link to="/game-history" className={`nav-item ${isActive("/game-history") ? "text-primary" : ""}`}>
          <History className="nav-item-icon" />
          <span>History</span>
        </Link>
        
        <Link to="/refer-earn" className={`nav-item ${isActive("/refer-earn") ? "text-primary" : ""}`}>
          <Share2 className="nav-item-icon" />
          <span>Refer</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
