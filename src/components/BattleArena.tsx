import { useState, useEffect } from "react";
import { Info, X, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import rupeeIcon from "@/assets/rupee-icon.png";

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
}

interface BattleArenaProps {
  gameName: string;
  onClose: () => void;
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

const BattleArena = ({ gameName, onClose }: BattleArenaProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const handlePlayBattle = (battle: OpenBattle) => {
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
      description: "Open the game app to play",
    });
  };

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
              className="bg-gray-100 rounded-lg p-3 transition-all duration-300"
              style={{ 
                animation: index === 0 && isRefreshing ? 'slideIn 0.3s ease-out' : 'none'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">
                  CHALLENGE FROM <span className="text-green-600 font-medium">{battle.creatorName}</span>
                </span>
                {battle.creatorId !== "YOU" && (
                  <Button 
                    size="sm" 
                    onClick={() => handlePlayBattle(battle)}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    PLAY
                  </Button>
                )}
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-pink-500 text-xs">ENTRY FEE</span>
                  <div className="flex items-center gap-1">
                    <RupeeIcon className="w-5 h-4" />
                    <span className="text-gray-600">{battle.entryFee}</span>
                  </div>
                </div>
                <div>
                  <span className="text-pink-500 text-xs">PRIZE</span>
                  <div className="flex items-center gap-1">
                    <RupeeIcon className="w-5 h-4" />
                    <span className="text-gray-600">{battle.prize}</span>
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
                  <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center mb-1">
                    <span className="text-2xl">👤</span>
                  </div>
                  <span className="text-xs text-gray-500">{battle.player1.name}</span>
                </div>
                
                {/* VS */}
                <div className="flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
                
                {/* Player 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center mb-1">
                    <span className="text-2xl">👤</span>
                  </div>
                  <span className="text-xs text-gray-500">{battle.player2.name}</span>
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
