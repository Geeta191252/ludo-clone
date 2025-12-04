import { User, Wallet, Home, History, Share2 } from "lucide-react";

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button className="nav-item">
          <User className="nav-item-icon" />
          <span>Profile</span>
        </button>
        
        <button className="nav-item">
          <Wallet className="nav-item-icon" />
          <span>Wallet</span>
        </button>
        
        <button className="nav-item">
          <div className="home-btn">
            <Home className="w-7 h-7 text-white" />
          </div>
        </button>
        
        <button className="nav-item">
          <History className="nav-item-icon" />
          <span>History</span>
        </button>
        
        <button className="nav-item">
          <Share2 className="nav-item-icon" />
          <span>Refer</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
