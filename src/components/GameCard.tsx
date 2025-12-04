import ludoClassic from "@/assets/ludo-classic.png";
import ludoPopular from "@/assets/ludo-popular.png";
import snakeLadders from "@/assets/snake-ladders.png";
import dragonTiger from "@/assets/dragon-tiger.png";
import aviator from "@/assets/aviator.png";

interface GameCardProps {
  gameType: 'ludo-classic' | 'ludo-popular' | 'snake' | 'dragon-tiger' | 'aviator';
  isLive?: boolean;
  onClick?: () => void;
}

const gameImages = {
  'ludo-classic': ludoClassic,
  'ludo-popular': ludoPopular,
  'snake': snakeLadders,
  'dragon-tiger': dragonTiger,
  'aviator': aviator,
};

const gameNames = {
  'ludo-classic': 'Ludo Classic',
  'ludo-popular': 'Ludo Popular',
  'snake': 'Snake & Ladders',
  'dragon-tiger': 'Dragon Tiger',
  'aviator': 'Aviator',
};

const GameCard = ({ gameType, isLive = true, onClick }: GameCardProps) => {
  const isAviator = gameType === 'aviator';
  
  return (
    <div 
      className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isAviator ? 'col-span-2' : ''
      }`}
      onClick={onClick}
    >
      {isLive && (
        <span className="live-badge z-10">LIVE</span>
      )}
      <img 
        src={gameImages[gameType]} 
        alt={gameNames[gameType]}
        className="w-full h-full object-cover"
        style={{ minHeight: isAviator ? '180px' : '160px' }}
      />
    </div>
  );
};

export { gameNames };
export default GameCard;
