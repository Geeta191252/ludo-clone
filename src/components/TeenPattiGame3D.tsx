import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Volume2, VolumeX, HelpCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import rupeeIcon from '@/assets/rupee-icon.png';

interface TeenPattiGame3DProps {
  walletBalance: number;
  onWalletChange: (newBalance: number) => void;
  onBack: () => void;
}

interface Player {
  id: string;
  name: string;
  cards: string[];
  bet: number;
  totalBet: number;
  isFolded: boolean;
  isSeen: boolean;
  isCurrentTurn: boolean;
  position: number;
  avatar: string;
  lastAction?: string;
}

interface TableOption {
  id: string;
  pointValue: number;
  minEntry: number;
  maxPlayers: number;
  online: number;
}

const TABLE_OPTIONS: TableOption[] = [
  { id: 'table-05', pointValue: 0.5, minEntry: 1, maxPlayers: 5, online: Math.floor(Math.random() * 500) + 200 },
  { id: 'table-1', pointValue: 1, minEntry: 20, maxPlayers: 5, online: Math.floor(Math.random() * 800) + 400 },
  { id: 'table-2', pointValue: 2, minEntry: 40, maxPlayers: 5, online: Math.floor(Math.random() * 600) + 300 },
  { id: 'table-5', pointValue: 5, minEntry: 100, maxPlayers: 5, online: Math.floor(Math.random() * 400) + 200 },
];

const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const BOT_AVATARS = ['👨‍💼', '👩‍💼', '🧔', '👳', '👲'];
const BOT_NAMES = ['Raju', 'Priya', 'Amit', 'Vikram', 'Neha'];

