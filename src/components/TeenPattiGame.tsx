import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Users, Coins, Eye, Trophy, RefreshCw, Gift } from 'lucide-react';
import TeenPattiCard3D from './TeenPattiCard3D';

interface TeenPattiGameProps {
  walletBalance: number;
  onWalletChange: (newBalance: number) => void;
  onBack: () => void;
}

interface Player {
  id: string;
  name: string;
  cards: string[];
  bet: number;
  isFolded: boolean;
  isSeen: boolean;
  isCurrentTurn: boolean;
  position: number;
  avatar: string;
}

interface GameRoom {
  id: string;
  name: string;
  minBet: number;
  maxBet: number;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

const FIXED_TABLES: GameRoom[] = [
  { id: 'table-10', name: 'Beginner Table', minBet: 10, maxBet: 100, players: 0, maxPlayers: 6, status: 'waiting' },
  { id: 'table-50', name: 'Classic Table', minBet: 50, maxBet: 500, players: 0, maxPlayers: 6, status: 'waiting' },
  { id: 'table-100', name: 'Pro Table', minBet: 100, maxBet: 1000, players: 0, maxPlayers: 6, status: 'waiting' },
  { id: 'table-500', name: 'VIP Table', minBet: 500, maxBet: 5000, players: 0, maxPlayers: 6, status: 'waiting' },
];

const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const BOT_AVATARS = ['👨‍💼', '👩‍💼', '🧔', '👳', '👲'];
const BOT_NAMES = ['Raju', 'Priya', 'Amit', 'Vikram', 'Neha'];

const TeenPattiGame: React.FC<TeenPattiGameProps> = ({ walletBalance, onWalletChange, onBack }) => {
  const [gamePhase, setGamePhase] = useState<'lobby' | 'waiting' | 'playing' | 'result'>('lobby');
  const [selectedTable, setSelectedTable] = useState<GameRoom | null>(null);
  const [customBetAmount, setCustomBetAmount] = useState<number>(10);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [potAmount, setPotAmount] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myCards, setMyCards] = useState<string[]>([]);
  const [isSeen, setIsSeen] = useState<boolean>(false);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [showCards, setShowCards] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [dealingAnimation, setDealingAnimation] = useState<boolean>(false);
  const [handRankName, setHandRankName] = useState<string>('');

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

  const dealCards = () => {
    setDealingAnimation(true);
    const deck = generateDeck();
    const newPlayers: Player[] = [
      { id: 'player', name: 'You', cards: deck.slice(0, 3), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: true, position: 0, avatar: '😎' },
      { id: 'bot1', name: BOT_NAMES[0], cards: deck.slice(3, 6), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 1, avatar: BOT_AVATARS[0] },
      { id: 'bot2', name: BOT_NAMES[1], cards: deck.slice(6, 9), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 2, avatar: BOT_AVATARS[1] },
      { id: 'bot3', name: BOT_NAMES[2], cards: deck.slice(9, 12), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 3, avatar: BOT_AVATARS[2] },
    ];
    
    setTimeout(() => {
      setPlayers(newPlayers);
      setMyCards(newPlayers[0].cards);
      setPotAmount(currentBet * 4);
      setIsMyTurn(true);
      setDealingAnimation(false);
    }, 2000);
  };

  const joinTable = (table: GameRoom) => {
    if (walletBalance < table.minBet * 10) {
      toast.error('Insufficient balance! Need at least 10x minimum bet.');
      return;
    }
    setSelectedTable(table);
    setCurrentBet(table.minBet);
    setGamePhase('waiting');
    
    setTimeout(() => {
      setGamePhase('playing');
      dealCards();
    }, 2000);
  };

  const createCustomTable = () => {
    if (customBetAmount < 10) {
      toast.error('Minimum bet is ₹10');
      return;
    }
    if (walletBalance < customBetAmount * 10) {
      toast.error('Insufficient balance! Need at least 10x bet amount.');
      return;
    }
    const customTable: GameRoom = {
      id: 'custom',
      name: 'Custom Table',
      minBet: customBetAmount,
      maxBet: customBetAmount * 10,
      players: 0,
      maxPlayers: 6,
      status: 'waiting'
    };
    setSelectedTable(customTable);
    setCurrentBet(customBetAmount);
    setGamePhase('waiting');
    
    setTimeout(() => {
      setGamePhase('playing');
      dealCards();
    }, 2000);
  };

