import { useState } from "react";
import GameCard, { gameNames } from "./GameCard";
import BattleArena from "./BattleArena";

type GameType = 'ludo-classic' | 'ludo-popular' | 'snake' | 'dragon-tiger' | 'aviator';

interface GamesSectionProps {
  onGameSelect?: (game: GameType | null) => void;
  selectedGame?: GameType | null;
}

const GamesSection = ({ onGameSelect, selectedGame: externalSelectedGame }: GamesSectionProps) => {
  const [internalSelectedGame, setInternalSelectedGame] = useState<GameType | null>(null);
  
  const selectedGame = externalSelectedGame !== undefined ? externalSelectedGame : internalSelectedGame;
  const setSelectedGame = onGameSelect || setInternalSelectedGame;

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
          />
          <GameCard 
            gameType="aviator" 
            isLive={true}
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
