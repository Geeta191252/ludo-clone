import React, { useState, useEffect } from 'react';
import { X, Coins } from 'lucide-react';

interface DragonTigerGameProps {
  onClose: () => void;
}

interface BetHistory {
  id: number;
  winner: 'dragon' | 'tiger' | 'tie';
  dragonCard: { suit: string; value: string; numValue: number };
  tigerCard: { suit: string; value: string; numValue: number };
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
  const [isDealing, setIsDealing] = useState(false);
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
    setIsDealing(true);
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
              win = betAmount * 8; // 8x for tie
            } else {
              win = betAmount * 2; // 2x for dragon/tiger
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
            dragonCard: dragon,
            tigerCard: tiger
          }, ...prev.slice(0, 9)]);

          // Reset for next round
          setTimeout(() => {
            setIsDealing(false);
            setDragonCard(null);
            setTigerCard(null);
            setSelectedBet(null);
            setShowResult(false);
            setWinner(null);
            setTimer(15);
            setGamePhase('betting');
          }, 3000);
        }, 500);
      }, 800);
    }, 500);
  };

  const betOptions = [10, 50, 100, 500];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] to-[#0d0015] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-yellow-400">🐉 Dragon Tiger 🐅</h1>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-bold">₹{balance}</span>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center py-2">
        <div className={`inline-block px-6 py-2 rounded-full ${timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}>
          <span className="font-bold">{gamePhase === 'betting' ? `Bet Now: ${timer}s` : gamePhase === 'dealing' ? 'Dealing...' : 'Result'}</span>
        </div>
      </div>

      {/* Game Table */}
      <div className="p-4">
        <div className="bg-gradient-to-b from-green-900 to-green-950 rounded-2xl p-6 border-4 border-yellow-600/50 shadow-2xl">
          {/* Cards Area */}
          <div className="flex justify-around items-center mb-6">
            {/* Dragon Side */}
            <div className="text-center">
              <div className="text-2xl mb-2">🐉</div>
              <h3 className="text-lg font-bold text-blue-400 mb-3">DRAGON</h3>
              <div className={`w-20 h-28 rounded-lg flex items-center justify-center text-3xl font-bold transition-all duration-500 ${
                dragonCard 
                  ? `bg-white text-black ${winner === 'dragon' ? 'ring-4 ring-yellow-400 animate-pulse scale-110' : ''}`
                  : 'bg-blue-900/50 border-2 border-blue-400/50'
              }`}>
                {dragonCard ? (
                  <span className={dragonCard.suit === '♥' || dragonCard.suit === '♦' ? 'text-red-600' : 'text-black'}>
                    {dragonCard.value}{dragonCard.suit}
                  </span>
                ) : '?'}
              </div>
              {winner === 'dragon' && showResult && (
                <div className="mt-2 text-yellow-400 font-bold animate-bounce">🏆 WIN!</div>
              )}
            </div>

            {/* VS */}
            <div className="text-4xl font-bold text-yellow-400">VS</div>

            {/* Tiger Side */}
            <div className="text-center">
              <div className="text-2xl mb-2">🐅</div>
              <h3 className="text-lg font-bold text-orange-400 mb-3">TIGER</h3>
              <div className={`w-20 h-28 rounded-lg flex items-center justify-center text-3xl font-bold transition-all duration-500 ${
                tigerCard 
                  ? `bg-white text-black ${winner === 'tiger' ? 'ring-4 ring-yellow-400 animate-pulse scale-110' : ''}`
                  : 'bg-orange-900/50 border-2 border-orange-400/50'
              }`}>
                {tigerCard ? (
                  <span className={tigerCard.suit === '♥' || tigerCard.suit === '♦' ? 'text-red-600' : 'text-black'}>
                    {tigerCard.value}{tigerCard.suit}
                  </span>
                ) : '?'}
              </div>
              {winner === 'tiger' && showResult && (
                <div className="mt-2 text-yellow-400 font-bold animate-bounce">🏆 WIN!</div>
              )}
            </div>
          </div>

          {/* Win Popup */}
          {showResult && selectedBet === winner && winAmount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 px-8 py-4 rounded-2xl animate-bounce shadow-2xl">
                <div className="text-black font-bold text-2xl">🎉 YOU WON ₹{winAmount}! 🎉</div>
              </div>
            </div>
          )}

          {/* Betting Options */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => gamePhase === 'betting' && setSelectedBet('dragon')}
              disabled={gamePhase !== 'betting'}
              className={`p-4 rounded-xl font-bold transition-all ${
                selectedBet === 'dragon' 
                  ? 'bg-blue-600 ring-4 ring-yellow-400 scale-105' 
                  : 'bg-blue-900/70 hover:bg-blue-800'
              } ${gamePhase !== 'betting' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">🐉</div>
              <div>DRAGON</div>
              <div className="text-yellow-400 text-sm">1:1</div>
            </button>

            <button
              onClick={() => gamePhase === 'betting' && setSelectedBet('tie')}
              disabled={gamePhase !== 'betting'}
              className={`p-4 rounded-xl font-bold transition-all ${
                selectedBet === 'tie' 
                  ? 'bg-green-600 ring-4 ring-yellow-400 scale-105' 
                  : 'bg-green-900/70 hover:bg-green-800'
              } ${gamePhase !== 'betting' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">🤝</div>
              <div>TIE</div>
              <div className="text-yellow-400 text-sm">8:1</div>
            </button>

            <button
              onClick={() => gamePhase === 'betting' && setSelectedBet('tiger')}
              disabled={gamePhase !== 'betting'}
              className={`p-4 rounded-xl font-bold transition-all ${
                selectedBet === 'tiger' 
                  ? 'bg-orange-600 ring-4 ring-yellow-400 scale-105' 
                  : 'bg-orange-900/70 hover:bg-orange-800'
              } ${gamePhase !== 'betting' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-2xl mb-1">🐅</div>
              <div>TIGER</div>
              <div className="text-yellow-400 text-sm">1:1</div>
            </button>
          </div>

          {/* Bet Amount Selection */}
          <div className="mb-4">
            <div className="text-center text-sm text-gray-300 mb-2">Select Bet Amount</div>
            <div className="flex justify-center gap-3">
              {betOptions.map(amount => (
                <button
                  key={amount}
                  onClick={() => gamePhase === 'betting' && setBetAmount(amount)}
                  disabled={gamePhase !== 'betting'}
                  className={`px-4 py-2 rounded-full font-bold transition-all ${
                    betAmount === amount 
                      ? 'bg-yellow-500 text-black scale-110' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  } ${gamePhase !== 'betting' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Current Bet Display */}
          {selectedBet && (
            <div className="text-center text-yellow-400 font-bold">
              Your Bet: ₹{betAmount} on {selectedBet.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-3 text-yellow-400">Recent Results</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {history.length === 0 ? (
            <div className="text-gray-500 text-sm">No results yet...</div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  h.winner === 'dragon' 
                    ? 'bg-blue-600' 
                    : h.winner === 'tiger' 
                      ? 'bg-orange-600' 
                      : 'bg-green-600'
                }`}
              >
                {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : '='} 
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DragonTigerGame;