  const seeCards = () => {
    setIsSeen(true);
    setShowCards(true);
    setHandRankName(getHandRankName(myCards));
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, isSeen: true } : p
    ));
  };

  const placeBet = (amount: number) => {
    if (walletBalance < amount) {
      toast.error('Insufficient balance!');
      return;
    }
    
    const betAmount = isSeen ? amount * 2 : amount;
    onWalletChange(walletBalance - betAmount);
    setPotAmount(prev => prev + betAmount);
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, bet: p.bet + betAmount } : p
    ));
    
    simulateBotTurns(betAmount);
  };

  const fold = () => {
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, isFolded: true } : p
    ));
    toast.error('You packed!');
    
    setTimeout(() => {
      endGame(players.find(p => p.id !== 'player' && !p.isFolded) || players[1]);
    }, 1000);
  };

  const simulateBotTurns = (playerBet: number) => {
    setIsMyTurn(false);
    
    let delay = 500;
    players.forEach((player) => {
      if (player.id !== 'player' && !player.isFolded) {
        setTimeout(() => {
          const shouldFold = Math.random() < 0.15;
          const shouldSee = Math.random() < 0.3;
          
          if (shouldFold) {
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, isFolded: true } : p
            ));
            toast.info(`${player.name} packed!`);
          } else {
            const botBet = shouldSee ? playerBet * 2 : playerBet;
            setPotAmount(prev => prev + botBet);
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, bet: p.bet + botBet, isSeen: shouldSee } : p
            ));
          }
        }, delay);
        delay += 800;
      }
    });
    
    setTimeout(() => {
      const activePlayers = players.filter(p => !p.isFolded);
      if (activePlayers.length <= 1 || Math.random() < 0.2) {
        showdown();
      } else {
        setIsMyTurn(true);
      }
    }, delay + 500);
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
    
    endGame(winningPlayer);
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
    setSelectedTable(null);
    setPlayers([]);
    setMyCards([]);
    setIsSeen(false);
    setShowCards(false);
    setWinner(null);
    setPotAmount(0);
    setCurrentBet(0);
    setHandRankName('');
  };

  const getCardDisplay = (card: string) => {
    const [value, suit] = card.split('_');
    const suitSymbols: Record<string, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    const suitColors: Record<string, string> = {
      hearts: 'text-red-500',
      diamonds: 'text-red-500',
      clubs: 'text-gray-900',
      spades: 'text-gray-900'
    };
    return { value, symbol: suitSymbols[suit], color: suitColors[suit] };
  };

  // Lobby View
  if (gamePhase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Teen Patti</h1>
            <Badge className="ml-auto bg-yellow-500 text-black">
              ₹{walletBalance.toFixed(0)}
            </Badge>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" /> Join Table
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {FIXED_TABLES.map(table => (
                <Card 
                  key={table.id} 
                  className="bg-gradient-to-br from-purple-600/50 to-indigo-600/50 border-purple-400/30 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => joinTable(table)}
                >
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold text-sm">{table.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-400 text-lg font-bold mt-1">
                      <Coins className="w-4 h-4" />
                      ₹{table.minBet}
                    </div>
                    <p className="text-purple-200 text-xs mt-1">Max: ₹{table.maxBet}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border-yellow-400/30">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">Create Custom Table</h3>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={customBetAmount}
                  onChange={(e) => setCustomBetAmount(Number(e.target.value))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter bet amount"
                  min={10}
                />
                <Button 
                  onClick={createCustomTable}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Waiting View
  if (gamePhase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold">Finding Players...</h2>
          <p className="text-purple-200 mt-2">Table: {selectedTable?.name}</p>
          <p className="text-yellow-400 mt-1">Boot: ₹{currentBet}</p>
        </div>
      </div>
    );
  }

  // Game View - 3D Casino Style
  if (gamePhase === 'playing') {
    const topPlayer = players.find(p => p.position === 2);
    const leftPlayer = players.find(p => p.position === 1);
    const rightPlayer = players.find(p => p.position === 3);
    const bottomPlayer = players.find(p => p.position === 0);

    return (
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #2d1b4e 0%, #4a1942 50%, #2d1b4e 100%)'
      }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`
        }} />
        
        {/* Header */}
        <div className="relative z-20 flex justify-between items-center p-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white bg-red-600/80 rounded-full w-10 h-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <div className="bg-amber-600/80 rounded-full p-2">
              <Gift className="w-5 h-5 text-yellow-300" />
            </div>
          </div>
          <Badge className="bg-green-500 text-white px-3 py-1 text-sm font-bold">
            ₹{walletBalance.toFixed(0)}
          </Badge>
        </div>

        {/* 3D Table Container */}
        <div className="relative mt-4" style={{ perspective: '1000px' }}>
          {/* Table */}
          <div className="relative mx-auto" style={{
            width: '95%',
            maxWidth: '400px',
            height: '320px',
            transform: 'rotateX(15deg)',
            transformStyle: 'preserve-3d'
          }}>
            {/* Table Outer Ring */}
            <div className="absolute inset-0 rounded-[50%] shadow-2xl" style={{
              background: 'linear-gradient(180deg, #8B4513 0%, #5D3A1A 50%, #3d2512 100%)',
              border: '4px solid #d4a574'
            }} />
            
            {/* Table Felt */}
            <div className="absolute rounded-[50%] shadow-inner" style={{
              top: '8%',
              left: '4%',
              right: '4%',
              bottom: '8%',
              background: 'radial-gradient(ellipse at center, #c41e3a 0%, #8b0000 60%, #5c0000 100%)',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)'
            }}>
              {/* Table Pattern */}
              <div className="absolute inset-0 rounded-[50%] opacity-10" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 0h20v20H0z\'/%3E%3C/g%3E%3C/svg%3E")'
              }} />
              
              {/* Logo Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/20 text-2xl font-bold tracking-wider">TEEN PATTI</span>
              </div>
            </div>

            {/* Pot Amount - Center of Table */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-gradient-to-r from-yellow-700 to-yellow-600 rounded-full px-4 py-2 flex items-center gap-2 border-2 border-yellow-400 shadow-lg">
                <span className="text-2xl">🪙</span>
                <span className="text-white font-bold text-lg">{potAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Top Player (Dealer Position) */}
            {topPlayer && (
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10" style={{ top: '-20px' }}>
                <PlayerSlot player={topPlayer} showCards={showCards} position="top" />
              </div>
            )}

            {/* Left Player */}
            {leftPlayer && (
              <div className="absolute transform z-10" style={{ left: '-10px', top: '40%' }}>
                <PlayerSlot player={leftPlayer} showCards={showCards} position="left" />
              </div>
            )}

            {/* Right Player */}
            {rightPlayer && (
              <div className="absolute transform z-10" style={{ right: '-10px', top: '40%' }}>
                <PlayerSlot player={rightPlayer} showCards={showCards} position="right" />
              </div>
            )}
          </div>
        </div>

        {/* Dealing Animation */}
        {dealingAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="text-white text-2xl font-bold animate-pulse">
              Dealing Cards...
            </div>
          </div>
        )}

        {/* My Player Section - Bottom */}
        <div className="fixed bottom-40 left-0 right-0 flex flex-col items-center z-20">
          {/* My Avatar */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-3xl border-3 border-yellow-400 shadow-lg">
                😎
              </div>
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                D
              </div>
            </div>
          </div>

          {/* My Cards */}
          <div className="flex justify-center -space-x-2 relative">
            {myCards.map((card, index) => (
              <div 
                key={index} 
                className="relative transform transition-all duration-300 hover:scale-110 hover:-translate-y-4"
                style={{ 
                  transform: `rotate(${(index - 1) * 8}deg)`,
                  zIndex: index
                }}
              >
                <TeenPattiCard3D 
                  card={showCards || isSeen ? card : 'back'} 
                  isFlipped={showCards || isSeen}
                  delay={index * 0.2}
                  large
                />
              </div>
            ))}
            
            {/* SEE Button on Cards */}
            {!isSeen && !showCards && (
              <button 
                onClick={seeCards}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white font-bold px-4 py-1 rounded text-sm shadow-lg hover:bg-green-600 transition-colors z-10"
              >
                SEE
              </button>
            )}
          </div>

          {/* Hand Rank & Balance */}
          <div className="mt-2 text-center">
            {handRankName && (
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-3 py-1 rounded font-bold text-sm mb-1">
                {handRankName}
              </div>
            )}
            <div className="text-yellow-400 font-bold text-lg">{(walletBalance / 100000).toFixed(2)}L</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-3 z-30">
          {/* Bet Info */}
          {isMyTurn && (
            <div className="flex justify-center mb-2">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-center">
                <div className="font-bold text-lg">₹{isSeen ? currentBet * 4 : currentBet * 2}</div>
                <div className="text-xs">2X CHAAL</div>
              </div>
            </div>
          )}
          
          {isMyTurn ? (
            <div className="flex gap-2 justify-center max-w-md mx-auto">
              <Button 
                onClick={fold}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg rounded-xl"
              >
                PACK
              </Button>
              <Button 
                onClick={() => placeBet(currentBet)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-lg rounded-xl"
              >
                <div className="text-center">
                  <div>₹{isSeen ? currentBet * 2 : currentBet}</div>
                  <div className="text-xs">CHAAL</div>
                </div>
              </Button>
              <Button 
                onClick={showdown}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 text-lg rounded-xl"
              >
                SIDE<br/>SHOW
              </Button>
            </div>
          ) : (
            <div className="text-center text-white py-4 bg-black/40 rounded-xl max-w-md mx-auto">
              <div className="animate-pulse">Waiting for other players...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result View
  if (gamePhase === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-purple-600/50 to-indigo-600/50 border-yellow-400/50">
          <CardContent className="p-6 text-center">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${winner?.id === 'player' ? 'text-yellow-400' : 'text-gray-400'}`} />
            <h2 className="text-2xl font-bold text-white mb-2">
              {winner?.id === 'player' ? 'You Won!' : `${winner?.name} Won!`}
            </h2>
            <p className="text-yellow-400 text-3xl font-bold mb-4">₹{potAmount}</p>
            
            <div className="space-y-3 mb-6">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-black/30 rounded-lg p-2">
                  <span className={`text-white ${player.isFolded ? 'line-through opacity-50' : ''}`}>
                    {player.name}
                  </span>
                  <div className="flex gap-1">
                    {player.cards.map((card, i) => {
                      const { value, symbol, color } = getCardDisplay(card);
                      return (
                        <div key={i} className="w-8 h-10 bg-white rounded flex flex-col items-center justify-center text-xs">
                          <span className={color}>{value}</span>
                          <span className={color}>{symbol}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={playAgain} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <RefreshCw className="w-4 h-4 mr-2" /> Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

// Player Slot Component
const PlayerSlot: React.FC<{ player: Player; showCards: boolean; position: string }> = ({ player, showCards, position }) => {
  const getCardDisplay = (card: string) => {
    const [value, suit] = card.split('_');
    const suitSymbols: Record<string, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return { value, symbol: suitSymbols[suit] || '' };
  };

  return (
    <div className="flex flex-col items-center">
      {/* Cards */}
      <div className="flex -space-x-4 mb-1">
        {player.cards.map((card, i) => (
          <div 
            key={i} 
            className="w-8 h-12 rounded shadow-md transform"
            style={{ transform: `rotate(${(i - 1) * 10}deg)` }}
          >
            {showCards ? (
              <div className="w-full h-full bg-white rounded flex flex-col items-center justify-center text-xs border border-gray-200">
                <span className={card.includes('hearts') || card.includes('diamonds') ? 'text-red-500' : 'text-gray-900'}>
                  {getCardDisplay(card).value}
                </span>
                <span className={card.includes('hearts') || card.includes('diamonds') ? 'text-red-500' : 'text-gray-900'}>
                  {getCardDisplay(card).symbol}
                </span>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-900 rounded border-2 border-red-400 flex items-center justify-center">
                <div className="w-5 h-7 border border-red-300 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-300 rounded-full" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Status Badge */}
      <div className={`px-2 py-0.5 rounded text-xs font-bold mb-1 ${
        player.isFolded ? 'bg-gray-600 text-gray-300' : 
        player.isSeen ? 'bg-green-500 text-white' : 'bg-yellow-600 text-white'
      }`}>
        {player.isFolded ? 'Packed' : player.isSeen ? 'Seen' : 'Blind'}
      </div>
      
      {/* Avatar & Name */}
      <div className="relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 shadow-lg ${
          player.isFolded ? 'bg-gray-600 border-gray-400 opacity-60' : 'bg-gradient-to-br from-purple-500 to-purple-700 border-yellow-400'
        }`}>
          {player.avatar}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center">
          <Gift className="w-3 h-3 text-yellow-900" />
        </div>
      </div>
      
      {/* Name & Bet */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded px-2 py-0.5 mt-1 text-center min-w-[70px]">
        <div className="text-white text-xs font-semibold truncate">{player.name}</div>
        {!player.isFolded && (
          <div className="flex items-center justify-center gap-1">
            <span className="text-green-400 text-xs font-bold">₹</span>
            <span className="text-white text-xs font-bold">{player.bet.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeenPattiGame;
