import React from 'react';

interface TeenPattiCard3DProps {
  card: string;
  isFlipped: boolean;
  delay?: number;
  large?: boolean;
}

const TeenPattiCard3D: React.FC<TeenPattiCard3DProps> = ({ card, isFlipped, delay = 0, large = false }) => {
  const [showFront, setShowFront] = React.useState(false);

  React.useEffect(() => {
    if (isFlipped) {
      const timer = setTimeout(() => {
        setShowFront(true);
      }, delay * 1000);
      return () => clearTimeout(timer);
    } else {
      setShowFront(false);
    }
  }, [isFlipped, delay]);

  const getCardContent = () => {
    if (card === 'back' || !showFront) {
      return { value: '', suit: '', color: '', symbol: '' };
    }
    const [value, suit] = card.split('_');
    const suitSymbols: Record<string, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    const suitColors: Record<string, string> = {
      hearts: 'text-red-500',
      diamonds: 'text-red-500',
      clubs: 'text-gray-900',
      spades: 'text-gray-900'
    };
    return { value, suit, symbol: suitSymbols[suit] || '', color: suitColors[suit] || '' };
  };

  const { value, symbol, color } = getCardContent();
  const cardSize = large ? 'w-16 h-24' : 'w-8 h-12';
  const fontSize = large ? 'text-xl' : 'text-xs';
  const suitSize = large ? 'text-2xl' : 'text-sm';

  return (
    <div 
      className={`${cardSize} relative perspective-1000`}
      style={{ 
        transformStyle: 'preserve-3d',
        animation: showFront ? `flipCard 0.6s ease-out forwards` : 'none',
        animationDelay: `${delay}s`
      }}
    >
      <style>
        {`
          @keyframes flipCard {
            0% { transform: rotateY(180deg); }
            100% { transform: rotateY(0deg); }
          }
        `}
      </style>
      
      {/* Front of card */}
      {showFront && card !== 'back' ? (
        <div className="absolute inset-0 bg-white rounded-lg shadow-lg flex flex-col items-center justify-center border border-gray-200">
          <span className={`${fontSize} font-bold ${color}`}>{value}</span>
          <span className={`${suitSize} ${color}`}>{symbol}</span>
        </div>
      ) : (
        /* Back of card */
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-lg flex items-center justify-center border-2 border-indigo-400">
          <div className="w-3/4 h-3/4 border border-indigo-300 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-300 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeenPattiCard3D;
