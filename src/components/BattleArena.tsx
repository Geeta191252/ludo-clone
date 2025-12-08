import { useState, useEffect, useCallback } from "react";
import { Info, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import rupeeIcon from "@/assets/rupee-icon.png";
import BattleDetailView from "./BattleDetailView";

interface OpenBattle {
  id: string;
  creatorId: string;
  creatorName: string;
  entryFee: number;
  prize: number;
}

interface RunningBattle {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  entryFee: number;
  prize: number;
  roomCode?: string;
}

interface BattleArenaProps {
  gameName: string;
  onClose: () => void;
  balance?: number;
  onBalanceChange?: (balance: number) => void;
}

const RupeeIcon = ({ className = "w-5 h-4" }: { className?: string }) => (
  <img src={rupeeIcon} alt="₹" className={className} />
);

// Get current user ID
const getCurrentUserId = () => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.mobile || userData.id || 'GUEST';
    }
  } catch (e) {
    console.error('Error getting user ID:', e);
  }
  return 'GUEST_' + Math.random().toString(36).substring(7);
};

// Get current user name
const getCurrentUserName = () => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.name || userData.mobile?.slice(-6) || 'YOU';
    }
  } catch (e) {
    console.error('Error getting user name:', e);
  }
  return 'YOU';
};

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

