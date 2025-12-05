import { useState, useEffect } from "react";
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

// Random name generator
const generateRandomName = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const BattleArena = ({ gameName, onClose, balance = 10000, onBalanceChange }: BattleArenaProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<RunningBattle | null>(null);
  const [openBattles, setOpenBattles] = useState<OpenBattle[]>([
    { id: "1", creatorId: "2FD2O376", creatorName: "2FD2O376", entryFee: 100, prize: 197 },
    { id: "2", creatorId: "U8TPK996", creatorName: "U8TPK996", entryFee: 2300, prize: 4531 },
    { id: "3", creatorId: "I8IAK589", creatorName: "I8IAK589", entryFee: 300, prize: 591 },
    { id: "4", creatorId: "I4JAK7415", creatorName: "I4JAK7415", entryFee: 500, prize: 985 },
    { id: "5", creatorId: "VPLAY123", creatorName: "VPLAY123", entryFee: 50, prize: 98 },
  ]);
  
  const [runningBattles, setRunningBattles] = useState<RunningBattle[]>([
    { id: "r1", player1: { id: "HJALD17N", name: "HJALD17N" }, player2: { id: "AKYEFUV9", name: "AKYEFUV9" }, entryFee: 500, prize: 985 },
    { id: "r2", player1: { id: "70N7K5Q0", name: "70N7K5Q0" }, player2: { id: "634IR8ZU", name: "634IR8ZU" }, entryFee: 250, prize: 492 },
    { id: "r3", player1: { id: "S10XRUBJ", name: "S10XRUBJ" }, player2: { id: "TRTXBKFF", name: "TRTXBKFF" }, entryFee: 100, prize: 197 },
  ]);

  // Auto-refresh every 5 seconds to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      
      // Simulate new battles being added
      setTimeout(() => {
        // Randomly add a new open battle
        if (Math.random() > 0.5 && openBattles.length < 10) {
          const amounts = [50, 100, 150, 200, 250, 300, 500, 1000];
          const entryFee = amounts[Math.floor(Math.random() * amounts.length)];
          const newBattle: OpenBattle = {
            id: `battle_${Date.now()}`,
            creatorId: generateRandomName(),
            creatorName: generateRandomName(),
            entryFee,
            prize: Math.floor(entryFee * 2 - entryFee * 0.05), // 5% commission from one user only
          };
          setOpenBattles(prev => [newBattle, ...prev.slice(0, 9)]);
        }
        
        // Randomly move an open battle to running
        if (Math.random() > 0.7 && openBattles.length > 3) {
          const battleToMove = openBattles[Math.floor(Math.random() * Math.min(3, openBattles.length))];
          if (battleToMove && battleToMove.creatorId !== "YOU") {
            setOpenBattles(prev => prev.filter(b => b.id !== battleToMove.id));
            const newRunning: RunningBattle = {
              id: `running_${Date.now()}`,
              player1: { id: battleToMove.creatorId, name: battleToMove.creatorName },
              player2: { id: generateRandomName(), name: generateRandomName() },
              entryFee: battleToMove.entryFee,
              prize: battleToMove.prize,
            };
            setRunningBattles(prev => [newRunning, ...prev.slice(0, 9)]);
          }
        }
        
        setIsRefreshing(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [openBattles]);

  const handleCreateBattle = () => {
    const entryFee = parseInt(amount);
    if (!entryFee || entryFee < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum entry fee is ₹50",
        variant: "destructive",
      });
      return;
    }

    const prize = Math.floor(entryFee * 2 - entryFee * 0.05); // 5% commission from one user only
    const newBattle: OpenBattle = {
      id: `battle_${Date.now()}`,
      creatorId: "YOU",
      creatorName: "YOU",
      entryFee,
      prize,
    };

    setOpenBattles([newBattle, ...openBattles]);
    setAmount("");
    toast({
      title: "Battle Created!",
      description: `Entry Fee: ₹${entryFee} | Prize: ₹${prize}`,
    });
  };

  // Creator clicks Start - move to running and show Set Room Code screen
  const handleStartBattle = (battle: OpenBattle) => {
    setOpenBattles(openBattles.filter(b => b.id !== battle.id));
    
    const newRunning: RunningBattle = {
      id: `running_${Date.now()}`,
      player1: { id: "YOU", name: "YOU" }, // Creator is player1
      player2: { id: generateRandomName(), name: generateRandomName() }, // Simulated joiner
      entryFee: battle.entryFee,
      prize: battle.prize,
    };
    
    setRunningBattles([newRunning, ...runningBattles]);
    setSelectedBattle(newRunning);
    toast({
      title: "Battle Started!",
      description: "Set room code for your opponent",
    });
  };

  const handlePlayBattle = (battle: OpenBattle) => {
    // Check if user has enough balance
    if (balance < battle.entryFee) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${battle.entryFee} to play this battle`,
        variant: "destructive",
      });
      return;
    }

    // Deduct entry fee from wallet immediately
    const newBalance = balance - battle.entryFee;
    onBalanceChange?.(newBalance);

    setOpenBattles(openBattles.filter(b => b.id !== battle.id));
    
    const newRunning: RunningBattle = {
      id: `running_${Date.now()}`,
      player1: { id: battle.creatorId, name: battle.creatorName },
      player2: { id: "YOU", name: "YOU" },
      entryFee: battle.entryFee,
      prize: battle.prize,
    };
    
    setRunningBattles([newRunning, ...runningBattles]);
    toast({
      title: "Battle Started!",
      description: `₹${battle.entryFee} deducted. Click View to see details`,
    });
  };

  const handleRoomCodeSent = (battleId: string, code: string) => {
    setRunningBattles(prev => 
      prev.map(b => b.id === battleId ? { ...b, roomCode: code } : b)
    );
    // Update selected battle with room code
    if (selectedBattle && selectedBattle.id === battleId) {
      setSelectedBattle({ ...selectedBattle, roomCode: code });
    }
  };

  // Show Battle Detail View when a battle is selected
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
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
        
        <div className="space-y-3">
          {openBattles.map((battle, index) => (
            <div 
              key={battle.id} 
              className="bg-gray-200 rounded-xl overflow-hidden transition-all duration-300"
              style={{ 
                animation: index === 0 && isRefreshing ? 'slideIn 0.3s ease-out' : 'none'
              }}
            >
              {/* Header with Challenge info and buttons */}
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
                      onClick={() => setOpenBattles(openBattles.filter(b => b.id !== battle.id))}
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
              
              {/* Entry Fee, Avatar, Prize Row */}
              <div className="bg-gray-100 p-3 flex items-center justify-between">
                <div>
                  <span className="text-green-600 text-xs font-medium">ENTRY FEE</span>
                  <div className="flex items-center gap-1">
                    <RupeeIcon className="w-5 h-4" />
                    <span className="text-gray-800 font-bold text-lg">{battle.entryFee}</span>
                  </div>
                </div>
                
                {/* Center Avatar - only show for creator's battle */}
                {battle.creatorId === "YOU" && (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center">
                      <span className="text-xl">😊</span>
                    </div>
                    <span className="text-xs text-gray-700 font-medium mt-1">{generateRandomName().slice(0,6)}</span>
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
                {/* Player 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center mb-1">
                    <span className="text-2xl">👤</span>
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{battle.player1.name}</span>
                </div>
                
                {/* VS or View Button */}
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
                
                {/* Player 2 */}
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
