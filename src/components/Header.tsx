import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <LudoLogo />
          <span className="font-display text-xl gold-text">RockyLudo</span>
        </div>
      </div>
      <button className="btn-login">
        Login
      </button>
    </header>
  );
};

const LudoLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" className="drop-shadow-lg">
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
    
    {/* Blue piece */}
    <ellipse cx="50" cy="85" rx="12" ry="6" fill="#1e90ff"/>
    <ellipse cx="50" cy="70" rx="8" ry="10" fill="#4169e1"/>
    <circle cx="50" cy="60" r="6" fill="#4169e1"/>
  </svg>
);

export default Header;
