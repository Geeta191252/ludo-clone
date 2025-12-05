import { useState } from "react";
import GameCard, { gameNames } from "./GameCard";
import BattleArena from "./BattleArena";
import DragonTigerGame from "./DragonTigerGame";
import AviatorGame from "./AviatorGame";

type GameType = 'ludo-classic' | 'ludo-popular' | 'snake' | 'dragon-tiger' | 'aviator';

interface GamesSectionProps {
  onGameSelect?: (game: GameType | null) => void;
  selectedGame?: GameType | null;
  walletBalance?: number;
  onWalletChange?: (balance: number) => void;
}

const GamesSection = ({ 
  onGameSelect, 
  selectedGame: externalSelectedGame,
  walletBalance = 10000,
  onWalletChange
}: GamesSectionProps) => {
  const [internalSelectedGame, setInternalSelectedGame] = useState<GameType | null>(null);
  
  const selectedGame = externalSelectedGame !== undefined ? externalSelectedGame : internalSelectedGame;
  const setSelectedGame = onGameSelect || setInternalSelectedGame;

  // Show Dragon Tiger game
  if (selectedGame === 'dragon-tiger') {
    return (
      <DragonTigerGame 
        onClose={() => setSelectedGame(null)}
        balance={walletBalance}
        onBalanceChange={onWalletChange}
      />
    );
  }

  // Show Aviator game
  if (selectedGame === 'aviator') {
    return (
      <AviatorGame 
        onClose={() => setSelectedGame(null)}
        balance={walletBalance}
        onBalanceChange={onWalletChange}
      />
    );
  }

  // Show Battle Arena for other games
  if (selectedGame) {
    return (
      <BattleArena 
        gameName={gameNames[selectedGame]} 
        onClose={() => setSelectedGame(null)} 
      />
    );
  }

  return (
    <section className="pb-28">
      <div className="px-4">
        <h2 className="section-title">Our Games</h2>
        <div className="grid grid-cols-2 gap-4">
          <GameCard 
            gameType="ludo-classic" 
            isLive={true} 
            onClick={() => setSelectedGame('ludo-classic')}
          />
          <GameCard 
            gameType="ludo-popular" 
            isLive={true}
            onClick={() => setSelectedGame('ludo-popular')}
          />
          <GameCard 
            gameType="snake" 
            isLive={true}
            onClick={() => setSelectedGame('snake')}
          />
          <GameCard 
            gameType="dragon-tiger" 
            isLive={true}
            onClick={() => setSelectedGame('dragon-tiger')}
          />
          <GameCard 
            gameType="aviator" 
            isLive={true}
            onClick={() => setSelectedGame('aviator')}
          />
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="mt-6 px-4 pt-4 border-t border-border">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>.</span>
          <span>Terms,</span>
          <span>Privacy,</span>
          <span>Support</span>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;