interface GameCardProps {
  title: string;
  subtitle?: string;
  isLive?: boolean;
  image?: string;
  onClick?: () => void;
}

const GameCard = ({ title, subtitle, isLive = true, image, onClick }: GameCardProps) => {
  return (
    <div className="game-card cursor-pointer" onClick={onClick}>
      {isLive && (
        <span className="live-badge">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
          LIVE
        </span>
      )}
      <div className="game-card-inner">
        <div className="game-card-content flex-col py-6 px-4">
          {image ? (
            <img src={image} alt={title} className="w-full h-24 object-contain" />
          ) : (
            <>
              <GameIcon title={title} />
              <h3 className="font-display text-lg text-amber-900 mt-2 text-center leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-amber-800 text-sm font-medium">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const GameIcon = ({ title }: { title: string }) => {
  if (title.toLowerCase().includes("ludo")) {
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-md">
        <rect x="10" y="10" width="80" height="80" rx="5" fill="#8B4513" stroke="#5D3A1A" strokeWidth="3"/>
        <rect x="15" y="15" width="70" height="70" rx="3" fill="#F5DEB3"/>
        <rect x="15" y="15" width="23" height="23" fill="#ff4444"/>
        <rect x="62" y="15" width="23" height="23" fill="#32cd32"/>
        <rect x="15" y="62" width="23" height="23" fill="#4169e1"/>
        <rect x="62" y="62" width="23" height="23" fill="#FFD700"/>
        <rect x="38" y="38" width="24" height="24" fill="#F5DEB3" stroke="#8B4513"/>
        <circle cx="26" cy="26" r="5" fill="white"/>
        <circle cx="73" cy="26" r="5" fill="white"/>
        <circle cx="26" cy="73" r="5" fill="white"/>
        <circle cx="73" cy="73" r="5" fill="white"/>
      </svg>
    );
  }
  
  if (title.toLowerCase().includes("snake")) {
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-md">
        <rect x="10" y="10" width="80" height="80" rx="5" fill="#8B4513" stroke="#5D3A1A" strokeWidth="3"/>
        <rect x="15" y="15" width="70" height="70" rx="3" fill="#F5DEB3"/>
        <path d="M25 75 Q30 40 50 50 Q70 60 75 25" stroke="#32cd32" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <circle cx="75" cy="22" r="5" fill="#32cd32"/>
        <circle cx="73" cy="20" r="1.5" fill="black"/>
        <rect x="30" y="30" width="3" height="40" fill="#8B4513"/>
        <rect x="27" y="25" width="9" height="8" fill="#8B4513"/>
      </svg>
    );
  }
  
  if (title.toLowerCase().includes("dragon") || title.toLowerCase().includes("tiger")) {
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-md">
        <circle cx="35" cy="50" r="25" fill="#ff6b35"/>
        <path d="M25 45 L30 40 L35 45 L40 40 L45 45" stroke="#fff" strokeWidth="2" fill="none"/>
        <circle cx="30" cy="52" r="3" fill="black"/>
        <circle cx="40" cy="52" r="3" fill="black"/>
        <path d="M32 60 Q35 65 38 60" stroke="black" strokeWidth="2" fill="none"/>
        <circle cx="65" cy="50" r="25" fill="#FFD700"/>
        <path d="M55 42 L60 35 L65 42" stroke="#ff6b35" strokeWidth="3" fill="none"/>
        <path d="M65 42 L70 35 L75 42" stroke="#ff6b35" strokeWidth="3" fill="none"/>
        <circle cx="60" cy="50" r="3" fill="black"/>
        <circle cx="70" cy="50" r="3" fill="black"/>
        <path d="M62 58 Q65 62 68 58" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    );
  }
  
  if (title.toLowerCase().includes("aviator")) {
    return (
      <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-md">
        <ellipse cx="50" cy="50" rx="40" ry="20" fill="#87CEEB" opacity="0.3"/>
        <path d="M20 55 L50 40 L80 55 L50 50 Z" fill="#ff4444"/>
        <ellipse cx="50" cy="52" rx="12" ry="8" fill="#cc0000"/>
        <circle cx="45" cy="50" r="3" fill="#FFD700"/>
        <path d="M50 40 L50 30 L55 35 Z" fill="#ff4444"/>
        <ellipse cx="50" cy="60" rx="6" ry="3" fill="#ff4444"/>
      </svg>
    );
  }
  
  return (
    <div className="w-14 h-14 bg-amber-600 rounded-lg flex items-center justify-center">
      <span className="text-2xl">🎮</span>
    </div>
  );
};

export default GameCard;
