import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Plus } from 'lucide-react';

interface DragonTigerGameProps {
  onClose: () => void;
}

interface BetHistory {
  id: number;
  winner: 'dragon' | 'tiger' | 'tie';
}

interface PlacedChip {
  id: number;
  value: number;
  x: number;
  y: number;
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

const CHIP_VALUES = [1, 10, 100, 1000, 5000];
const CHIP_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'from-gray-400 to-gray-500', border: 'border-gray-300', text: 'text-gray-800' },
  10: { bg: 'from-green-500 to-green-600', border: 'border-green-400', text: 'text-white' },
  100: { bg: 'from-yellow-500 to-yellow-600', border: 'border-yellow-400', text: 'text-yellow-900' },
  1000: { bg: 'from-purple-500 to-purple-600', border: 'border-purple-400', text: 'text-white' },
  5000: { bg: 'from-orange-500 to-orange-600', border: 'border-orange-400', text: 'text-white' },
};

const Chip: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; selected?: boolean }> = ({ 
  value, size = 'md', onClick, selected 
}) => {
  const colors = CHIP_COLORS[value];
  const sizeClasses = {
    sm: 'w-8 h-8 text-[8px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-14 h-14 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-b ${colors.bg} ${colors.border} border-4 
        flex flex-col items-center justify-center font-bold shadow-lg transition-all
        ${selected ? 'ring-4 ring-white scale-110' : ''} 
        ${onClick ? 'hover:scale-105 active:scale-95' : ''}`}
    >
      <span className={colors.text}>{value >= 1000 ? `${value/1000}K` : value}</span>
      <span className={`${colors.text} text-[6px] opacity-70`}>CHIP</span>
    </button>
  );
};

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(10000);
  const [selectedChip, setSelectedChip] = useState(10);
  const [dragonBets, setDragonBets] = useState<PlacedChip[]>([]);
  const [tigerBets, setTigerBets] = useState<PlacedChip[]>([]);
  const [tieBets, setTieBets] = useState<PlacedChip[]>([]);
  const [dragonCard, setDragonCard] = useState<{ suit: string; value: string; numValue: number } | null>(null);
  const [tigerCard, setTigerCard] = useState<{ suit: string; value: string; numValue: number } | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<BetHistory[]>([]);
  const [timer, setTimer] = useState(15);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'result'>('betting');

  const dragonTotal = dragonBets.reduce((sum, chip) => sum + chip.value, 0);
  const tigerTotal = tigerBets.reduce((sum, chip) => sum + chip.value, 0);
  const tieTotal = tieBets.reduce((sum, chip) => sum + chip.value, 0);

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

  const placeBet = (area: 'dragon' | 'tiger' | 'tie') => {
    if (gamePhase !== 'betting' || balance < selectedChip) return;

    const newChip: PlacedChip = {
      id: Date.now() + Math.random(),
      value: selectedChip,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
    };

    setBalance(prev => prev - selectedChip);

    if (area === 'dragon') {
      setDragonBets(prev => [...prev, newChip]);
    } else if (area === 'tiger') {
      setTigerBets(prev => [...prev, newChip]);
    } else {
      setTieBets(prev => [...prev, newChip]);
    }
  };

  const handleDeal = () => {
    if (gamePhase !== 'betting') return;
    
    setGamePhase('dealing');
    setShowResult(false);
    setWinner(null);

    setTimeout(() => {
      const dragon = getRandomCard();
      setDragonCard(dragon);

      setTimeout(() => {
        const tiger = getRandomCard();
        setTigerCard(tiger);

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
          let winnings = 0;
          if (gameWinner === 'dragon') {
            winnings = dragonTotal * 2;
          } else if (gameWinner === 'tiger') {
            winnings = tigerTotal * 2;
          } else {
            winnings = tieTotal * 8;
          }
          
          if (winnings > 0) {
            setBalance(prev => prev + winnings);
          }

          setHistory(prev => [{ id: Date.now(), winner: gameWinner }, ...prev.slice(0, 19)]);

          setTimeout(() => {
            setDragonCard(null);
            setTigerCard(null);
            setDragonBets([]);
            setTigerBets([]);
            setTieBets([]);
            setShowResult(false);
            setWinner(null);
            setTimer(15);
            setGamePhase('betting');
          }, 4000);
        }, 500);
      }, 800);
    }, 500);
  };

  const handleRebet = () => {
    // Simple rebet - not implemented fully
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a30] via-[#0d1a35] to-[#0a1525] text-white overflow-hidden">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-b from-[#1a2a4a] to-transparent">
        {/* Back button */}
        <button onClick={onClose} className="absolute left-2 top-2 z-20 p-2 bg-black/50 rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* Add Cash & Bonus */}
        <div className="absolute right-2 top-2 flex flex-col gap-1 z-20">
          <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-full text-xs font-bold">
            <Plus className="w-3 h-3" /> Add Cash
          </button>
          <div className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold text-center">
            Bonus 0%
          </div>
        </div>

        {/* Dragon & Tiger with Cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Dragon Side */}
          <div className="relative">
            <div className="text-6xl filter drop-shadow-lg">🐉</div>
            {winner === 'dragon' && (
              <div className="absolute -top-2 -left-2 bg-red-600 px-2 py-0.5 rounded text-xs font-bold animate-bounce">
                WINNER
              </div>
            )}
          </div>

          {/* Dragon Card */}
          <div className={`w-16 h-20 rounded-lg mx-2 flex items-center justify-center transition-all duration-500 ${
            dragonCard 
              ? `bg-gradient-to-br from-red-700 to-red-900 shadow-xl ${winner === 'dragon' ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`
              : 'bg-gradient-to-br from-red-800 to-red-950 border border-red-600'
          }`}>
            {dragonCard ? (
              <div className="text-white text-center">
                <div className="text-xl font-bold">{dragonCard.value}</div>
                <div className={`text-lg ${dragonCard.suit === '♥' || dragonCard.suit === '♦' ? 'text-red-300' : 'text-white'}`}>
                  {dragonCard.suit}
                </div>
              </div>
            ) : (
              <div className="text-3xl">🐉</div>
            )}
          </div>

          {/* VS */}
          <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-[#2a3a5a] to-[#1a2a4a] border-2 border-[#3a4a6a] flex items-center justify-center mx-2 shadow-xl">
            <span className="text-2xl font-black text-yellow-400">VS</span>
          </div>

          {/* Tiger Card */}
          <div className={`w-16 h-20 rounded-lg mx-2 flex items-center justify-center transition-all duration-500 ${
            tigerCard 
              ? `bg-gradient-to-br from-red-700 to-red-900 shadow-xl ${winner === 'tiger' ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`
              : 'bg-gradient-to-br from-red-800 to-red-950 border border-red-600'
          }`}>
            {tigerCard ? (
              <div className="text-white text-center">
                <div className="text-xl font-bold">{tigerCard.value}</div>
                <div className={`text-lg ${tigerCard.suit === '♥' || tigerCard.suit === '♦' ? 'text-red-300' : 'text-white'}`}>
                  {tigerCard.suit}
                </div>
              </div>
            ) : (
              <div className="text-3xl">🐅</div>
            )}
          </div>

          {/* Tiger Side */}
          <div className="relative">
            <div className="text-6xl filter drop-shadow-lg">🐅</div>
            {winner === 'tiger' && (
              <div className="absolute -top-2 -right-2 bg-green-600 px-2 py-0.5 rounded text-xs font-bold animate-bounce">
                LUCKY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Bar */}
      <div className="px-2 py-1 bg-[#1a2a4a]/80">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button className="flex-shrink-0 p-1.5 bg-[#2a3a5a] rounded">
            <TrendingUp className="w-4 h-4" />
          </button>
          {history.length === 0 ? (
            <span className="text-gray-500 text-xs px-2">No history</span>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                  h.winner === 'dragon' 
                    ? 'bg-blue-600' 
                    : h.winner === 'tiger' 
                      ? 'bg-orange-500' 
                      : 'bg-green-500'
                }`}
              >
                {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : 'Tie'} 
              </div>
            ))
          )}
        </div>
      </div>

      {/* Betting Table */}
      <div className="px-2 py-2">
        <div className="bg-gradient-to-b from-[#3d2810] to-[#2a1a08] rounded-xl p-2 border-4 border-[#5a3a15] shadow-2xl">
          {/* Betting Timer */}
          <div className="text-center mb-2">
            <span className={`px-4 py-1 rounded-full text-sm font-bold ${
              gamePhase === 'betting' 
                ? timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600'
                : 'bg-yellow-600'
            }`}>
              {gamePhase === 'betting' ? `Bet time... ${timer}` : gamePhase === 'dealing' ? 'Dealing...' : 'Result'}
            </span>
          </div>

          {/* Three Betting Areas */}
          <div className="grid grid-cols-3 gap-2 h-40">
            {/* Dragon Area */}
            <div 
              onClick={() => placeBet('dragon')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'
              } ${winner === 'dragon' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
              style={{ background: 'linear-gradient(180deg, #4a5a8a 0%, #3a4a7a 100%)' }}
            >
              {/* Total */}
              <div className="absolute top-1 left-0 right-0 flex justify-between px-2 text-xs">
                <span className="bg-black/50 px-2 rounded">{dragonTotal}</span>
                <span className="bg-black/50 px-2 rounded">0</span>
              </div>
              
              {/* Chips */}
              <div className="absolute inset-0 overflow-hidden">
                {dragonBets.map((chip) => (
                  <div
                    key={chip.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
                  >
                    <Chip value={chip.value} size="sm" />
                  </div>
                ))}
              </div>
              
              {/* Label */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-blue-700 px-3 py-0.5 rounded text-xs font-bold">
                DRAGON
              </div>
            </div>

            {/* Tie Area */}
            <div 
              onClick={() => placeBet('tie')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'
              } ${winner === 'tie' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
              style={{ background: 'linear-gradient(180deg, #2a6a3a 0%, #1a5a2a 100%)' }}
            >
              {/* Total */}
              <div className="absolute top-1 left-0 right-0 flex justify-between px-2 text-xs">
                <span className="bg-black/50 px-2 rounded">{tieTotal}</span>
                <span className="bg-black/50 px-2 rounded">0</span>
              </div>
              
              {/* Chips */}
              <div className="absolute inset-0 overflow-hidden">
                {tieBets.map((chip) => (
                  <div
                    key={chip.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
                  >
                    <Chip value={chip.value} size="sm" />
                  </div>
                ))}
              </div>
              
              {/* Label */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-green-700 px-3 py-0.5 rounded text-xs font-bold">
                TIE (8:1)
              </div>
            </div>

            {/* Tiger Area */}
            <div 
              onClick={() => placeBet('tiger')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'
              } ${winner === 'tiger' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
              style={{ background: 'linear-gradient(180deg, #8a5a3a 0%, #6a4a2a 100%)' }}
            >
              {/* Total */}
              <div className="absolute top-1 left-0 right-0 flex justify-between px-2 text-xs">
                <span className="bg-black/50 px-2 rounded">{tigerTotal}</span>
                <span className="bg-black/50 px-2 rounded">0</span>
              </div>
              
              {/* Chips */}
              <div className="absolute inset-0 overflow-hidden">
                {tigerBets.map((chip) => (
                  <div
                    key={chip.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
                  >
                    <Chip value={chip.value} size="sm" />
                  </div>
                ))}
              </div>
              
              {/* Label */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-orange-700 px-3 py-0.5 rounded text-xs font-bold">
                TIGER
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Popup */}
      {showResult && (dragonTotal > 0 || tigerTotal > 0 || tieTotal > 0) && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          {((winner === 'dragon' && dragonTotal > 0) || 
            (winner === 'tiger' && tigerTotal > 0) || 
            (winner === 'tie' && tieTotal > 0)) && (
            <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 px-8 py-4 rounded-2xl shadow-2xl animate-bounce border-4 border-yellow-300">
              <div className="text-black font-black text-2xl text-center">
                🎉 YOU WON! 🎉
                <div className="text-xl">
                  +₹{winner === 'dragon' ? dragonTotal * 2 : winner === 'tiger' ? tigerTotal * 2 : tieTotal * 8}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Chip Selection */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1a2e] to-transparent p-3">
        {/* Balance */}
        <div className="flex justify-between items-center mb-2 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <span className="text-xs">👤</span>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Balance</div>
              <div className="text-yellow-400 font-bold text-sm">₹{balance.toLocaleString()}</div>
            </div>
          </div>
          <button 
            onClick={handleRebet}
            className="bg-gradient-to-b from-red-500 to-red-700 px-6 py-2 rounded-full font-bold text-sm shadow-lg"
          >
            REBET
          </button>
        </div>

        {/* Chips */}
        <div className="flex justify-center items-center gap-2">
          {CHIP_VALUES.map((value) => (
            <Chip
              key={value}
              value={value}
              size="lg"
              selected={selectedChip === value}
              onClick={() => setSelectedChip(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DragonTigerGame;
