import React, { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, User } from 'lucide-react';
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
  playerName?: string;
}

const PLAYER_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Neha', 'Vijay', 'Pooja', 'Raj', 'Simran',
  'Arjun', 'Anita', 'Deepak', 'Kavita', 'Suresh', 'Meena', 'Rohit', 'Sunita',
  'Lucky7', 'Winner99', 'GoldKing', 'RichBoy', 'ProPlayer', 'BetMaster'
];

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];

const getCardNumValue = (value: string): number => {
  return CARD_VALUES.indexOf(value) + 1;
};

const getRandomCard = () => {
  const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
  const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
  return { value, suit, numValue: getCardNumValue(value) };
};

const CHIP_VALUES = [1, 10, 100, 1000, 5000];

const ChipIcon: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; selected?: boolean }> = ({ 
  value, size = 'md', onClick, selected 
}) => {
  const getColors = () => {
    switch(value) {
      case 1: return { outer: '#6b7280', inner: '#4b5563', text: '#fff', ring: '#888' };
      case 10: return { outer: '#22c55e', inner: '#16a34a', text: '#fff', ring: '#4ade80' };
      case 100: return { outer: '#eab308', inner: '#ca8a04', text: '#000', ring: '#fde047' };
      case 1000: return { outer: '#a855f7', inner: '#9333ea', text: '#fff', ring: '#c084fc' };
      case 5000: return { outer: '#f97316', inner: '#ea580c', text: '#fff', ring: '#fb923c' };
      default: return { outer: '#6b7280', inner: '#4b5563', text: '#fff', ring: '#888' };
    }
  };

  const colors = getColors();
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };
  const fontSizes = {
    sm: 'text-[8px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full relative flex items-center justify-center transition-all
        ${selected ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''} 
        ${onClick ? 'hover:scale-105 active:scale-95' : ''}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${colors.outer}, ${colors.inner})`,
        boxShadow: `0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)`,
        border: `3px solid ${colors.ring}`,
      }}
    >
      <div className="absolute inset-1 rounded-full border-2 border-white/20"></div>
      <div className={`${fontSizes[size]} font-bold flex flex-col items-center leading-tight`} style={{ color: colors.text }}>
        <span>{value >= 1000 ? value/1000 : value}</span>
        <span className="text-[6px] opacity-80">CHIP</span>
      </div>
    </button>
  );
};

const PlayingCard: React.FC<{ value?: string; suit?: string; isGold?: boolean }> = ({ value, suit, isGold }) => {
  const isRed = suit === '♥' || suit === '♦';
  
  if (!value) {
    return (
      <div 
        className="w-16 h-22 rounded-lg flex items-center justify-center shadow-xl"
        style={{ 
          background: isGold 
            ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ff8800 100%)' 
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid rgba(255,255,255,0.3)'
        }}
      >
        <span className="text-3xl opacity-60">{isGold ? '♣' : '♣'}</span>
      </div>
    );
  }

  return (
    <div 
      className="w-16 h-22 rounded-lg flex flex-col items-center justify-center shadow-xl relative"
      style={{ 
        background: isGold 
          ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ff8800 100%)' 
          : 'white',
        border: '2px solid rgba(0,0,0,0.2)'
      }}
    >
      <span className={`text-2xl font-bold ${isGold ? 'text-black' : isRed ? 'text-red-600' : 'text-black'}`}>
        {value}
      </span>
      <span className={`text-xl ${isGold ? 'text-black' : isRed ? 'text-red-600' : 'text-black'}`}>
        {suit}
      </span>
    </div>
  );
};

const VIPPlayer: React.FC<{ vip: number; name: string; position: 'left' | 'right'; chip?: number }> = ({ vip, name, position, chip }) => (
  <div className="flex flex-col items-center">
    <div className="relative">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-pink-500 overflow-hidden border-2 border-white/50 shadow-lg">
        <div className="w-full h-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
      </div>
      {chip && (
        <div className="absolute -right-1 -bottom-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-[6px] font-bold border border-white">
            {chip >= 1000 ? `${chip/1000}K` : chip}
          </div>
        </div>
      )}
    </div>
    <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-2 py-0.5 rounded text-[8px] font-bold mt-1 shadow">
      VIP {vip}
    </div>
    <div className="text-[9px] text-gray-300 mt-0.5">{name}</div>
  </div>
);

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(10000);
  const [selectedChip, setSelectedChip] = useState(10);
  const [dragonBets, setDragonBets] = useState<PlacedChip[]>([]);
  const [tigerBets, setTigerBets] = useState<PlacedChip[]>([]);
  const [tieBets, setTieBets] = useState<PlacedChip[]>([]);
  const [botDragonBets, setBotDragonBets] = useState<PlacedChip[]>([]);
  const [botTigerBets, setBotTigerBets] = useState<PlacedChip[]>([]);
  const [botTieBets, setBotTieBets] = useState<PlacedChip[]>([]);
  const [dragonCard, setDragonCard] = useState<{ value: string; suit: string; numValue: number } | null>(null);
  const [tigerCard, setTigerCard] = useState<{ value: string; suit: string; numValue: number } | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<BetHistory[]>([
    { id: 1, winner: 'dragon' }, { id: 2, winner: 'dragon' }, { id: 3, winner: 'tiger' },
    { id: 4, winner: 'dragon' }, { id: 5, winner: 'tiger' }, { id: 6, winner: 'tiger' },
    { id: 7, winner: 'tie' }, { id: 8, winner: 'tie' }, { id: 9, winner: 'tie' },
    { id: 10, winner: 'tiger' }, { id: 11, winner: 'tiger' }, { id: 12, winner: 'dragon' },
    { id: 13, winner: 'tiger' }, { id: 14, winner: 'tiger' }, { id: 15, winner: 'tiger' },
  ]);
  const [timer, setTimer] = useState(15);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'result'>('betting');

  const dragonTotal = dragonBets.reduce((sum, chip) => sum + chip.value, 0);
  const tigerTotal = tigerBets.reduce((sum, chip) => sum + chip.value, 0);
  const tieTotal = tieBets.reduce((sum, chip) => sum + chip.value, 0);
  
  const botDragonTotal = botDragonBets.reduce((sum, chip) => sum + chip.value, 0);
  const botTigerTotal = botTigerBets.reduce((sum, chip) => sum + chip.value, 0);
  const botTieTotal = botTieBets.reduce((sum, chip) => sum + chip.value, 0);
  
  // Check if user has placed any bet
  const userHasBet = dragonBets.length > 0 || tigerBets.length > 0 || tieBets.length > 0;

  // Generate random bot chip with player name
  const generateBotChip = (): PlacedChip => ({
    id: Date.now() + Math.random(),
    value: CHIP_VALUES[Math.floor(Math.random() * CHIP_VALUES.length)],
    x: 10 + Math.random() * 80,
    y: 25 + Math.random() * 55,
    playerName: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
  });

  // Bot betting disabled - only real user bets will show

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
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
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

    // 50% user wins, 50% house wins logic
    let gameWinner: 'dragon' | 'tiger' | 'tie';
    
    // Find where user has placed bets
    const userBetAreas: ('dragon' | 'tiger' | 'tie')[] = [];
    if (dragonTotal > 0) userBetAreas.push('dragon');
    if (tigerTotal > 0) userBetAreas.push('tiger');
    if (tieTotal > 0) userBetAreas.push('tie');
    
    // Areas where user didn't bet
    const allAreas: ('dragon' | 'tiger' | 'tie')[] = ['dragon', 'tiger', 'tie'];
    const noUserBetAreas = allAreas.filter(area => !userBetAreas.includes(area));
    
    // 50% chance user wins, 50% house wins
    const userWins = Math.random() < 0.5;
    
    if (userBetAreas.length === 0) {
      // No bets placed - random winner
      gameWinner = allAreas[Math.floor(Math.random() * 3)];
    } else if (userWins && userBetAreas.length > 0) {
      // User wins - pick from areas where user bet
      gameWinner = userBetAreas[Math.floor(Math.random() * userBetAreas.length)];
    } else if (noUserBetAreas.length > 0) {
      // House wins - pick from areas where user didn't bet
      gameWinner = noUserBetAreas[Math.floor(Math.random() * noUserBetAreas.length)];
    } else {
      // User bet on all areas - random (rare case)
      gameWinner = allAreas[Math.floor(Math.random() * 3)];
    }

    // Generate cards that match the winner
    const generateMatchingCards = () => {
      let dragonCardValue: number;
      let tigerCardValue: number;
      
      if (gameWinner === 'dragon') {
        // Dragon wins - dragon card should be higher
        dragonCardValue = 7 + Math.floor(Math.random() * 6); // 7-12 (8 to K)
        tigerCardValue = Math.floor(Math.random() * dragonCardValue); // 0 to dragonCard-1
      } else if (gameWinner === 'tiger') {
        // Tiger wins - tiger card should be higher
        tigerCardValue = 7 + Math.floor(Math.random() * 6); // 7-12 (8 to K)
        dragonCardValue = Math.floor(Math.random() * tigerCardValue); // 0 to tigerCard-1
      } else {
        // Tie - same value
        dragonCardValue = Math.floor(Math.random() * 13);
        tigerCardValue = dragonCardValue;
      }
      
      return {
        dragon: {
          value: CARD_VALUES[dragonCardValue],
          suit: CARD_SUITS[Math.floor(Math.random() * 4)],
          numValue: dragonCardValue + 1
        },
        tiger: {
          value: CARD_VALUES[tigerCardValue],
          suit: CARD_SUITS[Math.floor(Math.random() * 4)],
          numValue: tigerCardValue + 1
        }
      };
    };

    const cards = generateMatchingCards();

    setTimeout(() => {
      setDragonCard(cards.dragon);

      setTimeout(() => {
        setTigerCard(cards.tiger);

        setTimeout(() => {
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
            setBotDragonBets([]);
            setBotTigerBets([]);
            setBotTieBets([]);
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
        background: 'linear-gradient(180deg, #0d1a2d 0%, #162236 50%, #0d1a2d 100%)'
      }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-2">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
            <span className="text-lg">₹</span> Add Cash
          </button>
          <div className="bg-gradient-to-b from-green-500 to-green-700 px-3 py-1.5 rounded-lg text-center">
            <div className="text-[10px] text-green-200">Bonus</div>
            <div className="text-sm font-bold text-yellow-300">0%</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 px-12">
        {/* Dragon & Tiger with Cards */}
        <div className="flex items-center justify-center gap-2 py-2">
          {/* Dragon Side */}
          <div className="relative flex-1 flex justify-end items-center">
            {winner === 'dragon' && showResult && (
              <div className="absolute -top-2 left-1/2 bg-gradient-to-r from-red-600 to-red-500 px-3 py-1 rounded text-xs font-bold animate-pulse z-20 shadow-lg">
                WINNER
              </div>
            )}
            <div className="text-7xl filter drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}>
              🐉
            </div>
          </div>

          {/* Dragon Card */}
          <div className={`transition-all duration-300 ${winner === 'dragon' && showResult ? 'scale-110' : ''}`}>
            <PlayingCard value={dragonCard?.value} suit={dragonCard?.suit} />
          </div>

          {/* VS Badge */}
          <div className="relative mx-2">
            <div 
              className="w-14 h-14 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(180deg, #ffa500 0%, #ff6600 50%, #cc4400 100%)',
                boxShadow: '0 0 20px rgba(255, 165, 0, 0.6)'
              }}
            >
              <span className="text-2xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>VS</span>
            </div>
          </div>

          {/* Tiger Card */}
          <div className={`transition-all duration-300 ${winner === 'tiger' && showResult ? 'scale-110' : ''}`}>
            <PlayingCard value={tigerCard?.value} suit={tigerCard?.suit} isGold />
          </div>

          {/* Tiger Side */}
          <div className="relative flex-1 flex justify-start items-center">
            {winner === 'tiger' && showResult && (
              <div className="absolute -top-2 right-1/2 bg-gradient-to-r from-green-600 to-green-500 px-3 py-1 rounded text-xs font-bold animate-pulse z-20 shadow-lg">
                LUCKY
              </div>
            )}
            <div className="text-7xl filter drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(249, 115, 22, 0.5)' }}>
              🐅
            </div>
          </div>
        </div>

        {/* History Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {history.map((h, i) => (
            <div
              key={h.id + '-' + i}
              className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] ${
                h.winner === 'dragon' ? 'bg-blue-600' : h.winner === 'tiger' ? 'bg-amber-600' : 'bg-green-500'
              }`}
            >
              {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : 'Tie'}
            </div>
          ))}
          <div className="flex-shrink-0 px-2 py-1 bg-yellow-500 rounded text-[10px] font-bold text-black">
            NEW
          </div>
          <button className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>

        {/* Betting Table */}
        <div 
          className="rounded-xl p-2 relative"
          style={{ 
            background: 'linear-gradient(180deg, #5a4030 0%, #4a3020 50%, #3a2010 100%)',
            border: '4px solid #7a5a35',
            boxShadow: '0 0 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.4)'
          }}
        >
          {/* Three Betting Areas */}
          <div className="grid grid-cols-3 gap-2 h-44">
            {/* Dragon Bet Area */}
            <div 
              onClick={() => placeBet('dragon')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-98'
              } ${winner === 'dragon' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <img src={dragonBettingImg} alt="Dragon" className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Bet amounts header */}
              <div className="absolute top-0 left-0 right-0 flex">
                <div className="flex-1 bg-black/70 text-center py-1 rounded-tl-lg">
                  <span className="text-xs font-bold">{(dragonTotal + botDragonTotal) || 63986}</span>
                </div>
                <div className="w-10 bg-black/50 text-center py-1 rounded-tr-lg">
                  <span className="text-xs font-bold text-yellow-400">{dragonTotal || 0}</span>
                </div>
              </div>
              
              {/* Bot Chips with player names */}
              <div className="absolute inset-0 pt-8 pointer-events-none">
                {botDragonBets.slice(-8).map((chip, idx) => (
                  <div 
                    key={chip.id} 
                    className="absolute animate-pulse" 
                    style={{ 
                      left: `${chip.x}%`, 
                      top: `${chip.y}%`,
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <div className="relative">
                      <ChipIcon value={chip.value} size="sm" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-black/80 px-1 rounded text-cyan-400 font-bold">
                          {chip.playerName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* User Chips */}
              <div className="absolute inset-0 pt-8 pointer-events-none">
                {dragonBets.map((chip) => (
                  <div key={chip.id} className="absolute z-10" style={{ left: `${chip.x}%`, top: `${chip.y}%` }}>
                    <div className="relative">
                      <ChipIcon value={chip.value} size="sm" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-yellow-500/90 px-1 rounded text-black font-bold">
                          You
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tie Bet Area */}
            <div 
              onClick={() => placeBet('tie')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-98'
              } ${winner === 'tie' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <img src={tieBettingImg} alt="Tie" className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Bet amounts header */}
              <div className="absolute top-0 left-0 right-0 flex">
                <div className="flex-1 bg-black/70 text-center py-1 rounded-tl-lg">
                  <span className="text-xs font-bold">{(tieTotal + botTieTotal) || 20286}</span>
                </div>
                <div className="w-10 bg-black/50 text-center py-1 rounded-tr-lg">
                  <span className="text-xs font-bold text-yellow-400">{tieTotal || 0}</span>
                </div>
              </div>
              
              {/* Timer in center */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                <div className={`px-4 py-1 rounded-full text-sm font-bold ${
                  gamePhase === 'betting' 
                    ? timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600'
                    : 'bg-yellow-600'
                }`}>
                  {gamePhase === 'betting' ? `Bet time... ${timer}` : gamePhase === 'dealing' ? 'Dealing...' : 'Result'}
                </div>
              </div>
              
              {/* Bot Chips with player names */}
              <div className="absolute inset-0 pt-8 pointer-events-none">
                {botTieBets.slice(-6).map((chip, idx) => (
                  <div 
                    key={chip.id} 
                    className="absolute animate-pulse" 
                    style={{ 
                      left: `${chip.x}%`, 
                      top: `${chip.y}%`,
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <div className="relative">
                      <ChipIcon value={chip.value} size="sm" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-black/80 px-1 rounded text-cyan-400 font-bold">
                          {chip.playerName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* User Chips */}
              <div className="absolute inset-0 pt-8 pointer-events-none">
                {tieBets.map((chip) => (
                  <div key={chip.id} className="absolute z-10" style={{ left: `${chip.x}%`, top: `${chip.y}%` }}>
                    <div className="relative">
                      <ChipIcon value={chip.value} size="sm" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-yellow-500/90 px-1 rounded text-black font-bold">
                          You
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiger Bet Area */}
            <div 
              onClick={() => placeBet('tiger')}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-98'
              } ${winner === 'tiger' && showResult ? 'ring-4 ring-yellow-400' : ''}`}
            >
              <img src={tigerBettingImg} alt="Tiger" className="absolute inset-0 w-full h-full object-cover" />
              
              {/* Bet amounts header */}
              <div className="absolute top-0 left-0 right-0 flex">
                <div className="flex-1 bg-black/70 text-center py-1 rounded-tl-lg">
                  <span className="text-xs font-bold">{(tigerTotal + botTigerTotal) || 99494}</span>
                </div>
                <div className="w-10 bg-black/50 text-center py-1 rounded-tr-lg">
                  <span className="text-xs font-bold text-yellow-400">{tigerTotal || 0}</span>
                </div>
              </div>
              
              {/* Bot Chips with player names */}
              <div className="absolute inset-0 pt-8 pointer-events-none">
                {botTigerBets.slice(-8).map((chip, idx) => (
                  <div 
                    key={chip.id} 
                    className="absolute animate-pulse" 
                    style={{ 
                      left: `${chip.x}%`, 
                      top: `${chip.y}%`,
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <div className="relative">
                      <ChipIcon value={chip.value} size="sm" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-black/80 px-1 rounded text-cyan-400 font-bold">
                          {chip.playerName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* User Chips */}
              <div className="absolute inset-0 pt-8 pointer-events-none">
                {tigerBets.map((chip) => (
                  <div key={chip.id} className="absolute z-10" style={{ left: `${chip.x}%`, top: `${chip.y}%` }}>
                    <div className="relative">
                      <ChipIcon value={chip.value} size="sm" />
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[8px] bg-yellow-500/90 px-1 rounded text-black font-bold">
                          You
                        </span>
                      </div>
                    </div>
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

      {/* Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0d1a2d] via-[#0d1a2d]/95 to-transparent pt-6 pb-4 px-4">
        <div className="flex items-center justify-between">
          {/* Player Info */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 overflow-hidden border-2 border-yellow-400 shadow-lg">
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 px-2 py-0.5 rounded text-[8px] font-bold">
                VIP 2
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Player...</div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-xs">₹</span>
                <span className="text-yellow-400 font-bold text-sm">{(balance * 0.000076).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-400 text-xs">🪙</span>
                <span className="text-orange-400 font-bold text-xs">{(balance * 0.000026).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Chip Selection */}
          <div className="flex items-center gap-2">
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

          {/* REBET Button */}
          <button className="bg-gradient-to-b from-amber-600 to-amber-800 px-6 py-3 rounded-lg font-bold text-sm shadow-lg border-2 border-amber-500">
            REBET
          </button>

          {/* Profile */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border-2 border-gray-500">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragonTigerGame;
