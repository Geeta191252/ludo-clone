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

  // Game View - 3D Casino Style - Fullscreen Landscape
  if (gamePhase === 'playing') {
    // Player positions around the oval table (percentages from center)
    const playerPositions = isLandscape ? [
      { x: 0, y: 48, label: 'bottom' },      // Player (You) - bottom center
      { x: -42, y: 20, label: 'left-top' },  // Bot 1 - left top
      { x: -25, y: -35, label: 'top-left' }, // Bot 2 - top left
      { x: 25, y: -35, label: 'top-right' }, // Bot 3 - top right
      { x: 42, y: 20, label: 'right-top' },  // Bot 4 - right top
    ] : [
      { x: 0, y: 42, label: 'bottom' },
      { x: -38, y: 15, label: 'left-top' },
      { x: -20, y: -30, label: 'top-left' },
      { x: 20, y: -30, label: 'top-right' },
      { x: 38, y: 15, label: 'right-top' },
    ];
    
    return (
      <div 
        className="fixed inset-0 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 30%, #0a0a0f 100%)'
        }}
      >
        {/* Ambient light effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-yellow-500/5 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-1/3 h-1/4 bg-green-500/5 blur-3xl rounded-full" />
        </div>

        {/* Header - Minimal for fullscreen */}
        <div className="absolute top-2 left-2 right-2 z-30 flex justify-between items-center">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
            <div className="bg-black/60 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2 border border-yellow-500/30">
              <img src={rupeeIcon} alt="₹" className="w-5 h-5" />
              <span className="text-yellow-400 font-bold">{walletBalance.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Action Animation Overlay */}
        {actionAnimation && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-5xl font-black text-yellow-400 animate-bounce" style={{
              textShadow: '0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.6), 0 0 90px rgba(255,215,0,0.3)'
            }}>
              {actionAnimation}
            </div>
          </div>
        )}

        {/* 3D Table - Fullscreen */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '1500px' }}
        >
          <div 
            className="relative"
            style={{
              width: isLandscape ? '85vw' : '95vw',
              maxWidth: isLandscape ? '800px' : '450px',
              height: isLandscape ? '65vh' : '55vh',
              transform: isLandscape ? 'rotateX(35deg) translateY(-5%)' : 'rotateX(30deg) translateY(5%)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Table Shadow */}
            <div 
              className="absolute rounded-[50%]"
              style={{
                inset: '-8%',
                background: 'rgba(0,0,0,0.7)',
                filter: 'blur(40px)',
                transform: 'translateZ(-30px) translateY(20px)'
              }}
            />
            
            {/* Table Outer Rim (Golden) */}
            <div 
              className="absolute inset-0 rounded-[50%]"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 20%, #8b7226 40%, #6b5a1e 60%, #4a3d15 80%, #2a2310 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.3)'
              }}
            />
            
            {/* Table Inner Rim (Wood) */}
            <div 
              className="absolute rounded-[50%]"
              style={{
                inset: '2%',
                background: 'linear-gradient(180deg, #5d3a1a 0%, #4a2d14 30%, #3d2410 60%, #2d1a0a 100%)',
                boxShadow: 'inset 0 5px 20px rgba(0,0,0,0.6)'
              }}
            />
            
            {/* Table Felt (Green) */}
            <div 
              className="absolute rounded-[50%]"
              style={{
                inset: '5%',
                background: 'radial-gradient(ellipse at 50% 35%, #1a7a1a 0%, #147014 25%, #0d5a0d 50%, #084808 75%, #033803 100%)',
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 -20px 60px rgba(0,0,0,0.3), inset 0 15px 40px rgba(255,255,255,0.08)'
              }}
            >
              {/* Felt Texture */}
              <div className="absolute inset-0 rounded-[50%] opacity-10" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
              }} />
              
              {/* Table Logo & Pot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center transform" style={{ transform: 'rotateX(-35deg)' }}>
                  <div className="text-yellow-500/30 text-sm font-bold tracking-[0.3em] mb-2">TEEN PATTI</div>
                  <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 border-2 border-yellow-500/40 shadow-2xl">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-3xl">🏆</span>
                      <span className="text-yellow-400 font-black text-2xl">₹{potAmount}</span>
                    </div>
                    <div className="text-white/50 text-xs mt-1">POT</div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Lines on felt */}
              <div className="absolute inset-[15%] rounded-[50%] border border-yellow-500/10" />
              <div className="absolute inset-[30%] rounded-[50%] border border-yellow-500/5" />
            </div>

            {/* Players Around Table */}
            {players.map((player, index) => {
              const pos = playerPositions[index];
              const isMe = player.id === 'player';
              const showMyCards = isMe && isSeen;
              const showAllCards = showCards;
              
              return (
                <div 
                  key={player.id}
                  className="absolute flex flex-col items-center transition-all duration-500"
                  style={{
                    left: `${50 + pos.x}%`,
                    top: `${50 + pos.y}%`,
                    transform: `translate(-50%, -50%) rotateX(-35deg)`,
                    zIndex: isMe ? 20 : 10
                  }}
                >
                  {/* Cards */}
                  <div className={`flex ${isMe ? '-space-x-3' : '-space-x-4'} mb-2`}>
                    {player.cards.map((card, i) => (
                      <Card3D 
                        key={i} 
                        card={card} 
                        isBack={!showAllCards && !(isMe && showMyCards)}
                        isLarge={isMe}
                        rotation={(i - 1) * (isMe ? 8 : 5)}
                      />
                    ))}
                  </div>
                  
                  {/* Player Info */}
                  <div className={`flex flex-col items-center ${player.isFolded ? 'opacity-40' : ''}`}>
                    <div className={`relative ${isMe ? 'w-14 h-14' : 'w-11 h-11'} rounded-full flex items-center justify-center text-xl border-3 ${
                      player.isCurrentTurn ? 'border-yellow-400 animate-pulse shadow-[0_0_20px_rgba(255,215,0,0.6)]' : 'border-gray-600'
                    } ${isMe ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-gray-500 to-gray-700'}`}
                    style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                      <span className={`${isMe ? 'text-2xl' : 'text-lg'}`}>{player.avatar}</span>
                      {player.lastAction && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                          player.lastAction === 'PACK' ? 'bg-red-500' :
                          player.lastAction.includes('BLIND') ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}>
                          {player.lastAction === 'PACK' ? '✕' : '✓'}
                        </div>
                      )}
                    </div>
                    <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg mt-1 border border-white/10">
                      <span className="text-white text-xs font-bold">{player.name}</span>
                    </div>
                    <div className="bg-yellow-500/20 px-2 py-0.5 rounded mt-0.5">
                      <span className="text-yellow-400 text-xs font-bold">₹{player.totalBet}</span>
                    </div>
                    {player.lastAction && !player.isFolded && (
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                        player.lastAction === 'PACK' ? 'bg-red-600/80 text-white' :
                        player.lastAction.includes('BLIND') ? 'bg-blue-600/80 text-white' :
                        player.lastAction.includes('CHAAL') || player.lastAction.includes('CHAL') ? 'bg-green-600/80 text-white' :
                        'bg-purple-600/80 text-white'
                      }`}>
                        {player.lastAction}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dealing Animation */}
        {dealingAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-bounce">🎴</div>
              <div className="text-white text-2xl font-bold animate-pulse">Dealing Cards...</div>
            </div>
          </div>
        )}

        {/* My Cards - See Button (shown when not seen) */}
        {!isSeen && myCards.length > 0 && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20">
            <button 
              onClick={seeCards}
              className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white font-black px-8 py-3 rounded-xl text-lg shadow-2xl hover:scale-105 transition-all border-2 border-green-300 animate-pulse"
              style={{ boxShadow: '0 0 30px rgba(34,197,94,0.5)' }}
            >
              👁 SEE CARDS
            </button>
          </div>
        )}

        {/* Hand Rank Display */}
        {handRankName && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-5 py-2 rounded-full font-bold text-sm border border-purple-400 shadow-lg">
              ✨ {handRankName}
            </div>
          </div>
        )}

        {/* Action Buttons - Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-3 z-30 bg-gradient-to-t from-black via-black/90 to-transparent">
          {isMyTurn ? (
            <div className={`flex gap-2 max-w-2xl mx-auto ${isLandscape ? 'gap-3' : 'flex-wrap gap-2'}`}>
              {/* PACK */}
              <button 
                onClick={fold}
                className="flex-1 min-w-[70px] bg-gradient-to-b from-red-500 to-red-700 text-white font-bold py-3 rounded-xl border-2 border-red-400 shadow-lg active:scale-95 transition-transform"
              >
                <div className="text-sm">PACK</div>
              </button>
              
              {/* Blind/Chal buttons based on seen status */}
              {!isSeen ? (
                <>
                  <button 
                    onClick={() => placeBet(false)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl border-2 border-blue-400 shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="text-lg font-black">₹{getCurrentBetAmount()}</div>
                    <div className="text-xs opacity-80">BLIND</div>
                  </button>
                  <button 
                    onClick={() => placeBet(true)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-purple-500 to-purple-700 text-white font-bold py-3 rounded-xl border-2 border-purple-400 shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="text-lg font-black">₹{getCurrentBetAmount() * 2}</div>
                    <div className="text-xs opacity-80">2X BLIND</div>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => placeBet(false)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-green-500 to-green-700 text-white font-bold py-3 rounded-xl border-2 border-green-400 shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="text-lg font-black">₹{getCurrentBetAmount() * 2}</div>
                    <div className="text-xs opacity-80">CHAAL</div>
                  </button>
                  <button 
                    onClick={() => placeBet(true)}
                    className="flex-1 min-w-[80px] bg-gradient-to-b from-orange-500 to-orange-700 text-white font-bold py-3 rounded-xl border-2 border-orange-400 shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="text-lg font-black">₹{getCurrentBetAmount() * 4}</div>
                    <div className="text-xs opacity-80">2X CHAAL</div>
                  </button>
                  
                  {/* Side Show */}
                  {getActivePlayers().length > 2 && (
                    <button 
                      onClick={sideShow}
                      className="flex-1 min-w-[80px] bg-gradient-to-b from-pink-500 to-pink-700 text-white font-bold py-3 rounded-xl border-2 border-pink-400 shadow-lg active:scale-95 transition-transform"
                    >
                      <div className="text-lg font-black">₹{getCurrentBetAmount() * 2}</div>
                      <div className="text-xs opacity-80">SIDE SHOW</div>
                    </button>
                  )}
                </>
              )}
              
              {/* Show */}
              {getActivePlayers().length === 2 && (
                <button 
                  onClick={requestShow}
                  className="flex-1 min-w-[80px] bg-gradient-to-b from-yellow-500 to-yellow-600 text-black font-bold py-3 rounded-xl border-2 border-yellow-300 shadow-lg active:scale-95 transition-transform"
                >
                  <div className="text-lg font-black">₹{isSeen ? getCurrentBetAmount() * 2 : getCurrentBetAmount()}</div>
                  <div className="text-xs opacity-80">SHOW</div>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-black/70 text-white/80 px-6 py-3 rounded-xl border border-white/10">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-lg">Waiting for other players...</span>
              </div>
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
