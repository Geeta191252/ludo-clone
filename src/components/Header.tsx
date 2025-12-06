import { Menu, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
  walletBalance?: number;
  earningBalance?: number;
}

const Header = ({ onMenuClick, walletBalance = 100, earningBalance = 0 }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="header-gradient flex items-center justify-between px-3 py-3">
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="p-1"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <LudoLogo />
      </div>
      
      <div className="flex items-center gap-2">
        {/* Cash Button */}
        <button 
          onClick={() => navigate('/wallet')}
          className="flex items-center gap-1 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-full pl-1 pr-1 py-1 border border-red-600"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">₹</span>
          </div>
          <div className="flex flex-col items-start px-1">
            <span className="text-red-500 text-xs font-bold leading-tight">Cash</span>
            <span className="text-white text-sm font-bold leading-tight">{walletBalance}</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center mr-1">
            <Plus className="w-4 h-4 text-black" />
          </div>
        </button>

        {/* Earning Button */}
        <button 
          onClick={() => navigate('/refer-earn')}
          className="flex items-center gap-1 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-full pl-1 pr-2 py-1 border border-red-600"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <div className="flex flex-col items-start px-1">
            <span className="text-red-500 text-xs font-bold leading-tight">Earning</span>
            <span className="text-white text-sm font-bold leading-tight">{earningBalance}</span>
          </div>
        </button>
      </div>
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
