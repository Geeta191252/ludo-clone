import React, { useState, useEffect } from 'react';
import { X, Coins, RotateCw } from 'lucide-react';

interface DragonTigerGameProps {
  onClose: () => void;
}

interface BetHistory {
  id: number;
  winner: 'dragon' | 'tiger' | 'tie';
}

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];

const getCardNumValue = (value: string): number => {
  return CARD_VALUES.indexOf(value) + 1;
};

const getRandomCard = () => {
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
  return { suit, value, numValue: getCardNumValue(value) };
};

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [dragonCard, setDragonCard] = useState<{ suit: string; value: string; numValue: number } | null>(null);
  const [tigerCard, setTigerCard] = useState<{ suit: string; value: string; numValue: number } | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<BetHistory[]>([]);
  const [timer, setTimer] = useState(15);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'result'>('betting');

  // Auto game timer
  useEffect(() => {
    if (gamePhase === 'betting' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && gamePhase === 'betting') {
      handleDeal();
    }
  }, [timer, gamePhase]);

  const handleDeal = () => {
    if (gamePhase !== 'betting') return;
    
    setGamePhase('dealing');
    setShowResult(false);
    setWinner(null);
    setWinAmount(0);

    // Deal dragon card first
    setTimeout(() => {
      const dragon = getRandomCard();
      setDragonCard(dragon);

      // Deal tiger card
      setTimeout(() => {
        const tiger = getRandomCard();
        setTigerCard(tiger);

        // Determine winner
        setTimeout(() => {
          let gameWinner: 'dragon' | 'tiger' | 'tie';
          if (dragon.numValue > tiger.numValue) {
            gameWinner = 'dragon';
          } else if (tiger.numValue > dragon.numValue) {
            gameWinner = 'tiger';
          } else {
            gameWinner = 'tie';
          }

          setWinner(gameWinner);
          setShowResult(true);
          setGamePhase('result');

          // Calculate winnings
          if (selectedBet === gameWinner) {
            let win = 0;
            if (gameWinner === 'tie') {
              win = betAmount * 8;
            } else {
              win = betAmount * 2;
            }
            setWinAmount(win);
            setBalance(prev => prev + win);
          } else if (selectedBet) {
            setBalance(prev => prev - betAmount);
          }

          // Add to history
          setHistory(prev => [{
            id: Date.now(),
            winner: gameWinner,
          }, ...prev.slice(0, 19)]);

          // Reset for next round
          setTimeout(() => {
            setDragonCard(null);
            setTigerCard(null);
            setSelectedBet(null);
            setShowResult(false);
            setWinner(null);
            setTimer(15);
            setGamePhase('betting');
          }, 4000);
        }, 500);
      }, 800);
    }, 500);
  };

  const betOptions = [10, 50, 100, 500];

  const getCardColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black';
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#16213e] to-[#1a1a2e] p-3 flex items-center justify-between border-b border-gray-700">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span className="text-2xl">🐉</span>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Dragon Tiger
          </span>
          <span className="text-2xl">🐅</span>
        </h1>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 px-3 py-1.5 rounded-full">
          <Coins className="w-4 h-4 text-yellow-900" />
          <span className="text-yellow-900 font-bold text-sm">₹{balance}</span>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="px-4 py-3">
        <div className={`text-center py-2 px-4 rounded-xl font-bold text-lg transition-all duration-300 ${
          gamePhase === 'betting' 
            ? timer <= 5 
              ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse' 
              : 'bg-gradient-to-r from-green-600 to-green-500'
            : gamePhase === 'dealing'
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
              : 'bg-gradient-to-r from-purple-600 to-purple-500'
        }`}>
          {gamePhase === 'betting' && (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
              Bet Now: {timer}s
            </span>
          )}
          {gamePhase === 'dealing' && (
            <span className="flex items-center justify-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin" />
              Dealing...
            </span>
          )}
          {gamePhase === 'result' && 'Result'}
        </div>
      </div>

      {/* Game Table */}
      <div className="px-4">
        <div className="bg-gradient-to-b from-[#0f3d0f] to-[#0a2d0a] rounded-2xl p-4 border-2 border-yellow-600/30 shadow-2xl relative overflow-hidden">
          {/* Table Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          {/* Cards Area */}
          <div className="relative flex justify-around items-center py-6">
            {/* Dragon Side */}
            <div className="text-center flex-1">
              <div className="inline-block px-4 py-1 bg-blue-600 rounded-full mb-3">
                <span className="font-bold text-sm">🐉 DRAGON</span>
              </div>
              <div className={`mx-auto w-16 h-24 sm:w-20 sm:h-28 rounded-lg flex items-center justify-center transition-all duration-500 ${
                dragonCard 
                  ? `bg-white shadow-xl ${winner === 'dragon' ? 'ring-4 ring-yellow-400 scale-110 animate-pulse' : ''}`
                  : 'bg-blue-900/60 border-2 border-blue-400/50 border-dashed'
              }`}>
                {dragonCard ? (
                  <div className={`text-center ${getCardColor(dragonCard.suit)}`}>
                    <div className="text-2xl sm:text-3xl font-bold">{dragonCard.value}</div>
                    <div className="text-2xl sm:text-3xl">{dragonCard.suit}</div>
                  </div>
                ) : (
                  <span className="text-blue-400/50 text-3xl">?</span>
                )}
              </div>
              {winner === 'dragon' && showResult && (
                <div className="mt-3 inline-block px-3 py-1 bg-yellow-500 rounded-full animate-bounce">
                  <span className="text-black font-bold text-sm">🏆 WIN!</span>
                </div>
              )}
            </div>

            {/* VS Badge */}
            <div className="flex-shrink-0 mx-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-black font-black text-sm sm:text-base">VS</span>
              </div>
            </div>

            {/* Tiger Side */}
            <div className="text-center flex-1">
              <div className="inline-block px-4 py-1 bg-orange-600 rounded-full mb-3">
                <span className="font-bold text-sm">🐅 TIGER</span>
              </div>
              <div className={`mx-auto w-16 h-24 sm:w-20 sm:h-28 rounded-lg flex items-center justify-center transition-all duration-500 ${
                tigerCard 
                  ? `bg-white shadow-xl ${winner === 'tiger' ? 'ring-4 ring-yellow-400 scale-110 animate-pulse' : ''}`
                  : 'bg-orange-900/60 border-2 border-orange-400/50 border-dashed'
              }`}>
                {tigerCard ? (
                  <div className={`text-center ${getCardColor(tigerCard.suit)}`}>
                    <div className="text-2xl sm:text-3xl font-bold">{tigerCard.value}</div>
                    <div className="text-2xl sm:text-3xl">{tigerCard.suit}</div>
                  </div>
                ) : (
                  <span className="text-orange-400/50 text-3xl">?</span>
                )}
              </div>
              {winner === 'tiger' && showResult && (
                <div className="mt-3 inline-block px-3 py-1 bg-yellow-500 rounded-full animate-bounce">
                  <span className="text-black font-bold text-sm">🏆 WIN!</span>
                </div>
              )}
            </div>
          </div>

          {/* Tie Win Display */}
          {winner === 'tie' && showResult && (
            <div className="text-center mb-4">
              <div className="inline-block px-4 py-2 bg-green-500 rounded-full animate-bounce">
                <span className="text-white font-bold">🤝 TIE! 🤝</span>
              </div>
            </div>
          )}

          {/* Win Popup */}
          {showResult && selectedBet === winner && winAmount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 px-6 py-3 rounded-2xl shadow-2xl animate-bounce border-2 border-yellow-300">
                <div className="text-black font-black text-xl">🎉 +₹{winAmount} 🎉</div>
              </div>
            </div>
          )}

          {/* Betting Buttons */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => gamePhase === 'betting' && setSelectedBet('dragon')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-3 rounded-xl font-bold transition-all border-2 ${
                selectedBet === 'dragon' 
                  ? 'bg-blue-600 border-yellow-400 scale-105 shadow-lg shadow-blue-500/50' 
                  : 'bg-blue-900/80 border-blue-600/50 hover:bg-blue-800 hover:border-blue-400'
              } ${gamePhase !== 'betting' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {selectedBet === 'dragon' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
              )}
              <div className="text-xl mb-1">🐉</div>
              <div className="text-sm">DRAGON</div>
              <div className="text-yellow-400 text-xs mt-1">1:1</div>
            </button>

            <button
              onClick={() => gamePhase === 'betting' && setSelectedBet('tie')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-3 rounded-xl font-bold transition-all border-2 ${
                selectedBet === 'tie' 
                  ? 'bg-green-600 border-yellow-400 scale-105 shadow-lg shadow-green-500/50' 
                  : 'bg-green-900/80 border-green-600/50 hover:bg-green-800 hover:border-green-400'
              } ${gamePhase !== 'betting' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {selectedBet === 'tie' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
              )}
              <div className="text-xl mb-1">🤝</div>
              <div className="text-sm">TIE</div>
              <div className="text-yellow-400 text-xs mt-1">8:1</div>
            </button>

            <button
              onClick={() => gamePhase === 'betting' && setSelectedBet('tiger')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-3 rounded-xl font-bold transition-all border-2 ${
                selectedBet === 'tiger' 
                  ? 'bg-orange-600 border-yellow-400 scale-105 shadow-lg shadow-orange-500/50' 
                  : 'bg-orange-900/80 border-orange-600/50 hover:bg-orange-800 hover:border-orange-400'
              } ${gamePhase !== 'betting' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {selectedBet === 'tiger' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
              )}
              <div className="text-xl mb-1">🐅</div>
              <div className="text-sm">TIGER</div>
              <div className="text-yellow-400 text-xs mt-1">1:1</div>
            </button>
          </div>
        </div>
      </div>

      {/* Bet Amount Selection */}
      <div className="px-4 mt-4">
        <div className="bg-[#16213e] rounded-xl p-4">
          <div className="text-center text-gray-400 text-sm mb-3">Select Bet Amount</div>
          <div className="flex justify-center gap-2 flex-wrap">
            {betOptions.map(amount => (
              <button
                key={amount}
                onClick={() => gamePhase === 'betting' && setBetAmount(amount)}
                disabled={gamePhase !== 'betting'}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                  betAmount === amount 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black scale-110 shadow-lg' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } ${gamePhase !== 'betting' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                ₹{amount}
              </button>
            ))}
          </div>

          {/* Current Bet Display */}
          {selectedBet && (
            <div className="mt-3 text-center">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full text-sm">
                Bet: <span className="font-bold text-yellow-400">₹{betAmount}</span> on <span className="font-bold uppercase">{selectedBet}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="px-4 mt-4 pb-6">
        <div className="bg-[#16213e] rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3 text-gray-400">Recent Results</h3>
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {history.length === 0 ? (
              <div className="text-gray-500 text-xs">No results yet...</div>
            ) : (
              history.map((h, index) => (
                <div
                  key={h.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                    index === 0 ? 'scale-110 ring-2 ring-white/50' : ''
                  } ${
                    h.winner === 'dragon' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : h.winner === 'tiger' 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                        : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}
                >
                  {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : '='} 
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragonTigerGame;
