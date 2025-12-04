interface GameCardProps {
  title: string;
  subtitle?: string;
  isLive?: boolean;
  gameType: 'ludo-classic' | 'ludo-popular' | 'snake' | 'dragon-tiger' | 'aviator';
  onClick?: () => void;
}

const GameCard = ({ title, subtitle, isLive = true, gameType, onClick }: GameCardProps) => {
  return (
    <div className="game-card" onClick={onClick}>
      {isLive && (
        <span className="live-badge">LIVE</span>
      )}
      <div className="game-card-inner">
        <GameGraphic gameType={gameType} title={title} subtitle={subtitle} />
      </div>
    </div>
  );
};

const GameGraphic = ({ gameType, title, subtitle }: { gameType: string; title: string; subtitle?: string }) => {
  if (gameType === 'ludo-classic') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {/* Ludo Board */}
          <svg width="80" height="70" viewBox="0 0 100 90">
            <rect x="10" y="5" width="60" height="60" rx="3" fill="#F5DEB3" stroke="#8B4513" strokeWidth="2"/>
            <rect x="13" y="8" width="17" height="17" fill="#ff4444"/>
            <rect x="50" y="8" width="17" height="17" fill="#32cd32"/>
            <rect x="13" y="45" width="17" height="17" fill="#4169e1"/>
            <rect x="50" y="45" width="17" height="17" fill="#FFD700"/>
            {/* Pieces */}
            <circle cx="80" cy="20" r="8" fill="#ff4444"/>
            <circle cx="80" cy="38" r="8" fill="#32cd32"/>
            <circle cx="95" cy="55" r="8" fill="#FFD700"/>
            <circle cx="80" cy="55" r="8" fill="#4169e1"/>
          </svg>
          {/* Dice */}
          <svg className="absolute -bottom-2 -left-2" width="25" height="25" viewBox="0 0 30 30">
            <rect x="2" y="2" width="26" height="26" rx="4" fill="white" stroke="#ccc" strokeWidth="1"/>
            <circle cx="9" cy="9" r="2.5" fill="#333"/>
            <circle cx="21" cy="21" r="2.5" fill="#333"/>
          </svg>
        </div>
        <div className="bg-blue-800 px-3 py-1 rounded text-white font-display text-sm text-center leading-tight">
          <div>LUDO</div>
          <div>CLASSIC</div>
        </div>
      </div>
    );
  }

  if (gameType === 'ludo-popular') {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <svg width="70" height="65" viewBox="0 0 90 85">
            <rect x="10" y="5" width="55" height="55" rx="3" fill="#F5DEB3" stroke="#8B4513" strokeWidth="2"/>
            <rect x="13" y="8" width="15" height="15" fill="#ff4444"/>
            <rect x="47" y="8" width="15" height="15" fill="#32cd32"/>
            <rect x="13" y="42" width="15" height="15" fill="#4169e1"/>
            <rect x="47" y="42" width="15" height="15" fill="#FFD700"/>
            {/* Pieces */}
            <circle cx="75" cy="25" r="7" fill="#ff4444"/>
            <circle cx="75" cy="42" r="7" fill="#32cd32"/>
            <circle cx="75" cy="59" r="7" fill="#4169e1"/>
            <circle cx="75" cy="76" r="7" fill="#FFD700"/>
          </svg>
          {/* Dice */}
          <svg className="absolute -bottom-1 -left-1" width="22" height="22" viewBox="0 0 30 30">
            <rect x="2" y="2" width="26" height="26" rx="4" fill="white" stroke="#ccc" strokeWidth="1"/>
            <circle cx="8" cy="8" r="2" fill="#333"/>
            <circle cx="15" cy="15" r="2" fill="#333"/>
            <circle cx="22" cy="22" r="2" fill="#333"/>
          </svg>
        </div>
        <div className="font-display text-amber-800 text-center leading-tight">
          <div className="text-lg tracking-wide" style={{ textShadow: '1px 1px 0 #B8860B' }}>LUDO</div>
          <div className="text-base tracking-wider" style={{ textShadow: '1px 1px 0 #B8860B' }}>POPULAR</div>
        </div>
      </div>
    );
  }

  if (gameType === 'snake') {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Snake */}
          <svg width="45" height="55" viewBox="0 0 60 70">
            <path d="M15 60 Q10 30 30 35 Q50 40 45 15" stroke="#cc3333" strokeWidth="8" fill="none" strokeLinecap="round"/>
            <circle cx="45" cy="12" r="8" fill="#cc3333"/>
            <circle cx="42" cy="10" r="2" fill="white"/>
            <path d="M48 16 L55 14 L55 18 Z" fill="#cc3333"/>
          </svg>
          {/* Ladder */}
          <svg className="absolute right-0 top-0" width="30" height="55" viewBox="0 0 35 70">
            <rect x="5" y="5" width="4" height="60" fill="#8B4513"/>
            <rect x="25" y="5" width="4" height="60" fill="#8B4513"/>
            <rect x="5" y="12" width="24" height="4" fill="#A0522D"/>
            <rect x="5" y="28" width="24" height="4" fill="#A0522D"/>
            <rect x="5" y="44" width="24" height="4" fill="#A0522D"/>
            <rect x="5" y="58" width="24" height="4" fill="#A0522D"/>
          </svg>
        </div>
        <div className="bg-red-700 px-3 py-1 rounded mt-1 text-white font-display text-xs text-center leading-tight">
          <div>SNAKE</div>
          <div className="text-[10px]">AND LADDERS</div>
        </div>
      </div>
    );
  }

  if (gameType === 'dragon-tiger') {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center -space-x-2">
          {/* Dragon */}
          <svg width="50" height="50" viewBox="0 0 60 60">
            <ellipse cx="30" cy="35" rx="25" ry="20" fill="#cc3333"/>
            <path d="M15 25 L20 15 L25 25" stroke="#cc3333" strokeWidth="4" fill="#cc3333"/>
            <path d="M30 25 L35 15 L40 25" stroke="#cc3333" strokeWidth="4" fill="#cc3333"/>
            <circle cx="22" cy="32" r="4" fill="white"/>
            <circle cx="22" cy="32" r="2" fill="black"/>
            <circle cx="38" cy="32" r="4" fill="white"/>
            <circle cx="38" cy="32" r="2" fill="black"/>
            <path d="M25 42 Q30 48 35 42" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
          {/* Tiger */}
          <svg width="50" height="50" viewBox="0 0 60 60">
            <ellipse cx="30" cy="35" rx="25" ry="20" fill="#FF8C00"/>
            <path d="M12 22 L18 12 L24 22" stroke="#FF8C00" strokeWidth="4" fill="#FF8C00"/>
            <path d="M36 22 L42 12 L48 22" stroke="#FF8C00" strokeWidth="4" fill="#FF8C00"/>
            <circle cx="22" cy="32" r="4" fill="white"/>
            <circle cx="22" cy="32" r="2" fill="black"/>
            <circle cx="38" cy="32" r="4" fill="white"/>
            <circle cx="38" cy="32" r="2" fill="black"/>
            <ellipse cx="30" cy="40" rx="6" ry="4" fill="#ffcc99"/>
            <path d="M28 42 L30 45 L32 42" fill="#333"/>
          </svg>
        </div>
        <div className="bg-gradient-to-r from-red-700 to-orange-500 px-3 py-1 rounded text-white font-display text-xs text-center leading-tight">
          <div>DRAGON</div>
          <div>TIGER</div>
        </div>
      </div>
    );
  }

  if (gameType === 'aviator') {
    return (
      <div className="flex flex-col items-center py-4">
        <svg width="120" height="80" viewBox="0 0 150 100">
          {/* Plane body */}
          <ellipse cx="75" cy="55" rx="35" ry="18" fill="#cc3333"/>
          {/* Wings */}
          <path d="M30 60 L75 45 L120 60 L75 55 Z" fill="#cc3333"/>
          {/* Propeller lines */}
          <line x1="25" y1="50" x2="15" y2="45" stroke="#666" strokeWidth="2"/>
          <line x1="25" y1="55" x2="12" y2="55" stroke="#666" strokeWidth="2"/>
          <line x1="25" y1="60" x2="15" y2="65" stroke="#666" strokeWidth="2"/>
          {/* Propeller center */}
          <ellipse cx="32" cy="55" rx="8" ry="12" fill="#8B0000"/>
          <circle cx="32" cy="55" r="4" fill="#FFD700"/>
          {/* Tail */}
          <path d="M105 50 L115 35 L118 50 Z" fill="#cc3333"/>
          {/* Window */}
          <ellipse cx="60" cy="52" rx="6" ry="4" fill="#87CEEB"/>
        </svg>
        <div className="relative mt-2">
          <div className="bg-gradient-to-r from-amber-100 to-amber-200 border-4 border-amber-400 rounded-lg px-6 py-2">
            <span className="font-display text-2xl text-red-700 italic" style={{ fontFamily: 'cursive' }}>Aviator</span>
          </div>
          {/* Light bulbs effect */}
          <div className="absolute -top-1 left-0 right-0 flex justify-around">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animationDelay: `${i * 0.1}s` }}/>
            ))}
          </div>
          <div className="absolute -bottom-1 left-0 right-0 flex justify-around">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animationDelay: `${i * 0.1}s` }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GameCard;
