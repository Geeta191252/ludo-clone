import { Menu, Wallet } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  walletBalance?: number;
}

const Header = ({ onMenuClick, walletBalance = 100 }: HeaderProps) => {
  return (
    <header className="header-gradient flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-1"
        >
          <Menu className="w-7 h-7 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <LudoLogo />
          <span className="font-display text-lg gold-text">RockyLudo</span>
        </div>
      </div>
      <div className="wallet-badge">
        <Wallet className="w-5 h-5" />
        <span>₹{walletBalance}</span>
      </div>
    </header>
  );
};

const LudoLogo = () => (
  <svg width="45" height="45" viewBox="0 0 100 100" className="drop-shadow-lg">
    {/* Dice */}
    <rect x="30" y="25" width="40" height="40" rx="8" fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
    <circle cx="42" cy="37" r="4" fill="#1a1a2e"/>
    <circle cx="58" cy="37" r="4" fill="#1a1a2e"/>
    <circle cx="42" cy="53" r="4" fill="#1a1a2e"/>
    <circle cx="58" cy="53" r="4" fill="#1a1a2e"/>
    <circle cx="50" cy="45" r="4" fill="#1a1a2e"/>
    
    {/* Red piece */}
    <ellipse cx="20" cy="70" rx="12" ry="6" fill="#cc3333"/>
    <ellipse cx="20" cy="55" rx="8" ry="10" fill="#ff4444"/>
    <circle cx="20" cy="45" r="6" fill="#ff4444"/>
    
    {/* Green piece */}
    <ellipse cx="80" cy="70" rx="12" ry="6" fill="#228b22"/>
    <ellipse cx="80" cy="55" rx="8" ry="10" fill="#32cd32"/>
    <circle cx="80" cy="45" r="6" fill="#32cd32"/>
    
    {/* Yellow piece */}
    <ellipse cx="35" cy="85" rx="10" ry="5" fill="#cc9900"/>
    <ellipse cx="35" cy="73" rx="7" ry="8" fill="#FFD700"/>
    <circle cx="35" cy="65" r="5" fill="#FFD700"/>
    
    {/* Blue piece */}
    <ellipse cx="65" cy="85" rx="10" ry="5" fill="#1e5aa8"/>
    <ellipse cx="65" cy="73" rx="7" ry="8" fill="#4169e1"/>
    <circle cx="65" cy="65" r="5" fill="#4169e1"/>
  </svg>
);

export default Header;
