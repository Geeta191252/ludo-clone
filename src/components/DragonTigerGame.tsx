import React, { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, Plus } from 'lucide-react';
import dragonBettingImg from '@/assets/dragon-betting.jpg';
import tigerBettingImg from '@/assets/tiger-betting.jpg';
import tieBettingImg from '@/assets/tie-betting.jpg';

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

const getCardNumValue = (value: string): number => {
  return CARD_VALUES.indexOf(value) + 1;
};

const getRandomCard = () => {
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  return { value, numValue: getCardNumValue(value) };
};

const CHIP_VALUES = [1, 10, 100, 1000, 5000];

const ChipIcon: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; selected?: boolean }> = ({ 
  value, size = 'md', onClick, selected 
}) => {
  const getColors = () => {
    switch(value) {
      case 1: return { outer: '#6b7280', inner: '#4b5563', text: '#fff' };
      case 10: return { outer: '#22c55e', inner: '#16a34a', text: '#fff' };
      case 100: return { outer: '#eab308', inner: '#ca8a04', text: '#000' };
      case 1000: return { outer: '#a855f7', inner: '#9333ea', text: '#fff' };
      case 5000: return { outer: '#f97316', inner: '#ea580c', text: '#fff' };
      default: return { outer: '#6b7280', inner: '#4b5563', text: '#fff' };
    }
  };

  const colors = getColors();
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };
  const fontSizes = {
    sm: 'text-[7px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full relative flex items-center justify-center transition-all
        ${selected ? 'ring-4 ring-white scale-110 z-10' : ''} 
        ${onClick ? 'hover:scale-105 active:scale-95' : ''}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${colors.outer}, ${colors.inner})`,
        boxShadow: `0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)`,
        border: `3px solid ${colors.outer}`,
      }}
    >
      <div className="absolute inset-1 rounded-full border-2 border-white/30"></div>
      <div className={`${fontSizes[size]} font-bold flex flex-col items-center leading-tight`} style={{ color: colors.text }}>
        <span>{value >= 1000 ? value/1000 : value}</span>
        <span className="text-[5px] opacity-70">{value >= 1000 ? 'K' : 'CHIP'}</span>
      </div>
    </button>
  );
};

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(10000);
  const [selectedChip, setSelectedChip] = useState(10);
  const [dragonBets, setDragonBets] = useState<PlacedChip[]>([]);
  const [tigerBets, setTigerBets] = useState<PlacedChip[]>([]);
  const [tieBets, setTieBets] = useState<PlacedChip[]>([]);
  const [dragonCard, setDragonCard] = useState<{ value: string; numValue: number } | null>(null);
  const [tigerCard, setTigerCard] = useState<{ value: string; numValue: number } | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<BetHistory[]>([
    { id: 1, winner: 'dragon' }, { id: 2, winner: 'tie' }, { id: 3, winner: 'dragon' },
    { id: 4, winner: 'tiger' }, { id: 5, winner: 'tiger' }, { id: 6, winner: 'tiger' },
    { id: 7, winner: 'tiger' }, { id: 8, winner: 'dragon' }, { id: 9, winner: 'tiger' },
    { id: 10, winner: 'tie' }, { id: 11, winner: 'tiger' }, { id: 12, winner: 'dragon' },
  ]);
  const [timer, setTimer] = useState(15);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'result'>('betting');

  const dragonTotal = dragonBets.reduce((sum, chip) => sum + chip.value, 0);
  const tigerTotal = tigerBets.reduce((sum, chip) => sum + chip.value, 0);
  const tieTotal = tieBets.reduce((sum, chip) => sum + chip.value, 0);

  useEffect(() => {
    if (gamePhase === 'betting' && timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
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
      x: 15 + Math.random() * 70,
      y: 25 + Math.random() * 50,
    };

    setBalance(prev => prev - selectedChip);

    if (area === 'dragon') setDragonBets(prev => [...prev, newChip]);
    else if (area === 'tiger') setTigerBets(prev => [...prev, newChip]);
    else setTieBets(prev => [...prev, newChip]);
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
          if (dragon.numValue > tiger.numValue) gameWinner = 'dragon';
          else if (tiger.numValue > dragon.numValue) gameWinner = 'tiger';
          else gameWinner = 'tie';

          setWinner(gameWinner);
          setShowResult(true);
          setGamePhase('result');

          let winnings = 0;
          if (gameWinner === 'dragon') winnings = dragonTotal * 2;
          else if (gameWinner === 'tiger') winnings = tigerTotal * 2;
          else winnings = tieTotal * 8;
          
          if (winnings > 0) setBalance(prev => prev + winnings);
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

  return (
    <div 
      className="min-h-screen text-white relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)'
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 top-0 w-40 h-40 opacity-30">
          <div className="text-8xl transform -rotate-12">🐉</div>
        </div>
        <div className="absolute right-0 top-0 w-40 h-40 opacity-30">
          <div className="text-8xl transform rotate-12">🐅</div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-2">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
            <span className="text-lg">₹</span> Add Cash
          </button>
          <div className="bg-gradient-to-b from-green-500 to-green-700 px-3 py-1.5 rounded-lg">
            <div className="text-[10px] text-green-200">Bonus</div>
            <div className="text-xs font-bold">0%</div>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="relative z-10 flex items-center justify-center py-2 px-4">
        {/* Dragon Side */}
        <div className="relative">
          {winner === 'dragon' && showResult && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse z-20">
              WINNER
            </div>
          )}
          <div className="text-5xl filter drop-shadow-2xl">🐉</div>
        </div>

        {/* Dragon Card */}
        <div className={`w-14 h-20 rounded-lg mx-3 flex items-center justify-center shadow-2xl transition-all duration-300 ${
          winner === 'dragon' && showResult ? 'ring-4 ring-yellow-400 scale-110' : ''
        }`}
        style={{ 
          background: 'linear-gradient(135deg, #8b0000 0%, #5c0000 100%)',
          border: '2px solid #ff4444'
        }}>
          {dragonCard ? (
            <span className="text-white text-2xl font-bold">{dragonCard.value}</span>
          ) : (
            <div className="text-3xl opacity-80">🐉</div>
          )}
        </div>

        {/* VS */}
        <div className="w-12 h-12 rounded-md flex items-center justify-center mx-2"
          style={{ 
            background: 'linear-gradient(180deg, #1a3a5c 0%, #0d2840 100%)',
            border: '2px solid #2a4a6c'
          }}>
          <span className="text-xl font-black bg-gradient-to-b from-yellow-300 to-yellow-600 bg-clip-text text-transparent">VS</span>
        </div>

        {/* Tiger Card */}
        <div className={`w-14 h-20 rounded-lg mx-3 flex items-center justify-center shadow-2xl transition-all duration-300 ${
          winner === 'tiger' && showResult ? 'ring-4 ring-yellow-400 scale-110' : ''
        }`}
        style={{ 
          background: 'linear-gradient(135deg, #8b0000 0%, #5c0000 100%)',
          border: '2px solid #ff4444'
        }}>
          {tigerCard ? (
            <span className="text-white text-2xl font-bold">{tigerCard.value}</span>
          ) : (
            <div className="text-3xl opacity-80">🐅</div>
          )}
        </div>

        {/* Tiger Side */}
        <div className="relative">
          {winner === 'tiger' && showResult && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-500 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse z-20">
              LUCKY
            </div>
          )}
          <div className="text-5xl filter drop-shadow-2xl">🐅</div>
        </div>
      </div>

      {/* History Bar */}
      <div className="relative z-10 px-2 py-1">
        <div className="flex items-center gap-1 overflow-x-auto bg-black/30 rounded-lg p-1">
          <button className="flex-shrink-0 w-8 h-8 bg-[#1a2a4a] rounded-md flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </button>
          {history.map((h, i) => (
            <div
              key={h.id + '-' + i}
              className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] ${
                h.winner === 'dragon' ? 'bg-blue-600' : h.winner === 'tiger' ? 'bg-orange-500' : 'bg-green-500'
              }`}
            >
              {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : 'Tie'}
            </div>
          ))}
          <div className="flex-shrink-0 px-2 py-1 bg-purple-600 rounded-md text-[10px] font-bold flex items-center gap-1">
            NEW <TrendingUp className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Betting Table */}
      <div className="relative z-10 px-2 py-2">
        <div className="rounded-xl p-2 relative"
          style={{ 
            background: 'linear-gradient(180deg, #4a3520 0%, #3a2815 50%, #2a1a0a 100%)',
            border: '4px solid #6a4a25',
            boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)'
          }}>
          
          {/* Timer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className={`px-4 py-1 rounded-full text-sm font-bold ${
              gamePhase === 'betting' 
                ? timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600'
                : 'bg-yellow-600'
            }`}>
              {gamePhase === 'betting' ? `Bet time... ${timer}` : gamePhase === 'dealing' ? 'Dealing...' : 'Result'}
            </div>
          </div>

          {/* Three Betting Areas */}
          <div className="grid grid-cols-3 gap-2 h-40">
            {/* Dragon Bet Area */}
            <div 
              onClick={() => placeBet('dragon')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-95'
              } ${winner === 'dragon' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <img 
                src={dragonBettingImg} 
                alt="Dragon" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 pt-10">
                {dragonBets.map((chip) => (
                  <div key={chip.id} className="absolute" style={{ left: `${chip.x}%`, top: `${chip.y}%` }}>
                    <ChipIcon value={chip.value} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tie Bet Area */}
            <div 
              onClick={() => placeBet('tie')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-95'
              } ${winner === 'tie' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <img 
                src={tieBettingImg} 
                alt="Tie" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 pt-10">
                {tieBets.map((chip) => (
                  <div key={chip.id} className="absolute" style={{ left: `${chip.x}%`, top: `${chip.y}%` }}>
                    <ChipIcon value={chip.value} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tiger Bet Area */}
            <div 
              onClick={() => placeBet('tiger')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-95'
              } ${winner === 'tiger' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <img 
                src={tigerBettingImg} 
                alt="Tiger" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 pt-10">
                {tigerBets.map((chip) => (
                  <div key={chip.id} className="absolute" style={{ left: `${chip.x}%`, top: `${chip.y}%` }}>
                    <ChipIcon value={chip.value} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Popup */}
      {showResult && (
        ((winner === 'dragon' && dragonTotal > 0) || 
         (winner === 'tiger' && tigerTotal > 0) || 
         (winner === 'tie' && tieTotal > 0)) && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 px-8 py-4 rounded-2xl shadow-2xl animate-bounce border-4 border-yellow-300">
            <div className="text-black font-black text-2xl text-center">
              🎉 YOU WON! 🎉
              <div className="text-xl">
                +₹{winner === 'dragon' ? dragonTotal * 2 : winner === 'tiger' ? tigerTotal * 2 : tieTotal * 8}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Bottom Section - Player & Chips */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0a1628] via-[#0a1628] to-transparent pt-8 pb-3 px-2">
        {/* Player Info & Rebet */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 overflow-hidden border-2 border-yellow-400">
                <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 px-1.5 py-0.5 rounded text-[8px] font-bold">
                VIP 2
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Player...</div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">💰</span>
                <span className="text-yellow-400 font-bold text-sm">{balance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="bg-gradient-to-b from-red-500 to-red-700 px-8 py-2.5 rounded-full font-bold text-sm shadow-lg border-2 border-red-400">
            REBET
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-blue-300">
            <span className="text-lg">👥</span>
          </div>
        </div>

        {/* Chip Selection */}
        <div className="flex justify-center items-center gap-3 bg-black/40 rounded-full py-2 px-4">
          {CHIP_VALUES.map((value) => (
            <ChipIcon
              key={value}
              value={value}
              size="lg"
              selected={selectedChip === value}
              onClick={() => setSelectedChip(value)}
            />
          ))}
        </div>
      </div>

      {/* Side Players - Left */}
      <div className="fixed left-1 top-1/2 -translate-y-1/2 z-10 space-y-2">
        {[8, 7, 7].map((vip, i) => (
          <div key={i} className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 overflow-hidden border-2 border-gray-300">
              <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-500 px-1 py-0.5 rounded text-[7px] font-bold whitespace-nowrap">
              VIP {vip}
            </div>
          </div>
        ))}
      </div>

      {/* Side Players - Right */}
      <div className="fixed right-1 top-1/2 -translate-y-1/2 z-10 space-y-2">
        {[4, 4, 7].map((vip, i) => (
          <div key={i} className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 overflow-hidden border-2 border-gray-300">
              <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-500 px-1 py-0.5 rounded text-[7px] font-bold whitespace-nowrap">
              VIP {vip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DragonTigerGame;