const TeenPattiGame3D: React.FC<TeenPattiGame3DProps> = ({ walletBalance, onWalletChange, onBack }) => {
  const navigate = useNavigate();
  const [gamePhase, setGamePhase] = useState<'lobby' | 'waiting' | 'playing' | 'result'>('lobby');
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [roundBet, setRoundBet] = useState<number>(0);
  const [potAmount, setPotAmount] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myCards, setMyCards] = useState<string[]>([]);
  const [isSeen, setIsSeen] = useState<boolean>(false);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [showCards, setShowCards] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [dealingAnimation, setDealingAnimation] = useState<boolean>(false);
  const [handRankName, setHandRankName] = useState<string>('');
  const [actionAnimation, setActionAnimation] = useState<string>('');

  // Detect landscape mode
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const generateDeck = (): string[] => {
    const deck: string[] = [];
    CARD_SUITS.forEach(suit => {
      CARD_VALUES.forEach(value => {
        deck.push(`${value}_${suit}`);
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const getHandRankName = (cards: string[]): string => {
    const values = cards.map(c => {
      const val = c.split('_')[0];
      if (val === 'A') return 14;
      if (val === 'K') return 13;
      if (val === 'Q') return 12;
      if (val === 'J') return 11;
      return parseInt(val);
    }).sort((a, b) => b - a);
    
    const suits = cards.map(c => c.split('_')[1]);
    const isFlush = suits.every(s => s === suits[0]);
    const isSequence = values[0] - values[1] === 1 && values[1] - values[2] === 1;
    const isTriple = values[0] === values[1] && values[1] === values[2];
    const isPair = values[0] === values[1] || values[1] === values[2] || values[0] === values[2];
    
    if (isTriple) return 'Trail';
    if (isFlush && isSequence) return 'Pure Sequence';
    if (isSequence) return 'Sequence';
    if (isFlush) return 'Color';
    if (isPair) return 'Pair';
    return 'High Card';
  };

  const getHandRank = (cards: string[]): number => {
    const values = cards.map(c => {
      const val = c.split('_')[0];
      if (val === 'A') return 14;
      if (val === 'K') return 13;
      if (val === 'Q') return 12;
      if (val === 'J') return 11;
      return parseInt(val);
    }).sort((a, b) => b - a);
    
    const suits = cards.map(c => c.split('_')[1]);
    const isFlush = suits.every(s => s === suits[0]);
    const isSequence = values[0] - values[1] === 1 && values[1] - values[2] === 1;
    const isTriple = values[0] === values[1] && values[1] === values[2];
    const isPair = values[0] === values[1] || values[1] === values[2] || values[0] === values[2];
    
    if (isTriple) return 6000 + values[0];
    if (isFlush && isSequence) return 5000 + values[0];
    if (isSequence) return 4000 + values[0];
    if (isFlush) return 3000 + values[0] * 100 + values[1];
    if (isPair) return 2000 + Math.max(values[0] === values[1] ? values[0] : values[1], values[1] === values[2] ? values[1] : values[0]) * 10;
    return values[0] * 100 + values[1] * 10 + values[2];
  };

  const dealCards = () => {
    setDealingAnimation(true);
    const deck = generateDeck();
    const newPlayers: Player[] = [
      { id: 'player', name: 'You', cards: deck.slice(0, 3), bet: currentBet, totalBet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: true, position: 0, avatar: '😎' },
      { id: 'bot1', name: BOT_NAMES[0], cards: deck.slice(3, 6), bet: currentBet, totalBet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 1, avatar: BOT_AVATARS[0] },
      { id: 'bot2', name: BOT_NAMES[1], cards: deck.slice(6, 9), bet: currentBet, totalBet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 2, avatar: BOT_AVATARS[1] },
      { id: 'bot3', name: BOT_NAMES[2], cards: deck.slice(9, 12), bet: currentBet, totalBet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 3, avatar: BOT_AVATARS[2] },
      { id: 'bot4', name: BOT_NAMES[3], cards: deck.slice(12, 15), bet: currentBet, totalBet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 4, avatar: BOT_AVATARS[3] },
    ];
    
    setTimeout(() => {
      setPlayers(newPlayers);
      setMyCards(newPlayers[0].cards);
      setPotAmount(currentBet * 5);
      setRoundBet(currentBet);
      setIsMyTurn(true);
      setDealingAnimation(false);
    }, 2000);
  };

  const handleTableAction = (table: TableOption) => {
    if (walletBalance >= table.minEntry) {
      setCurrentBet(table.pointValue);
      setGamePhase('waiting');
      setTimeout(() => {
        setGamePhase('playing');
        dealCards();
      }, 2000);
    } else {
      navigate('/wallet');
    }
  };

  const seeCards = () => {
    setIsSeen(true);
    setHandRankName(getHandRankName(myCards));
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, isSeen: true } : p
    ));
    setActionAnimation('SEE');
    setTimeout(() => setActionAnimation(''), 1000);
  };

  const getCurrentBetAmount = () => {
    return roundBet || currentBet;
  };

  const placeBet = (isDouble: boolean = false) => {
    const base = getCurrentBetAmount();
    const betAmount = isSeen 
      ? (isDouble ? base * 4 : base * 2)
      : (isDouble ? base * 2 : base);
    
    if (walletBalance < betAmount) {
      toast.error('Insufficient balance!');
      return;
    }
    
    onWalletChange(walletBalance - betAmount);
    setPotAmount(prev => prev + betAmount);
    
    const actionName = isSeen 
      ? (isDouble ? 'DOUBLE CHAL' : 'CHAL')
      : (isDouble ? 'DOUBLE BLIND' : 'BLIND');
    
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, bet: p.bet + betAmount, totalBet: p.totalBet + betAmount, lastAction: actionName } : p
    ));
    
    if (isDouble) {
      setRoundBet(prev => (prev || currentBet) * 2);
    }
    
    setActionAnimation(actionName);
    setTimeout(() => setActionAnimation(''), 1500);
    
    toast.success(`₹${betAmount} - ${actionName}!`, { duration: 1500 });
    simulateBotTurns();
  };

  const fold = () => {
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, isFolded: true, lastAction: 'PACK' } : p
    ));
    setActionAnimation('PACK');
    toast.error('You packed!');
    
    setTimeout(() => {
      endGame(players.find(p => p.id !== 'player' && !p.isFolded) || players[1]);
    }, 1000);
  };

  const getActivePlayers = () => players.filter(p => !p.isFolded);

  const requestShow = () => {
    const activePlayers = getActivePlayers();
    if (activePlayers.length !== 2) return;
    
    const base = getCurrentBetAmount();
    const showCost = isSeen ? base * 2 : base;
    if (walletBalance < showCost) {
      toast.error('Insufficient balance for Show!');
      return;
    }
    
    onWalletChange(walletBalance - showCost);
    setPotAmount(prev => prev + showCost);
    
    setActionAnimation('SHOW');
    toast.success(`₹${showCost} - SHOW!`, { duration: 1500 });
    
    const opponent = activePlayers.find(p => p.id !== 'player');
    const myRank = getHandRank(myCards);
    const opponentRank = opponent ? getHandRank(opponent.cards) : 0;
    
    setShowCards(true);
    
    setTimeout(() => {
      if (myRank >= opponentRank) {
        endGame(players.find(p => p.id === 'player')!);
      } else {
        endGame(opponent!);
      }
    }, 2000);
  };

  const sideShow = () => {
    const activePlayers = getActivePlayers();
    if (activePlayers.length < 2 || !isSeen) return;
    
    const base = getCurrentBetAmount();
    const sideShowCost = base * 2;
    
    if (walletBalance < sideShowCost) {
      toast.error('Insufficient balance for Side Show!');
      return;
    }
    
    onWalletChange(walletBalance - sideShowCost);
    setPotAmount(prev => prev + sideShowCost);
    
    setActionAnimation('SIDE SHOW');
    
    // Find next active player (previous player who placed bet)
    const prevPlayerIndex = players.findIndex(p => p.id === 'player') - 1;
    const prevPlayer = prevPlayerIndex >= 0 ? players[prevPlayerIndex] : players[players.length - 1];
    
    if (prevPlayer && !prevPlayer.isFolded) {
      const accepted = Math.random() > 0.3; // 70% chance to accept
      
      if (accepted) {
        toast.success('Side Show Accepted!');
        const myRank = getHandRank(myCards);
        const opponentRank = getHandRank(prevPlayer.cards);
        
        setTimeout(() => {
          if (myRank >= opponentRank) {
            setPlayers(prev => prev.map(p => 
              p.id === prevPlayer.id ? { ...p, isFolded: true } : p
            ));
            toast.success(`${prevPlayer.name} packed!`);
          } else {
            setPlayers(prev => prev.map(p => 
              p.id === 'player' ? { ...p, isFolded: true } : p
            ));
            toast.error('You lost the side show!');
            endGame(prevPlayer);
          }
        }, 1500);
      } else {
        toast.info(`${prevPlayer.name} rejected Side Show!`);
      }
    }
    
    simulateBotTurns();
  };

  const simulateBotTurns = () => {
    setIsMyTurn(false);
    const base = getCurrentBetAmount();
    
    let delay = 800;
    players.forEach((player) => {
      if (player.id !== 'player' && !player.isFolded) {
        setTimeout(() => {
          const shouldFold = Math.random() < 0.12;
          const shouldSee = Math.random() < 0.35;
          const shouldDouble = Math.random() < 0.2;
          
          if (shouldFold) {
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, isFolded: true, lastAction: 'PACK' } : p
            ));
            toast.info(`${player.name} - PACK!`);
          } else {
            const baseBotBet = shouldDouble ? base * 2 : base;
            const botBet = shouldSee ? baseBotBet * 2 : baseBotBet;
            
            const betType = shouldSee 
              ? (shouldDouble ? 'DOUBLE CHAL' : 'CHAL')
              : (shouldDouble ? 'DOUBLE BLIND' : 'BLIND');
            
            if (shouldDouble) {
              setRoundBet(prev => (prev || currentBet) * 2);
            }
            
            toast.info(`${player.name} - ₹${botBet} ${betType}!`);
            
            setPotAmount(prev => prev + botBet);
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, bet: p.bet + botBet, totalBet: p.totalBet + botBet, isSeen: shouldSee, lastAction: betType } : p
            ));
          }
        }, delay);
        delay += 1000;
      }
    });
    
    setTimeout(() => {
      const activePlayers = players.filter(p => !p.isFolded);
      if (activePlayers.length <= 1 || Math.random() < 0.15) {
        showdown();
      } else {
        setIsMyTurn(true);
      }
    }, delay + 500);
  };

  const showdown = () => {
    setShowCards(true);
    setHandRankName(getHandRankName(myCards));
    const activePlayers = players.filter(p => !p.isFolded);
    
    let highestRank = 0;
    let winningPlayer = activePlayers[0];
    
    activePlayers.forEach(player => {
      const rank = getHandRank(player.cards);
      if (rank > highestRank) {
        highestRank = rank;
        winningPlayer = player;
      }
    });
    
    setTimeout(() => endGame(winningPlayer), 2000);
  };

  const endGame = (winningPlayer: Player) => {
    setWinner(winningPlayer);
    setGamePhase('result');
    
    if (winningPlayer.id === 'player') {
      onWalletChange(walletBalance + potAmount);
      toast.success(`You won ₹${potAmount}!`);
    } else {
      toast.error(`${winningPlayer.name} won ₹${potAmount}!`);
    }
  };

  const playAgain = () => {
    setGamePhase('lobby');
    setPlayers([]);
    setMyCards([]);
    setIsSeen(false);
    setShowCards(false);
    setWinner(null);
    setPotAmount(0);
    setCurrentBet(0);
    setRoundBet(0);
    setHandRankName('');
    setActionAnimation('');
  };

  // Card Component
  const Card3D: React.FC<{ card: string; isBack?: boolean; isLarge?: boolean; rotation?: number }> = ({ 
    card, isBack = false, isLarge = false, rotation = 0 
  }) => {
    const getCardContent = () => {
      if (isBack) return { value: '', suit: '', color: '', symbol: '' };
      const [value, suit] = card.split('_');
      const suitSymbols: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
      const suitColors: Record<string, string> = { hearts: '#ff4444', diamonds: '#ff4444', clubs: '#111', spades: '#111' };
      return { value, suit, symbol: suitSymbols[suit], color: suitColors[suit] };
    };
    
    const { value, symbol, color } = getCardContent();
    const size = isLarge ? (isLandscape ? 'w-14 h-20' : 'w-12 h-16') : (isLandscape ? 'w-10 h-14' : 'w-8 h-11');
    
    return (
      <div 
        className={`${size} rounded-lg shadow-xl relative transition-all duration-300`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {isBack ? (
          <div className="w-full h-full rounded-lg" style={{
            background: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 50%, #5c0000 100%)',
            border: '2px solid #ffd700'
          }}>
            <div className="absolute inset-1 border border-yellow-400/30 rounded flex items-center justify-center">
              <div className="w-3/4 h-3/4 rounded" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,215,0,0.1) 2px, rgba(255,215,0,0.1) 4px)'
              }} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-between p-1">
            <span className="text-xs font-bold" style={{ color }}>{value}</span>
            <span className={`${isLarge ? 'text-2xl' : 'text-lg'}`} style={{ color }}>{symbol}</span>
            <span className="text-xs font-bold rotate-180" style={{ color }}>{value}</span>
          </div>
        )}
      </div>
    );
  };

  // Player Position Component for 3D Table
  const PlayerPosition: React.FC<{ player: Player; angle: number }> = ({ player, angle }) => {
    const isMe = player.id === 'player';
    const showMyCards = isMe && isSeen;
    const showAllCards = showCards;
    
    // Calculate position based on angle
    const radius = isLandscape ? 42 : 38;
    const x = Math.sin(angle * Math.PI / 180) * radius;
    const y = -Math.cos(angle * Math.PI / 180) * radius * 0.6;
    
    return (
      <div 
        className="absolute flex flex-col items-center transition-all duration-500"
        style={{
          left: `${50 + x}%`,
          top: `${50 + y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Cards */}
        <div className="flex -space-x-3 mb-1">
          {player.cards.map((card, i) => (
            <Card3D 
              key={i} 
              card={card} 
              isBack={!showAllCards && !(isMe && showMyCards)}
              rotation={(i - 1) * 8}
            />
          ))}
        </div>
        
        {/* Avatar & Info */}
        <div className={`flex flex-col items-center ${player.isFolded ? 'opacity-40' : ''}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${
            player.isCurrentTurn ? 'border-yellow-400 animate-pulse' : 'border-gray-600'
          } ${isMe ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-gray-600 to-gray-800'}`}>
            {player.avatar}
          </div>
          <span className="text-white text-xs font-bold mt-0.5 bg-black/50 px-2 rounded">
            {player.name}
          </span>
          {player.lastAction && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${
              player.lastAction === 'PACK' ? 'bg-red-600 text-white' :
              player.lastAction.includes('BLIND') ? 'bg-blue-600 text-white' :
              'bg-green-600 text-white'
            }`}>
              {player.lastAction}
            </span>
          )}
          <span className="text-yellow-400 text-xs font-bold">₹{player.totalBet}</span>
        </div>
      </div>
    );
  };

  // Lobby View
  if (gamePhase === 'lobby') {
    return (
      <div className="min-h-screen relative" style={{
        background: 'linear-gradient(180deg, #8B0000 0%, #5c0000 50%, #3d0000 100%)'
      }}>
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-3 border-b border-red-700/50">
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full px-3 py-1.5 border border-yellow-400">
            <img src={rupeeIcon} alt="₹" className="w-5 h-5" />
            <span className="text-white font-bold text-sm">{walletBalance.toFixed(2)}</span>
          </div>
          <h1 className="text-xl font-bold text-white">Teen Patti 3D</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </button>
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="relative z-10 mx-3 mt-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg border border-red-800/50">
            <div className="grid grid-cols-5 text-center py-3 text-white text-xs font-semibold">
              <span>Point</span>
              <span>Min Entry</span>
              <span>Max</span>
              <span>Online</span>
              <span>Join</span>
            </div>
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="relative z-10 mx-3 space-y-2">
          {TABLE_OPTIONS.map((table) => {
            const hasBalance = walletBalance >= table.minEntry;
            return (
              <div key={table.id} className="bg-gradient-to-b from-red-900/80 to-red-950/80 rounded-lg border border-red-700/50">
                <div className="grid grid-cols-5 items-center text-center py-4 px-2">
                  <span className="text-yellow-400 font-bold text-sm">₹{table.pointValue}</span>
                  <span className="text-white font-medium text-sm">₹{table.minEntry}</span>
                  <span className="text-white font-medium text-sm">{table.maxPlayers}</span>
                  <span className="text-white font-medium text-sm">{table.online}</span>
                  <button
                    onClick={() => handleTableAction(table)}
                    className={`px-3 py-2 rounded font-bold text-xs ${
                      hasBalance 
                        ? 'bg-gradient-to-b from-green-400 to-green-600 text-white'
                        : 'bg-gradient-to-b from-orange-400 to-orange-600 text-white'
                    }`}
                  >
                    {hasBalance ? 'Play Now' : 'Add Cash'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Rotate Phone Hint */}
        <div className="fixed bottom-20 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-2 bg-black/60 text-yellow-400 px-4 py-2 rounded-full text-sm">
            <span className="animate-bounce">📱</span>
            <span>Rotate phone for 3D view</span>
          </div>
        </div>
      </div>
    );
  }

  // Waiting View
  if (gamePhase === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}>
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl text-white font-bold">Finding Players...</h2>
          <p className="text-yellow-400 mt-2">Boot: ₹{currentBet}</p>
        </div>
      </div>
    );
  }

  // Game View - 3D Casino Style
  if (gamePhase === 'playing') {
    const playerAngles = [180, 252, 324, 36, 108]; // 5 players around table
    
    return (
      <div 
        className={`min-h-screen relative overflow-hidden ${isLandscape ? 'landscape-mode' : ''}`}
        style={{
          background: 'linear-gradient(180deg, #1a0a0a 0%, #2d0a0a 30%, #1a0808 100%)'
        }}
      >
        {/* Stars Background */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-2">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full px-4 py-2 flex items-center gap-2">
            <img src={rupeeIcon} alt="₹" className="w-5 h-5" />
            <span className="text-white font-bold">{walletBalance.toFixed(0)}</span>
          </div>
        </div>

        {/* Action Animation Overlay */}
        {actionAnimation && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-4xl font-black text-yellow-400 animate-bounce" style={{
              textShadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.5)'
            }}>
              {actionAnimation}
            </div>
          </div>
        )}

        {/* 3D Table Container */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{
            top: isLandscape ? '15%' : '12%',
            width: isLandscape ? '90%' : '95%',
            maxWidth: isLandscape ? '600px' : '400px',
            height: isLandscape ? '55vh' : '50vh',
            perspective: '1200px'
          }}
        >
          {/* Table with 3D effect */}
          <div 
            className="relative w-full h-full"
            style={{
              transform: 'rotateX(25deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Table Shadow */}
            <div 
              className="absolute rounded-[50%]"
              style={{
                inset: '-5%',
                background: 'rgba(0,0,0,0.5)',
                filter: 'blur(20px)',
                transform: 'translateZ(-20px)'
              }}
            />
            
            {/* Table Border (Wood) */}
            <div 
              className="absolute inset-0 rounded-[50%]"
              style={{
                background: 'linear-gradient(180deg, #8B4513 0%, #654321 30%, #3d2512 60%, #2a1a0d 100%)',
                boxShadow: 'inset 0 -10px 30px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.8)'
              }}
            />
            
            {/* Table Felt */}
            <div 
              className="absolute rounded-[50%]"
              style={{
                inset: '4%',
                background: 'radial-gradient(ellipse at 50% 40%, #1a8b1a 0%, #0d6b0d 40%, #054d05 70%, #033503 100%)',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.6), inset 0 20px 60px rgba(255,255,255,0.1)'
              }}
            >
              {/* Felt Texture */}
              <div className="absolute inset-0 rounded-[50%] opacity-20" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
              }} />
              
              {/* Center Logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-yellow-400/40 text-lg font-bold tracking-widest">TEEN PATTI</span>
                  {/* Pot Amount */}
                  <div className="mt-2 bg-black/60 rounded-full px-6 py-2 flex items-center gap-2 border-2 border-yellow-500/50">
                    <span className="text-2xl">🏆</span>
                    <span className="text-yellow-400 font-black text-xl">₹{potAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Players around table */}
            {players.map((player, index) => (
              <PlayerPosition key={player.id} player={player} angle={playerAngles[index]} />
            ))}
          </div>
        </div>

        {/* Dealing Animation */}
        {dealingAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60">
            <div className="text-white text-3xl font-bold animate-pulse">
              🎴 Dealing Cards...
            </div>
          </div>
        )}

        {/* My Cards Section - Fixed at bottom */}
        <div className={`fixed left-0 right-0 z-20 ${isLandscape ? 'bottom-16' : 'bottom-24'}`}>
          <div className="flex flex-col items-center">
            {/* Hand Rank */}
            {handRankName && (
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-1 rounded-full font-bold text-sm mb-2 border border-purple-400">
                {handRankName}
              </div>
            )}
            
            {/* My Cards with SEE button */}
            <div className="relative flex justify-center -space-x-4">
              {myCards.map((card, index) => (
                <div 
                  key={index}
                  className="transform transition-all duration-300 hover:scale-110 hover:-translate-y-2"
                  style={{ transform: `rotate(${(index - 1) * 10}deg)` }}
                >
                  <Card3D card={card} isBack={!isSeen} isLarge rotation={0} />
                </div>
              ))}
              
              {!isSeen && (
                <button 
                  onClick={seeCards}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-6 py-2 rounded-lg text-lg shadow-lg hover:scale-105 transition-transform border-2 border-green-400 z-10"
                >
                  👁 SEE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at very bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-2 z-30 bg-gradient-to-t from-black/90 to-transparent`}>
          {isMyTurn ? (
            <div className={`flex gap-2 max-w-lg mx-auto ${isLandscape ? 'flex-row' : 'flex-wrap'}`}>
              {/* PACK */}
              <button 
                onClick={fold}
                className="flex-1 min-w-[60px] bg-gradient-to-b from-red-500 to-red-700 text-white font-bold py-3 rounded-xl border-2 border-red-400"
              >
                <div className="text-center">
                  <div className="text-sm">PACK</div>
                </div>
              </button>
              
              {/* Blind/Chal buttons based on seen status */}
              {!isSeen ? (
                <>
                  <button 
                    onClick={() => placeBet(false)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl border-2 border-blue-400"
                  >
                    <div className="text-center">
                      <div className="text-lg">₹{getCurrentBetAmount()}</div>
                      <div className="text-xs">BLIND</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => placeBet(true)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-purple-500 to-purple-700 text-white font-bold py-3 rounded-xl border-2 border-purple-400"
                  >
                    <div className="text-center">
                      <div className="text-lg">₹{getCurrentBetAmount() * 2}</div>
                      <div className="text-xs">2X BLIND</div>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => placeBet(false)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-green-500 to-green-700 text-white font-bold py-3 rounded-xl border-2 border-green-400"
                  >
                    <div className="text-center">
                      <div className="text-lg">₹{getCurrentBetAmount() * 2}</div>
                      <div className="text-xs">CHAAL</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => placeBet(true)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-orange-500 to-orange-700 text-white font-bold py-3 rounded-xl border-2 border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg">₹{getCurrentBetAmount() * 4}</div>
                      <div className="text-xs">2X CHAAL</div>
                    </div>
                  </button>
                  
                  {/* Side Show - Only if seen and more than 2 players */}
                  {getActivePlayers().length > 2 && (
                    <button 
                      onClick={sideShow}
                      className="flex-1 min-w-[80px] bg-gradient-to-b from-pink-500 to-pink-700 text-white font-bold py-3 rounded-xl border-2 border-pink-400"
                    >
                      <div className="text-center">
                        <div className="text-lg">₹{getCurrentBetAmount() * 2}</div>
                        <div className="text-xs">SIDE SHOW</div>
                      </div>
                    </button>
                  )}
                </>
              )}
              
              {/* Show - Only when 2 players remain */}
              {getActivePlayers().length === 2 && (
                <button 
                  onClick={requestShow}
                  className="flex-1 min-w-[80px] bg-gradient-to-b from-yellow-500 to-yellow-700 text-white font-bold py-3 rounded-xl border-2 border-yellow-400"
                >
                  <div className="text-center">
                    <div className="text-lg">₹{isSeen ? getCurrentBetAmount() * 2 : getCurrentBetAmount()}</div>
                    <div className="text-xs">SHOW</div>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-white py-4 bg-black/60 rounded-xl max-w-lg mx-auto">
              <div className="animate-pulse text-lg">⏳ Waiting for other players...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result View
  if (gamePhase === 'result') {
    const isWinner = winner?.id === 'player';
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: isWinner 
          ? 'linear-gradient(180deg, #0d3d0d 0%, #1a5a1a 50%, #0d3d0d 100%)'
          : 'linear-gradient(180deg, #3d0d0d 0%, #5a1a1a 50%, #3d0d0d 100%)'
      }}>
        <div className="w-full max-w-md bg-black/50 rounded-2xl p-6 border-2 border-yellow-500/50">
          <div className="text-center">
            <div className="text-6xl mb-4">{isWinner ? '🏆' : '😢'}</div>
            <h2 className="text-3xl font-black text-white mb-2">
              {isWinner ? 'YOU WON!' : `${winner?.name} Won!`}
            </h2>
            <p className="text-yellow-400 text-4xl font-black mb-6">₹{potAmount}</p>
            
            {/* All Players Cards */}
            <div className="space-y-3 mb-6">
              {players.map(player => (
                <div key={player.id} className={`flex items-center justify-between bg-black/40 rounded-lg p-3 ${
                  player.id === winner?.id ? 'border-2 border-yellow-400' : ''
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{player.avatar}</span>
                    <span className={`text-white font-bold ${player.isFolded ? 'line-through opacity-50' : ''}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {player.cards.map((card, i) => (
                      <Card3D key={i} card={card} isBack={false} rotation={0} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={playAgain}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-4 rounded-xl text-xl hover:scale-105 transition-transform"
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TeenPattiGame3D;