const BattleArena = ({ gameName, onClose, balance = 10000, onBalanceChange }: BattleArenaProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<RunningBattle | null>(null);
  const [openBattles, setOpenBattles] = useState<OpenBattle[]>([]);
  const [runningBattles, setRunningBattles] = useState<RunningBattle[]>([]);
  
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // Fetch battles from server
  const fetchBattles = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/ludo-battles.php');
      const data = await response.json();
      
      if (data.success) {
        // Mark current user's battles
        const openWithMarker = data.openBattles.map((b: OpenBattle) => ({
          ...b,
          creatorId: b.creatorId === currentUserId ? 'YOU' : b.creatorId,
          creatorName: b.creatorId === currentUserId ? 'YOU' : b.creatorName
        }));
        
        const runningWithMarker = data.runningBattles.map((b: RunningBattle) => ({
          ...b,
          player1: {
            ...b.player1,
            id: b.player1.id === currentUserId ? 'YOU' : b.player1.id,
            name: b.player1.id === currentUserId ? 'YOU' : b.player1.name
          },
          player2: {
            ...b.player2,
            id: b.player2.id === currentUserId ? 'YOU' : b.player2.id,
            name: b.player2.id === currentUserId ? 'YOU' : b.player2.name
          }
        }));
        
        setOpenBattles(openWithMarker);
        setRunningBattles(runningWithMarker);
      }
    } catch (error) {
      console.error('Error fetching battles:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBattles();
  }, [fetchBattles]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchBattles, 3000);
    return () => clearInterval(interval);
  }, [fetchBattles]);

  const handleCreateBattle = async () => {
    const entryFee = parseInt(amount);
    if (!entryFee || entryFee < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum entry fee is ₹50",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/ludo-battles.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          creatorId: currentUserId,
          creatorName: currentUserName,
          entryFee
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAmount("");
        toast({
          title: "Battle Created!",
          description: `Entry Fee: ₹${entryFee} | Prize: ₹${data.battle.prize}`,
        });
        fetchBattles();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create battle",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating battle:', error);
      toast({
        title: "Error",
        description: "Failed to create battle",
        variant: "destructive",
      });
    }
  };

  const handleCancelBattle = async (battle: OpenBattle) => {
    try {
      const response = await fetch('/api/ludo-battles.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          battleId: battle.id,
          creatorId: currentUserId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Battle Cancelled",
          description: "Your battle has been cancelled",
        });
        fetchBattles();
      }
    } catch (error) {
      console.error('Error cancelling battle:', error);
    }
  };

  // Creator clicks Start - move to running
  const handleStartBattle = (battle: OpenBattle) => {
    toast({
      title: "Waiting for opponent",
      description: "Your battle will start when someone joins",
    });
  };

  const handlePlayBattle = async (battle: OpenBattle) => {
    if (balance < battle.entryFee) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${battle.entryFee} to play this battle`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Join the battle
      const response = await fetch('/api/ludo-battles.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          battleId: battle.id,
          opponentId: currentUserId,
          opponentName: currentUserName
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Deduct entry fee
        const newBalance = await updateServerBalance(battle.entryFee, 'deduct');
        if (newBalance !== null) {
          onBalanceChange?.(newBalance);
        } else {
          onBalanceChange?.(balance - battle.entryFee);
        }
        
        toast({
          title: "Battle Joined!",
          description: `₹${battle.entryFee} deducted. Battle is now running!`,
        });
        fetchBattles();
      } else {
        toast({
          title: "Error",
          description: data.message || "Battle not available",
          variant: "destructive",
        });
        fetchBattles();
      }
    } catch (error) {
      console.error('Error joining battle:', error);
      toast({
        title: "Error",
        description: "Failed to join battle",
        variant: "destructive",
      });
    }
  };

  const handleRoomCodeSent = (battleId: string, code: string) => {
    setRunningBattles(prev => 
      prev.map(b => b.id === battleId ? { ...b, roomCode: code } : b)
    );
    if (selectedBattle && selectedBattle.id === battleId) {
      setSelectedBattle({ ...selectedBattle, roomCode: code });
    }
  };

  if (selectedBattle) {
    return (
      <BattleDetailView 
        battle={selectedBattle}
        onBack={() => setSelectedBattle(null)}
        onSendCode={(code) => handleRoomCodeSent(selectedBattle.id, code)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Create Battle Section */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="font-semibold text-center flex-1 text-gray-900">CREATE A BATTLE!!</h2>
          <button className="flex items-center gap-1 text-sm text-gray-500">
            RULES <Info className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-white border-gray-300 text-gray-900"
          />
          <Button 
            onClick={handleCreateBattle}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            SET
          </Button>
        </div>
      </div>

      {/* Open Battles */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-green-600">Open Battles</h3>
          </div>
          <RefreshCw 
            className={`w-4 h-4 text-gray-400 cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`} 
            onClick={fetchBattles}
          />
        </div>
        
        <div className="space-y-3">
          {openBattles.length === 0 && (
            <p className="text-center text-gray-500 py-4">No open battles. Create one!</p>
          )}
          {openBattles.map((battle, index) => (
            <div 
              key={battle.id} 
              className="bg-gray-200 rounded-xl overflow-hidden transition-all duration-300"
              style={{ 
                animation: index === 0 && isRefreshing ? 'slideIn 0.3s ease-out' : 'none'
              }}
            >
              <div className="flex items-center justify-between p-3 pb-2">
                <span className="text-sm text-gray-700">
                  Challange From <span className="text-green-600 font-bold">{battle.creatorName}</span>
                </span>
                {battle.creatorId === "YOU" ? (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white px-4"
                      onClick={() => handleStartBattle(battle)}
                    >
                      Start
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-red-500 hover:bg-red-600 text-white px-4"
                      onClick={() => handleCancelBattle(battle)}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handlePlayBattle(battle)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6"
                  >
                    Play
                  </Button>
                )}
              </div>
              
              <div className="bg-gray-100 p-3 flex items-center justify-between">
                <div>
                  <span className="text-green-600 text-xs font-medium">ENTRY FEE</span>
                  <div className="flex items-center gap-1">
                    <RupeeIcon className="w-5 h-4" />
                    <span className="text-gray-800 font-bold text-lg">{battle.entryFee}</span>
                  </div>
                </div>
                
                {battle.creatorId === "YOU" && (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center">
                      <span className="text-xl">😊</span>
                    </div>
                    <span className="text-xs text-gray-700 font-medium mt-1">Waiting...</span>
                  </div>
                )}
                
                <div className={battle.creatorId === "YOU" ? "" : "ml-auto"}>
                  <span className="text-green-600 text-xs font-medium">PRIZE</span>
                  <div className="flex items-center gap-1">
                    <RupeeIcon className="w-5 h-4" />
                    <span className="text-gray-800 font-bold text-lg">{battle.prize}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Running Battles */}
      <div className="p-4 pb-32 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-green-600">Running Battles</h3>
          </div>
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
        
        <div className="space-y-3">
          {runningBattles.length === 0 && (
            <p className="text-center text-gray-500 py-4">No running battles</p>
          )}
          {runningBattles.map((battle, index) => (
            <div 
              key={battle.id} 
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-all duration-300"
              style={{ 
                animation: index === 0 && isRefreshing ? 'slideIn 0.3s ease-out' : 'none'
              }}
            >
              <div className="flex items-center justify-between mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">PLAYING FOR</span>
                  <RupeeIcon className="w-5 h-4" />
                  <span className="font-medium text-gray-800">{battle.entryFee}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">PRIZE</span>
                  <RupeeIcon className="w-5 h-4" />
                  <span className="font-medium text-gray-800">{battle.prize}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center mb-1">
                    <span className="text-2xl">👤</span>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{battle.player1.name}</span>
                </div>
                
                <div className="flex items-center justify-center">
                  {(battle.player1.id === "YOU" || battle.player2.id === "YOU") ? (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white px-6"
                      onClick={() => setSelectedBattle(battle)}
                    >
                      View
                    </Button>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VS</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center mb-1">
                    <span className="text-2xl">👤</span>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{battle.player2.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BattleArena;
