import { useState, useEffect, useRef } from "react";
import { Crown, RefreshCw, Play, RotateCcw, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "@/hooks/use-toast";

interface BetInfo {
  mobile: string;
  username: string;
  bet_area: string;
  bet_amount: number;
}

interface BetSummary {
  dragon: { total: number; bets: BetInfo[] };
  tiger: { total: number; bets: BetInfo[] };
  tie: { total: number; bets: BetInfo[] };
}

const AdminDragonTigerControl = () => {
  const [gameState, setGameState] = useState({
    phase: 'betting',
    timer: 15,
    round_number: 1,
    dragon_card_value: null as string | null,
    tiger_card_value: null as string | null,
    winner: null as string | null,
    history: [] as any[]
  });
  const [betSummary, setBetSummary] = useState<BetSummary>({
    dragon: { total: 0, bets: [] },
    tiger: { total: 0, bets: [] },
    tie: { total: 0, bets: [] }
  });
  const [loading, setLoading] = useState(false);
  const [activePlayerCount, setActivePlayerCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGameState = async () => {
    try {
      // Try production API first, then fallback
      const apiUrl = window.location.hostname.includes('rajasthanludo.com') 
        ? 'https://rajasthanludo.com/api/game-state.php'
        : '/api/game-state.php';
      
      const response = await fetch(`${apiUrl}?game_type=dragon-tiger&_t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      const data = await response.json();
      
      console.log('Dragon Tiger API Response:', data);
      
      if (data.status && data.state) {
        setGameState({
          phase: data.state.phase || 'betting',
          timer: parseInt(data.state.timer) || 15,
          round_number: parseInt(data.state.round_number) || 1,
          dragon_card_value: data.state.dragon_card_value,
          tiger_card_value: data.state.tiger_card_value,
          winner: data.state.winner,
          history: data.state.history || []
        });
        setActivePlayerCount(data.state.active_players || 0);
        
        // Process live bets to get summary by area
        const liveBets = data.state.live_bets || [];
        console.log('Live Bets:', liveBets);
        
        const summary: BetSummary = {
          dragon: { total: 0, bets: [] },
          tiger: { total: 0, bets: [] },
          tie: { total: 0, bets: [] }
        };
        
        liveBets.forEach((bet: BetInfo) => {
          const area = bet.bet_area?.toLowerCase();
          const amount = Number(bet.bet_amount) || 0;
          console.log('Processing bet:', bet.username, area, amount);
          
          if (area === 'dragon') {
            summary.dragon.total += amount;
            summary.dragon.bets.push(bet);
          } else if (area === 'tiger') {
            summary.tiger.total += amount;
            summary.tiger.bets.push(bet);
          } else if (area === 'tie') {
            summary.tie.total += amount;
            summary.tie.bets.push(bet);
          }
        });
        
        console.log('Bet Summary:', summary);
        setBetSummary(summary);
      }
    } catch (error) {
      console.error('Dragon Tiger fetch error:', error);
    }
  };

  useEffect(() => {
    fetchGameState();
    pollRef.current = setInterval(fetchGameState, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleResetGame = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/game-state.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'dragon-tiger',
          action: 'new_round',
          round_number: gameState.round_number + 1
        })
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "🔄 Game Reset!", description: "New round starting" });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset game", variant: "destructive" });
    }
    setLoading(false);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'betting': return 'text-green-400';
      case 'dealing': return 'text-yellow-400';
      case 'result': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'betting': return 'BETTING';
      case 'dealing': return 'DEALING';
      case 'result': return 'RESULT';
      default: return phase?.toUpperCase() || 'UNKNOWN';
    }
  };

  const totalBets = betSummary.dragon.total + betSummary.tiger.total + betSummary.tie.total;
  
  // Profit/Loss Calculator
  // Dragon wins (2x): Dragon bettors get 2x, house loses dragon bets, keeps tiger+tie bets
  const dragonWinProfit = (betSummary.tiger.total + betSummary.tie.total) - betSummary.dragon.total;
  // Tiger wins (2x): Tiger bettors get 2x, house loses tiger bets, keeps dragon+tie bets
  const tigerWinProfit = (betSummary.dragon.total + betSummary.tie.total) - betSummary.tiger.total;
  // Tie wins (8x): Tie bettors get 8x, house loses 7x tie bets, keeps dragon+tiger bets
  const tieWinProfit = (betSummary.dragon.total + betSummary.tiger.total) - (betSummary.tie.total * 7);

  const handleSetWinner = async (winner: string) => {
    setLoading(true);
    try {
      const apiUrl = window.location.hostname.includes('rajasthanludo.com') 
        ? 'https://rajasthanludo.com/api/game-state.php'
        : '/api/game-state.php';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'dragon-tiger',
          action: 'set_winner',
          winner: winner,
          round_id: gameState.round_number
        })
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: `🎉 ${winner.toUpperCase()} Wins!`, description: "Winner set successfully" });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to set winner", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleAutoSetWinner = async () => {
    setLoading(true);
    try {
      const apiUrl = window.location.hostname.includes('rajasthanludo.com') 
        ? 'https://rajasthanludo.com/api/game-state.php'
        : '/api/game-state.php';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_type: 'dragon-tiger',
          action: 'auto_set_winner',
          round_id: gameState.round_number
        })
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ 
          title: `🤖 AUTO: ${data.winner?.toUpperCase()} Wins!`, 
          description: `House Profit: ₹${data.profit?.toLocaleString() || 0}` 
        });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to auto set winner", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              Dragon Tiger Control
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">Live betting stats & game control</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchGameState}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700"
              title="Refresh State"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Game Status */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Phase</p>
            <p className={`text-sm sm:text-lg font-bold ${getPhaseColor(gameState.phase)}`}>
              {getPhaseLabel(gameState.phase)}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Timer</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              {gameState.timer}s
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Round</p>
            <p className="text-sm sm:text-lg font-bold text-purple-400">
              #{gameState.round_number}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Winner</p>
            <p className={`text-sm sm:text-lg font-bold ${
              gameState.winner === 'dragon' ? 'text-orange-400' :
              gameState.winner === 'tiger' ? 'text-blue-400' :
              gameState.winner === 'tie' ? 'text-green-400' : 'text-slate-500'
            }`}>
              {gameState.winner?.toUpperCase() || '-'}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> Players
            </p>
            <p className="text-sm sm:text-lg font-bold text-cyan-400">
              {activePlayerCount}
            </p>
          </div>
        </div>

        {/* Total Bets Overview */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-amber-400 font-semibold flex items-center gap-2">
              💰 Total Bets This Round
            </h3>
            <span className="text-2xl font-bold text-amber-300">₹{totalBets.toLocaleString()}</span>
          </div>
        </div>

        {/* Bet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dragon Bets */}
          <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-orange-400 font-bold flex items-center gap-2 text-lg">
                🐲 DRAGON
              </h3>
              <span className="text-xl font-bold text-orange-300">
                ₹{betSummary.dragon.total.toLocaleString()}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-2">
              {betSummary.dragon.bets.length} bets placed
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {betSummary.dragon.bets.length > 0 ? (
                betSummary.dragon.bets.map((bet, i) => (
                  <div key={i} className="flex justify-between text-xs bg-black/20 rounded px-2 py-1">
                    <span className="text-slate-300">{bet.username || `***${bet.mobile?.slice(-4)}`}</span>
                    <span className="text-orange-400 font-medium">₹{Number(bet.bet_amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-2">No bets yet</p>
              )}
            </div>
          </div>

          {/* Tie Bets */}
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-400 font-bold flex items-center gap-2 text-lg">
                🤝 TIE (8x)
              </h3>
              <span className="text-xl font-bold text-green-300">
                ₹{betSummary.tie.total.toLocaleString()}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-2">
              {betSummary.tie.bets.length} bets placed
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {betSummary.tie.bets.length > 0 ? (
                betSummary.tie.bets.map((bet, i) => (
                  <div key={i} className="flex justify-between text-xs bg-black/20 rounded px-2 py-1">
                    <span className="text-slate-300">{bet.username || `***${bet.mobile?.slice(-4)}`}</span>
                    <span className="text-green-400 font-medium">₹{Number(bet.bet_amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-2">No bets yet</p>
              )}
            </div>
          </div>

          {/* Tiger Bets */}
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-blue-400 font-bold flex items-center gap-2 text-lg">
                🐯 TIGER
              </h3>
              <span className="text-xl font-bold text-blue-300">
                ₹{betSummary.tiger.total.toLocaleString()}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-2">
              {betSummary.tiger.bets.length} bets placed
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {betSummary.tiger.bets.length > 0 ? (
                betSummary.tiger.bets.map((bet, i) => (
                  <div key={i} className="flex justify-between text-xs bg-black/20 rounded px-2 py-1">
                    <span className="text-slate-300">{bet.username || `***${bet.mobile?.slice(-4)}`}</span>
                    <span className="text-blue-400 font-medium">₹{Number(bet.bet_amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-2">No bets yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Profit/Loss Calculator - SET WINNER */}
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700 rounded-lg p-4">
          <h3 className="text-white flex items-center gap-2 text-lg font-bold mb-4">
            📊 Profit/Loss Calculator - Winner Set Karo
          </h3>
          <p className="text-slate-300 text-xs mb-4">
            Jis pe kam bet hai woh set karo = zyada profit! Green = Profit, Red = Loss
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dragon Win Option */}
            <div className={`rounded-lg p-4 border-2 ${dragonWinProfit >= 0 ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
              <div className="text-center mb-3">
                <p className="text-orange-400 font-bold text-lg">🐲 DRAGON WINS</p>
                <p className="text-slate-400 text-xs">(2x payout)</p>
              </div>
              <div className="text-center mb-3">
                <p className="text-slate-400 text-xs">House Profit/Loss:</p>
                <p className={`text-2xl font-bold ${dragonWinProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {dragonWinProfit >= 0 ? '+' : ''}₹{dragonWinProfit.toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-slate-400 mb-3 space-y-1">
                <p>Keep: ₹{(betSummary.tiger.total + betSummary.tie.total).toLocaleString()} (Tiger+Tie)</p>
                <p>Pay: ₹{betSummary.dragon.total.toLocaleString()} (Dragon)</p>
              </div>
              <button
                onClick={() => handleSetWinner('dragon')}
                disabled={loading || gameState.phase === 'result'}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold"
              >
                🐲 SET DRAGON WINNER
              </button>
            </div>

            {/* Tie Win Option */}
            <div className={`rounded-lg p-4 border-2 ${tieWinProfit >= 0 ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
              <div className="text-center mb-3">
                <p className="text-green-400 font-bold text-lg">🤝 TIE WINS</p>
                <p className="text-slate-400 text-xs">(8x payout)</p>
              </div>
              <div className="text-center mb-3">
                <p className="text-slate-400 text-xs">House Profit/Loss:</p>
                <p className={`text-2xl font-bold ${tieWinProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tieWinProfit >= 0 ? '+' : ''}₹{tieWinProfit.toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-slate-400 mb-3 space-y-1">
                <p>Keep: ₹{(betSummary.dragon.total + betSummary.tiger.total).toLocaleString()} (Dragon+Tiger)</p>
                <p>Pay: ₹{(betSummary.tie.total * 7).toLocaleString()} (Tie x7)</p>
              </div>
              <button
                onClick={() => handleSetWinner('tie')}
                disabled={loading || gameState.phase === 'result'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold"
              >
                🤝 SET TIE WINNER
              </button>
            </div>

            {/* Tiger Win Option */}
            <div className={`rounded-lg p-4 border-2 ${tigerWinProfit >= 0 ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
              <div className="text-center mb-3">
                <p className="text-blue-400 font-bold text-lg">🐯 TIGER WINS</p>
                <p className="text-slate-400 text-xs">(2x payout)</p>
              </div>
              <div className="text-center mb-3">
                <p className="text-slate-400 text-xs">House Profit/Loss:</p>
                <p className={`text-2xl font-bold ${tigerWinProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tigerWinProfit >= 0 ? '+' : ''}₹{tigerWinProfit.toLocaleString()}
                </p>
              </div>
              <div className="text-xs text-slate-400 mb-3 space-y-1">
                <p>Keep: ₹{(betSummary.dragon.total + betSummary.tie.total).toLocaleString()} (Dragon+Tie)</p>
                <p>Pay: ₹{betSummary.tiger.total.toLocaleString()} (Tiger)</p>
              </div>
              <button
                onClick={() => handleSetWinner('tiger')}
                disabled={loading || gameState.phase === 'result'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold"
              >
                🐯 SET TIGER WINNER
              </button>
            </div>
          </div>
        </div>

        {/* AUTO SET WINNER - Best Profit Button */}
        <div className="bg-gradient-to-br from-amber-900/60 to-amber-700/40 border-2 border-amber-500 rounded-lg p-4">
          <div className="text-center mb-3">
            <h3 className="text-amber-300 font-bold text-xl flex items-center justify-center gap-2">
              🤖 AUTO SET WINNER
            </h3>
            <p className="text-amber-200/80 text-xs mt-1">
              System automatically picks winner with MAXIMUM house profit
            </p>
          </div>
          
          {/* Show recommended winner */}
          <div className="bg-black/30 rounded-lg p-3 mb-3">
            <p className="text-slate-400 text-xs text-center mb-2">Best Option Based on Current Bets:</p>
            <div className="flex justify-center gap-4 text-sm">
              <span className={`px-3 py-1 rounded ${dragonWinProfit >= tigerWinProfit && dragonWinProfit >= tieWinProfit ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                Dragon: ₹{dragonWinProfit >= 0 ? '+' : ''}{dragonWinProfit.toLocaleString()}
              </span>
              <span className={`px-3 py-1 rounded ${tigerWinProfit >= dragonWinProfit && tigerWinProfit >= tieWinProfit ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                Tiger: ₹{tigerWinProfit >= 0 ? '+' : ''}{tigerWinProfit.toLocaleString()}
              </span>
              <span className={`px-3 py-1 rounded ${tieWinProfit >= dragonWinProfit && tieWinProfit >= tigerWinProfit ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                Tie: ₹{tieWinProfit >= 0 ? '+' : ''}{tieWinProfit.toLocaleString()}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleAutoSetWinner}
            disabled={loading || gameState.phase === 'result'}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-black font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 shadow-lg"
          >
            🤖 AUTO SET WINNER (MAX PROFIT)
          </button>
        </div>

        {/* Reset Game Button */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-600 rounded-lg p-4">
          <button
            onClick={handleResetGame}
            disabled={loading}
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {loading ? 'Resetting...' : 'Reset Game / New Round'}
          </button>
        </div>

        {/* Recent History */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white flex items-center gap-2 text-sm font-semibold mb-3">
            📊 Recent Results
          </h3>
          <div className="flex gap-1 flex-wrap">
            {gameState.history.length > 0 ? (
              gameState.history.slice(0, 20).map((h: any, index: number) => {
                const winner = h.winner || h;
                return (
                  <span
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      winner === 'dragon' ? 'bg-orange-500' :
                      winner === 'tiger' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                  >
                    {winner === 'dragon' ? 'D' : winner === 'tiger' ? 'T' : 'T'}
                  </span>
                );
              })
            ) : (
              <span className="text-slate-500 text-xs">No history yet</span>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDragonTigerControl;