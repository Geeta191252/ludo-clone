import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Volume2, VolumeX, Users, Repeat } from 'lucide-react';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useGameSync } from '@/hooks/useGameSync';

interface DragonTigerGameProps {
  onClose: () => void;
  balance?: number;
  onBalanceChange?: (balance: number) => void;
}

interface BetHistory {
  id: number;
  winner: 'dragon' | 'tiger' | 'tie';
}

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CHIP_VALUES = [10, 50, 100, 500, 1000];

// Helper function to update balance on server
const updateServerBalance = async (amount: number, type: 'deduct' | 'add') => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    const mobile = userData.mobile;
    if (!mobile) return null;

    const response = await fetch('/api/update-balance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, amount, type })
    });
    const data = await response.json();
    if (data.status) {
      // Update localStorage with new balance
      userData.wallet_balance = data.wallet_balance;
      userData.winning_balance = data.winning_balance;
      localStorage.setItem('user', JSON.stringify(userData));
      return data.wallet_balance + data.winning_balance;
    }
    return null;
  } catch (error) {
    console.error('Error updating balance:', error);
    return null;
  }
};

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose, balance: externalBalance, onBalanceChange }) => {
  const [internalBalance, setInternalBalance] = useState(10000);
  const balance = externalBalance !== undefined ? externalBalance : internalBalance;
  
  const setBalance = (value: number | ((prev: number) => number)) => {
    const newBalance = typeof value === 'function' ? value(balance) : value;
    if (onBalanceChange) {
      onBalanceChange(newBalance);
    } else {
      setInternalBalance(newBalance);
    }
  };

  // Use game sync hook for real-time multiplayer
  const { gameState, liveBets: syncedBets, livePlayerCount } = useGameSync('dragon-tiger');
  const prevPhaseRef = useRef<string | null>(null);

  // Fetch fresh balance from server on mount
  useEffect(() => {
    const fetchFreshBalance = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) return;
        const userData = JSON.parse(user);
        if (!userData.mobile) return;
        
        const response = await fetch(`/api/get-balance.php?mobile=${userData.mobile}`);
        const data = await response.json();
        if (data.status) {
          const totalBalance = (data.wallet_balance || 0) + (data.winning_balance || 0);
          setBalance(totalBalance);
          // Update localStorage
          userData.wallet_balance = data.wallet_balance || 0;
          userData.winning_balance = data.winning_balance || 0;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    fetchFreshBalance();
  }, []);

  const [selectedChip, setSelectedChip] = useState(100);
  const [dragonBet, setDragonBet] = useState(0);
  const [tigerBet, setTigerBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);

  // Get synced state values from server
  const timer = gameState?.timer || 15;
  const gamePhase = (gameState?.phase || 'betting') as 'betting' | 'dealing' | 'result';
  const roundNumber = gameState?.round_number || 1;
  const winner = gameState?.winner as 'dragon' | 'tiger' | 'tie' | null;
  const showResult = gamePhase === 'result';
  const livePlayerCount2 = Math.max(livePlayerCount + 100, 200);
  
  // Get cards from server state
  const dragonCard = gameState?.dragon_card_value ? {
    value: gameState.dragon_card_value,
    suit: gameState.dragon_card_suit || '♠',
    numValue: CARD_VALUES.indexOf(gameState.dragon_card_value) + 1
  } : null;
  
  const tigerCard = gameState?.tiger_card_value ? {
    value: gameState.tiger_card_value,
    suit: gameState.tiger_card_suit || '♠',
    numValue: CARD_VALUES.indexOf(gameState.tiger_card_value) + 1
  } : null;

  // History from server
  const history = (gameState?.history || []) as { id: number; winner: 'dragon' | 'tiger' | 'tie' }[];

  const { playChipSound, playCardSound, playTickSound, playUrgentTickSound, playWinSound, playTigerRoarSound, playDragonRoarSound, playLoseSound } = useGameSounds();

  // Handle phase transitions for sounds and win calculation
  useEffect(() => {
    if (prevPhaseRef.current !== gamePhase) {
      if (gamePhase === 'dealing' && prevPhaseRef.current === 'betting') {
        if (!isMuted) playCardSound();
      } else if (gamePhase === 'result' && prevPhaseRef.current === 'dealing') {
        // Play winner sound
        if (!isMuted) {
          if (winner === 'tiger') playTigerRoarSound();
          else if (winner === 'dragon') playDragonRoarSound();
        }
        
        // Calculate win
        let win = 0;
        if (winner === 'dragon' && dragonBet > 0) {
          win = dragonBet * 2;
        } else if (winner === 'tiger' && tigerBet > 0) {
          win = tigerBet * 2;
        } else if (winner === 'tie' && tieBet > 0) {
          win = tieBet * 9;
        }
        
        setWinAmount(win);
        
        if (win > 0) {
          if (!isMuted) playWinSound();
          setShowWinPopup(true);
          updateServerBalance(win, 'add').then((newBalance) => {
            if (newBalance !== null) {
              setBalance(newBalance);
            } else {
              setBalance(prev => prev + win);
            }
          });
        } else if (dragonBet > 0 || tigerBet > 0 || tieBet > 0) {
          if (!isMuted) playLoseSound();
        }
      } else if (gamePhase === 'betting' && prevPhaseRef.current === 'result') {
        // New round - reset bets
        setDragonBet(0);
        setTigerBet(0);
        setTieBet(0);
        setWinAmount(0);
        setShowWinPopup(false);
      }
      prevPhaseRef.current = gamePhase;
    }
  }, [gamePhase, winner, dragonBet, tigerBet, tieBet, isMuted]);

  // Timer tick sound
  useEffect(() => {
    if (gamePhase === 'betting' && timer > 0) {
      if (!isMuted) {
        if (timer <= 5) playUrgentTickSound();
        else playTickSound();
      }
    }
  }, [timer, gamePhase, isMuted]);

  const placeBet = async (area: 'dragon' | 'tiger' | 'tie') => {
    if (gamePhase !== 'betting' || balance < selectedChip) return;

    if (!isMuted) playChipSound();
    
    // Update server balance
    const newBalance = await updateServerBalance(selectedChip, 'deduct');
    if (newBalance !== null) {
      setBalance(newBalance);
    } else {
      setBalance(prev => prev - selectedChip);
    }
    
    if (area === 'dragon') setDragonBet(prev => prev + selectedChip);
    else if (area === 'tiger') setTigerBet(prev => prev + selectedChip);
    else setTieBet(prev => prev + selectedChip);
  };

  const clearBets = async () => {
    if (gamePhase !== 'betting') return;
    const totalBet = dragonBet + tigerBet + tieBet;
    if (totalBet > 0) {
      // Refund bets to server
      const newBalance = await updateServerBalance(totalBet, 'add');
      if (newBalance !== null) {
        setBalance(newBalance);
      } else {
        setBalance(prev => prev + totalBet);
      }
    }
    setDragonBet(0);
    setTigerBet(0);
    setTieBet(0);
  };

  const getHistoryColor = (w: string) => {
    if (w === 'dragon') return 'bg-orange-500';
    if (w === 'tiger') return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getHistoryLetter = (w: string) => {
    if (w === 'dragon') return 'D';
    if (w === 'tiger') return 'T';
    return 'T';
  };

  // Timer circle progress
  const timerProgress = (timer / 15) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (timerProgress / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #ff6b00 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #0066ff 0%, transparent 50%)`
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-3 bg-gradient-to-r from-[#2d1f3d] to-[#1a2d4a]">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-wider">DRAGON TIGER</h1>
          <p className="text-xs text-gray-400">Round #{roundNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full bg-white/10">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Balance Bar */}
      <div className="relative z-10 flex justify-between items-center px-4 py-2 bg-black/30">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">{livePlayerCount2.toLocaleString()}</span>
            <span className="text-xs text-gray-500">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-1.5 rounded-full">
          <span className="text-sm font-bold">₹{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* History Row */}
      <div className="relative z-10 px-3 py-2 bg-black/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400">History</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {history.slice(0, 20).map((h) => (
            <div
              key={h.id}
              className={`w-6 h-6 rounded-full ${getHistoryColor(h.winner)} flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-lg`}
            >
              {getHistoryLetter(h.winner)}
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 flex-1 p-3">
        {/* Cards and Timer Section */}
        <div className="relative mb-4">
          {/* Timer Circle in Center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            {gamePhase === 'betting' && (
              <div className="relative">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="#1a1a2e"
                    stroke="#333"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={timer <= 5 ? '#ff4444' : '#00ff88'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {timer}
                </div>
              </div>
            )}
            {gamePhase === 'dealing' && (
              <div className="w-20 h-20 rounded-full bg-black/80 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
              </div>
            )}
            {showResult && (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-lg font-bold
                ${winner === 'dragon' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 
                  winner === 'tiger' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 
                  'bg-gradient-to-br from-green-500 to-green-700'} animate-bounce shadow-2xl`}>
                {winner === 'dragon' ? 'D' : winner === 'tiger' ? 'T' : 'TIE'}
              </div>
            )}
          </div>

          {/* Cards Display */}
          <div className="flex justify-between items-center px-2">
            {/* Dragon Side */}
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🐲</span>
                <span className="text-orange-400 font-bold text-lg">DRAGON</span>
              </div>
              <div className={`relative mx-auto w-16 h-22 rounded-lg overflow-hidden transform transition-all duration-500
                ${dragonCard ? 'rotate-0' : 'rotate-y-180'}
                ${winner === 'dragon' && showResult ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50 scale-110' : ''}`}>
                {dragonCard ? (
                  <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center shadow-xl">
                    <span className={`text-3xl font-bold ${dragonCard.suit === '♥' || dragonCard.suit === '♦' ? 'text-red-500' : 'text-black'}`}>
                      {dragonCard.value}
                    </span>
                    <span className={`text-xl ${dragonCard.suit === '♥' || dragonCard.suit === '♦' ? 'text-red-500' : 'text-black'}`}>
                      {dragonCard.suit}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-700 rounded-lg flex items-center justify-center border-2 border-orange-400/50">
                    <span className="text-3xl">🐲</span>
                  </div>
                )}
              </div>
              {dragonCard && (
                <div className="mt-2 text-orange-400 font-bold text-lg">{dragonCard.numValue}</div>
              )}
            </div>

            {/* Spacer for center timer */}
            <div className="w-24" />

            {/* Tiger Side */}
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-blue-400 font-bold text-lg">TIGER</span>
                <span className="text-2xl">🐯</span>
              </div>
              <div className={`relative mx-auto w-16 h-22 rounded-lg overflow-hidden transform transition-all duration-500
                ${tigerCard ? 'rotate-0' : 'rotate-y-180'}
                ${winner === 'tiger' && showResult ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50 scale-110' : ''}`}>
                {tigerCard ? (
                  <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center shadow-xl">
                    <span className={`text-3xl font-bold ${tigerCard.suit === '♥' || tigerCard.suit === '♦' ? 'text-red-500' : 'text-black'}`}>
                      {tigerCard.value}
                    </span>
                    <span className={`text-xl ${tigerCard.suit === '♥' || tigerCard.suit === '♦' ? 'text-red-500' : 'text-black'}`}>
                      {tigerCard.suit}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center border-2 border-blue-400/50">
                    <span className="text-3xl">🐯</span>
                  </div>
                )}
              </div>
              {tigerCard && (
                <div className="mt-2 text-blue-400 font-bold text-lg">{tigerCard.numValue}</div>
              )}
            </div>
          </div>
        </div>

        {/* Betting Table */}
        <div className="bg-gradient-to-b from-[#0d4a2a] to-[#073d1f] rounded-2xl p-3 border border-green-700/50 shadow-2xl">
          <div className="grid grid-cols-3 gap-2">
            {/* Dragon Bet Area */}
            <button
              onClick={() => placeBet('dragon')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-2 rounded-xl transition-all duration-300 min-h-[80px]
                ${winner === 'dragon' && showResult 
                  ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 animate-pulse scale-105' 
                  : 'bg-gradient-to-b from-orange-600/80 to-orange-800/80 hover:from-orange-500 hover:to-orange-700'}
                ${gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-95'}
                border-2 ${winner === 'dragon' && showResult ? 'border-yellow-300' : 'border-orange-500/50'}`}
            >
              <div className="text-center">
                <span className="text-2xl">🐲</span>
                <div className="text-xs font-bold mt-1">Dragon</div>
                <div className="text-[10px] text-orange-200 bg-black/30 rounded px-1 py-0.5 mt-1">1:1</div>
                {dragonBet > 0 && (
                  <div className="mt-2 bg-yellow-500 text-black rounded-full px-2 py-1 text-sm font-bold animate-bounce">
                    ₹{dragonBet}
                  </div>
                )}
              </div>
            </button>

            {/* Tie Bet Area */}
            <button
              onClick={() => placeBet('tie')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-2 rounded-xl transition-all duration-300 min-h-[80px]
                ${winner === 'tie' && showResult 
                  ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 animate-pulse scale-105' 
                  : 'bg-gradient-to-b from-green-600/80 to-green-800/80 hover:from-green-500 hover:to-green-700'}
                ${gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-95'}
                border-2 ${winner === 'tie' && showResult ? 'border-yellow-300' : 'border-green-500/50'}`}
            >
              <div className="text-center">
                <span className="text-2xl">🤝</span>
                <div className="text-xs font-bold mt-1">Tie</div>
                <div className="text-[10px] text-green-200 bg-black/30 rounded px-1 py-0.5 mt-1">1:8</div>
                {tieBet > 0 && (
                  <div className="mt-2 bg-yellow-500 text-black rounded-full px-2 py-1 text-sm font-bold animate-bounce">
                    ₹{tieBet}
                  </div>
                )}
              </div>
            </button>

            {/* Tiger Bet Area */}
            <button
              onClick={() => placeBet('tiger')}
              disabled={gamePhase !== 'betting'}
              className={`relative p-2 rounded-xl transition-all duration-300 min-h-[80px]
                ${winner === 'tiger' && showResult 
                  ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 animate-pulse scale-105' 
                  : 'bg-gradient-to-b from-blue-600/80 to-blue-800/80 hover:from-blue-500 hover:to-blue-700'}
                ${gamePhase !== 'betting' ? 'opacity-70' : 'active:scale-95'}
                border-2 ${winner === 'tiger' && showResult ? 'border-yellow-300' : 'border-blue-500/50'}`}
            >
              <div className="text-center">
                <span className="text-2xl">🐯</span>
                <div className="text-xs font-bold mt-1">Tiger</div>
                <div className="text-[10px] text-blue-200 bg-black/30 rounded px-1 py-0.5 mt-1">1:1</div>
                {tigerBet > 0 && (
                  <div className="mt-2 bg-yellow-500 text-black rounded-full px-2 py-1 text-sm font-bold animate-bounce">
                    ₹{tigerBet}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Chip Selection */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Select Chip</span>
            <button 
              onClick={clearBets}
              disabled={gamePhase !== 'betting' || (dragonBet === 0 && tigerBet === 0 && tieBet === 0)}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Repeat className="w-4 h-4" />
              Clear
            </button>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {CHIP_VALUES.map(value => (
              <button
                key={value}
                onClick={() => setSelectedChip(value)}
                disabled={gamePhase !== 'betting'}
                className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center text-xs font-bold
                  transition-all duration-200 border-4
                  ${selectedChip === value 
                    ? 'ring-4 ring-yellow-400 scale-110 shadow-lg shadow-yellow-400/30' 
                    : 'hover:scale-105'}
                  ${gamePhase !== 'betting' ? 'opacity-50' : ''}
                  ${value === 10 ? 'bg-gradient-to-b from-gray-400 to-gray-600 border-gray-300' :
                    value === 50 ? 'bg-gradient-to-b from-green-400 to-green-600 border-green-300' :
                    value === 100 ? 'bg-gradient-to-b from-blue-400 to-blue-600 border-blue-300' :
                    value === 500 ? 'bg-gradient-to-b from-purple-400 to-purple-600 border-purple-300' :
                    value === 1000 ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-300' :
                    'bg-gradient-to-b from-red-400 to-red-600 border-red-300'}`}
              >
                <span className="text-white drop-shadow-lg">{value >= 1000 ? `${value/1000}K` : value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Win Popup */}
      {showWinPopup && winAmount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="relative">
              {/* Celebration effects */}
              <div className="absolute -inset-20 flex items-center justify-center">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-ping"
                    style={{
                      transform: `rotate(${i * 30}deg) translateY(-80px)`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              
              <div className="bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-3xl p-8 shadow-2xl border-4 border-yellow-300">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-3xl font-bold text-white mb-2">YOU WIN!</div>
                <div className="text-5xl font-bold text-white">
                  ₹{winAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragonTigerGame;