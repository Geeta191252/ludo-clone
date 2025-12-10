import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Users, Coins, Eye, EyeOff, Trophy, RefreshCw } from 'lucide-react';
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

  // Generate random cards
  const generateDeck = (): string[] => {
    const deck: string[] = [];
    CARD_SUITS.forEach(suit => {
      CARD_VALUES.forEach(value => {
        deck.push(`${value}_${suit}`);
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const dealCards = () => {
    setDealingAnimation(true);
    const deck = generateDeck();
    const newPlayers: Player[] = [
      { id: 'player', name: 'You', cards: deck.slice(0, 3), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: true, position: 0 },
      { id: 'bot1', name: 'Raju', cards: deck.slice(3, 6), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 1 },
      { id: 'bot2', name: 'Priya', cards: deck.slice(6, 9), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 2 },
      { id: 'bot3', name: 'Amit', cards: deck.slice(9, 12), bet: currentBet, isFolded: false, isSeen: false, isCurrentTurn: false, position: 3 },
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
    
    // Simulate finding players
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
    
    // Bot turns
    simulateBotTurns(betAmount);
  };

  const fold = () => {
    setPlayers(prev => prev.map(p => 
      p.id === 'player' ? { ...p, isFolded: true } : p
    ));
    toast.error('You folded!');
    
    setTimeout(() => {
      endGame(players.find(p => p.id !== 'player' && !p.isFolded) || players[1]);
    }, 1000);
  };

  const simulateBotTurns = (playerBet: number) => {
    setIsMyTurn(false);
    
    let delay = 500;
    players.forEach((player, index) => {
      if (player.id !== 'player' && !player.isFolded) {
        setTimeout(() => {
          const shouldFold = Math.random() < 0.15;
          const shouldSee = Math.random() < 0.3;
          
          if (shouldFold) {
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, isFolded: true } : p
            ));
            toast.info(`${player.name} folded!`);
          } else {
            const botBet = shouldSee ? playerBet * 2 : playerBet;
            setPotAmount(prev => prev + botBet);
            setPlayers(prev => prev.map(p => 
              p.id === player.id ? { ...p, bet: p.bet + botBet, isSeen: shouldSee } : p
            ));
            if (shouldSee) {
              toast.info(`${player.name} saw their cards!`);
            }
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
    
    // Trail (Three of a kind)
    if (isTriple) return 6000 + values[0];
    // Pure Sequence (Straight Flush)
    if (isFlush && isSequence) return 5000 + values[0];
    // Sequence (Straight)
    if (isSequence) return 4000 + values[0];
    // Color (Flush)
    if (isFlush) return 3000 + values[0] * 100 + values[1];
    // Pair
    if (isPair) return 2000 + Math.max(values[0] === values[1] ? values[0] : values[1], values[1] === values[2] ? values[1] : values[0]) * 10;
    // High Card
    return values[0] * 100 + values[1] * 10 + values[2];
  };

  const showdown = () => {
    setShowCards(true);
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

          {/* Fixed Tables */}
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

          {/* Custom Table */}
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
          <p className="text-yellow-400 mt-1">Bet: ₹{currentBet}</p>
        </div>
      </div>
    );
  }

  // Game View
  if (gamePhase === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-emerald-900 relative overflow-hidden">
        {/* Table */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[90vw] h-[60vh] bg-gradient-to-br from-green-700 to-green-800 rounded-[50%] border-8 border-yellow-600 shadow-2xl" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="bg-black/40 rounded-full px-4 py-2 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">Pot: ₹{potAmount}</span>
          </div>
          <Badge className="bg-yellow-500 text-black">₹{walletBalance.toFixed(0)}</Badge>
        </div>

        {/* Other Players */}
        <div className="relative z-10 flex justify-center gap-4 mt-4">
          {players.filter(p => p.id !== 'player').map((player, index) => (
            <div key={player.id} className="text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-xl border-2 ${player.isFolded ? 'opacity-50 border-gray-500' : 'border-yellow-400'}`}>
                {player.name[0]}
              </div>
              <p className="text-white text-sm mt-1">{player.name}</p>
              {player.isFolded ? (
                <Badge variant="destructive" className="text-xs">Folded</Badge>
              ) : (
                <Badge className="bg-green-500 text-xs">₹{player.bet}</Badge>
              )}
              {/* Bot Cards (hidden or shown) */}
              <div className="flex gap-1 mt-2 justify-center">
                {player.cards.map((card, i) => (
                  <div key={i} className="w-8 h-12 relative">
                    <TeenPattiCard3D 
                      card={showCards ? card : 'back'} 
                      isFlipped={showCards}
                      delay={i * 0.2}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dealing Animation */}
        {dealingAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="text-white text-2xl font-bold animate-pulse">
              Dealing Cards...
            </div>
          </div>
        )}

        {/* My Cards */}
        <div className="fixed bottom-32 left-0 right-0 flex justify-center gap-2 z-20">
          {myCards.map((card, index) => (
            <div 
              key={index} 
              className="w-20 h-28 relative transform hover:scale-110 hover:-translate-y-2 transition-all cursor-pointer"
              style={{ transform: `rotate(${(index - 1) * 5}deg)` }}
            >
              <TeenPattiCard3D 
                card={showCards || isSeen ? card : 'back'} 
                isFlipped={showCards || isSeen}
                delay={index * 0.3}
                large
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="fixed bottom-4 left-0 right-0 p-4 z-30">
          <div className="max-w-md mx-auto bg-black/60 rounded-2xl p-4 backdrop-blur-sm">
            {isMyTurn ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {!isSeen && (
                    <Button 
                      onClick={seeCards}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      <Eye className="w-4 h-4 mr-1" /> See Cards
                    </Button>
                  )}
                  <Button 
                    onClick={() => placeBet(currentBet)}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <Coins className="w-4 h-4 mr-1" /> 
                    Bet ₹{isSeen ? currentBet * 2 : currentBet}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => placeBet(currentBet * 2)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    Raise ₹{isSeen ? currentBet * 4 : currentBet * 2}
                  </Button>
                  <Button 
                    onClick={fold}
                    variant="destructive"
                    className="flex-1"
                  >
                    Fold
                  </Button>
                </div>
                <Button 
                  onClick={showdown}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  <Trophy className="w-4 h-4 mr-1" /> Show
                </Button>
              </div>
            ) : (
              <div className="text-center text-white py-4">
                <div className="animate-pulse">Waiting for other players...</div>
              </div>
            )}
          </div>
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
            
            {/* Show all cards */}
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

export default TeenPattiGame;
