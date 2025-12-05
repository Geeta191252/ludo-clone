import React, { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, User } from 'lucide-react';

interface DragonTigerGameProps {
  onClose: () => void;
}

interface BetHistory {
  id: number;
  winner: 'dragon' | 'tiger' | 'tie';
}

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000];

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(10000);
  const [selectedChip, setSelectedChip] = useState(10);
  const [dragonBet, setDragonBet] = useState(0);
  const [tigerBet, setTigerBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [dragonCard, setDragonCard] = useState<{ value: string; suit: string; numValue: number } | null>(null);
  const [tigerCard, setTigerCard] = useState<{ value: string; suit: string; numValue: number } | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<BetHistory[]>([
    { id: 1, winner: 'tiger' }, { id: 2, winner: 'dragon' }, { id: 3, winner: 'dragon' },
    { id: 4, winner: 'tiger' }, { id: 5, winner: 'dragon' }, { id: 6, winner: 'tiger' },
    { id: 7, winner: 'tie' }, { id: 8, winner: 'dragon' }, { id: 9, winner: 'tiger' },
    { id: 10, winner: 'tiger' }, { id: 11, winner: 'dragon' }, { id: 12, winner: 'dragon' },
  ]);
  const [timer, setTimer] = useState(15);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'result'>('betting');
  const [winAmount, setWinAmount] = useState(0);

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

    setBalance(prev => prev - selectedChip);
    if (area === 'dragon') setDragonBet(prev => prev + selectedChip);
    else if (area === 'tiger') setTigerBet(prev => prev + selectedChip);
    else setTieBet(prev => prev + selectedChip);
  };

  const handleDeal = () => {
    if (gamePhase !== 'betting') return;
    setGamePhase('dealing');
    setShowResult(false);
    setWinner(null);
    setWinAmount(0);

    // Winner logic: Area with LEAST bets wins (house edge)
    let gameWinner: 'dragon' | 'tiger' | 'tie';
    
    if (dragonBet === 0 && tigerBet === 0 && tieBet === 0) {
      const allAreas: ('dragon' | 'tiger' | 'tie')[] = ['dragon', 'tiger', 'tie'];
      gameWinner = allAreas[Math.floor(Math.random() * 3)];
    } else {
      const bets = [
        { area: 'dragon' as const, amount: dragonBet },
        { area: 'tiger' as const, amount: tigerBet },
        { area: 'tie' as const, amount: tieBet }
      ];
      bets.sort((a, b) => a.amount - b.amount);
      const lowestAmount = bets[0].amount;
      const lowestBets = bets.filter(b => b.amount === lowestAmount);
      gameWinner = lowestBets[Math.floor(Math.random() * lowestBets.length)].area;
    }

    // Generate cards matching winner
    const generateCards = () => {
      let dragonValue: number, tigerValue: number;
      
      if (gameWinner === 'dragon') {
        dragonValue = 7 + Math.floor(Math.random() * 6);
        tigerValue = Math.floor(Math.random() * dragonValue);
      } else if (gameWinner === 'tiger') {
        tigerValue = 7 + Math.floor(Math.random() * 6);
        dragonValue = Math.floor(Math.random() * tigerValue);
      } else {
        dragonValue = Math.floor(Math.random() * 13);
        tigerValue = dragonValue;
      }
      
      return {
        dragon: { value: CARD_VALUES[dragonValue], suit: CARD_SUITS[Math.floor(Math.random() * 4)], numValue: dragonValue + 1 },
        tiger: { value: CARD_VALUES[tigerValue], suit: CARD_SUITS[Math.floor(Math.random() * 4)], numValue: tigerValue + 1 }
      };
    };

    const cards = generateCards();
    
    setTimeout(() => {
      setDragonCard(cards.dragon);
    }, 500);
    
    setTimeout(() => {
      setTigerCard(cards.tiger);
    }, 1000);

    setTimeout(() => {
      setWinner(gameWinner);
      setShowResult(true);
      setGamePhase('result');
      
      // Calculate winnings
      let win = 0;
      if (gameWinner === 'dragon' && dragonBet > 0) {
        win = dragonBet * 2;
      } else if (gameWinner === 'tiger' && tigerBet > 0) {
        win = tigerBet * 2;
      } else if (gameWinner === 'tie' && tieBet > 0) {
        win = tieBet * 9;
      }
      
      setWinAmount(win);
      setBalance(prev => prev + win);
      setHistory(prev => [{ id: Date.now(), winner: gameWinner }, ...prev.slice(0, 19)]);
    }, 2000);

    setTimeout(() => {
      resetRound();
    }, 5000);
  };

  const resetRound = () => {
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);
    setShowResult(false);
    setDragonBet(0);
    setTigerBet(0);
    setTieBet(0);
    setWinAmount(0);
    setTimer(15);
    setGamePhase('betting');
  };

  const getHistoryColor = (w: string) => {
    if (w === 'dragon') return 'bg-blue-600';
    if (w === 'tiger') return 'bg-amber-600';
    return 'bg-green-600';
  };

  const getHistoryLetter = (w: string) => {
    if (w === 'dragon') return 'D';
    if (w === 'tiger') return 'T';
    return 'T';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#16213e] to-[#0d1b2a] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-purple-500/30">
        <button onClick={onClose} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Dragon Tiger
          </span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full">
          <span className="text-yellow-400 font-bold">₹{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* History Row */}
      <div className="p-2 bg-black/30">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {history.slice(0, 15).map((h, idx) => (
            <div
              key={h.id}
              className={`w-7 h-7 rounded-full ${getHistoryColor(h.winner)} flex items-center justify-center text-xs font-bold flex-shrink-0`}
            >
              {getHistoryLetter(h.winner)}
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="p-3">
        {/* Cards Display */}
        <div className="flex justify-center gap-12 mb-4">
          {/* Dragon Card */}
          <div className="text-center">
            <div className="text-blue-400 font-bold text-lg mb-2">DRAGON</div>
            <div className={`w-20 h-28 rounded-lg flex items-center justify-center text-2xl font-bold
              ${dragonCard ? 'bg-white' : 'bg-gradient-to-br from-blue-600 to-blue-800'} 
              border-2 ${winner === 'dragon' && showResult ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-blue-400/50'}
              transition-all duration-500`}>
              {dragonCard ? (
                <span className={dragonCard.suit === '♥' || dragonCard.suit === '♦' ? 'text-red-500' : 'text-black'}>
                  {dragonCard.value}{dragonCard.suit}
                </span>
              ) : (
                <span className="text-blue-300/50">?</span>
              )}
            </div>
            {dragonCard && (
              <div className="mt-1 text-blue-400 font-bold">{dragonCard.numValue}</div>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-yellow-500">VS</div>
            {gamePhase === 'betting' && (
              <div className={`mt-2 text-2xl font-bold ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {timer}s
              </div>
            )}
            {gamePhase === 'dealing' && (
              <div className="mt-2 text-lg text-yellow-400 animate-pulse">Dealing...</div>
            )}
          </div>

          {/* Tiger Card */}
          <div className="text-center">
            <div className="text-amber-400 font-bold text-lg mb-2">TIGER</div>
            <div className={`w-20 h-28 rounded-lg flex items-center justify-center text-2xl font-bold
              ${tigerCard ? 'bg-white' : 'bg-gradient-to-br from-amber-600 to-amber-800'} 
              border-2 ${winner === 'tiger' && showResult ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-amber-400/50'}
              transition-all duration-500`}>
              {tigerCard ? (
                <span className={tigerCard.suit === '♥' || tigerCard.suit === '♦' ? 'text-red-500' : 'text-black'}>
                  {tigerCard.value}{tigerCard.suit}
                </span>
              ) : (
                <span className="text-amber-300/50">?</span>
              )}
            </div>
            {tigerCard && (
              <div className="mt-1 text-amber-400 font-bold">{tigerCard.numValue}</div>
            )}
          </div>
        </div>

        {/* Winner Display */}
        {showResult && (
          <div className="mb-4 text-center animate-bounce">
            <div className={`inline-block px-6 py-3 rounded-lg text-xl font-bold
              ${winner === 'dragon' ? 'bg-blue-600' : winner === 'tiger' ? 'bg-amber-600' : 'bg-green-600'}`}>
              {winner === 'dragon' ? 'DRAGON WINS!' : winner === 'tiger' ? 'TIGER WINS!' : 'TIE!'}
            </div>
            {winAmount > 0 && (
              <div className="mt-2 text-2xl font-bold text-yellow-400">
                +₹{winAmount.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Betting Table */}
        <div className="bg-gradient-to-b from-[#0d3320] to-[#0a2818] rounded-xl p-4 border border-green-800/50">
          <div className="grid grid-cols-3 gap-2">
            {/* Dragon Bet Area */}
            <button
              onClick={() => placeBet('dragon')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-4 rounded-lg transition-all
                ${winner === 'dragon' && showResult 
                  ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 animate-pulse' 
                  : 'bg-gradient-to-b from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800'}
                ${gamePhase !== 'betting' ? 'opacity-60' : ''}`}
            >
              <div className="text-center">
                <div className="text-lg font-bold mb-1">Dragon</div>
                <div className="text-sm text-blue-200">1:1</div>
                {dragonBet > 0 && (
                  <div className="mt-2 bg-black/50 rounded-full px-3 py-1 text-yellow-400 font-bold">
                    ₹{dragonBet}
                  </div>
                )}
              </div>
            </button>

            {/* Tie Bet Area */}
            <button
              onClick={() => placeBet('tie')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-4 rounded-lg transition-all
                ${winner === 'tie' && showResult 
                  ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 animate-pulse' 
                  : 'bg-gradient-to-b from-green-700 to-green-900 hover:from-green-600 hover:to-green-800'}
                ${gamePhase !== 'betting' ? 'opacity-60' : ''}`}
            >
              <div className="text-center">
                <div className="text-lg font-bold mb-1">Tie</div>
                <div className="text-sm text-green-200">1:8</div>
                {tieBet > 0 && (
                  <div className="mt-2 bg-black/50 rounded-full px-3 py-1 text-yellow-400 font-bold">
                    ₹{tieBet}
                  </div>
                )}
              </div>
            </button>

            {/* Tiger Bet Area */}
            <button
              onClick={() => placeBet('tiger')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-4 rounded-lg transition-all
                ${winner === 'tiger' && showResult 
                  ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 animate-pulse' 
                  : 'bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800'}
                ${gamePhase !== 'betting' ? 'opacity-60' : ''}`}
            >
              <div className="text-center">
                <div className="text-lg font-bold mb-1">Tiger</div>
                <div className="text-sm text-amber-200">1:1</div>
                {tigerBet > 0 && (
                  <div className="mt-2 bg-black/50 rounded-full px-3 py-1 text-yellow-400 font-bold">
                    ₹{tigerBet}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Chip Selection */}
        <div className="mt-4">
          <div className="flex justify-center gap-2 flex-wrap">
            {CHIP_VALUES.map(value => (
              <button
                key={value}
                onClick={() => setSelectedChip(value)}
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold
                  transition-all border-2 border-white/30
                  ${selectedChip === value 
                    ? 'ring-2 ring-yellow-400 scale-110' 
                    : 'hover:scale-105'}
                  ${value === 10 ? 'bg-gradient-to-b from-gray-500 to-gray-700' :
                    value === 50 ? 'bg-gradient-to-b from-green-500 to-green-700' :
                    value === 100 ? 'bg-gradient-to-b from-blue-500 to-blue-700' :
                    value === 500 ? 'bg-gradient-to-b from-pink-500 to-pink-700' :
                    value === 1000 ? 'bg-gradient-to-b from-yellow-500 to-yellow-700' :
                    'bg-gradient-to-b from-orange-500 to-orange-700'}`}
              >
                <span className="text-white">{value >= 1000 ? `${value/1000}K` : value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Game Stats */}
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-400">
            <User className="w-4 h-4" />
            <span>1,234 players</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>Round #4521</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragonTigerGame;
