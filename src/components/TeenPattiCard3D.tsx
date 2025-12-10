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
      hearts: 'text-red-600',
      diamonds: 'text-red-600',
      clubs: 'text-gray-900',
      spades: 'text-gray-900'
    };
    return { value, suit, symbol: suitSymbols[suit] || '', color: suitColors[suit] || '' };
  };

  const { value, symbol, color } = getCardContent();
  const cardSize = large ? 'w-16 h-24' : 'w-10 h-14';
  const fontSize = large ? 'text-xl' : 'text-sm';
  const suitSize = large ? 'text-3xl' : 'text-lg';

  return (
    <div 
      className={`${cardSize} relative`}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: showFront ? 'rotateY(0deg)' : 'rotateY(180deg)'
        }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 bg-white rounded-lg shadow-xl flex flex-col items-center justify-between p-1 border border-gray-200"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Top Left */}
          <div className="w-full flex justify-start">
            <div className={`flex flex-col items-center leading-none ${color}`}>
              <span className={`${fontSize} font-bold`}>{value}</span>
              <span className={large ? 'text-lg' : 'text-xs'}>{symbol}</span>
            </div>
          </div>
          
          {/* Center Suit */}
          <div className={`${suitSize} ${color}`}>
            {symbol}
          </div>
          
          {/* Bottom Right (inverted) */}
          <div className="w-full flex justify-end">
            <div className={`flex flex-col items-center leading-none rotate-180 ${color}`}>
              <span className={`${fontSize} font-bold`}>{value}</span>
              <span className={large ? 'text-lg' : 'text-xs'}>{symbol}</span>
            </div>
          </div>
        </div>
        
        {/* Back of card */}
        <div 
          className="absolute inset-0 rounded-lg shadow-xl flex items-center justify-center"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 50%, #5c0000 100%)'
          }}
        >
          <div className="w-[85%] h-[90%] border-2 border-red-300/50 rounded-md flex items-center justify-center">
            <div 
              className="w-[90%] h-[90%] rounded-sm"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 3px,
                  rgba(255,255,255,0.1) 3px,
                  rgba(255,255,255,0.1) 6px
                )`,
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeenPattiCard3D;
