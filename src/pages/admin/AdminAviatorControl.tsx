import { useState, useEffect, useRef } from "react";
import { Plane, Zap, Target, Play, Pause, RotateCcw, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "@/hooks/use-toast";

const API_BASE = "https://rajasthanludo.com/api";

const AdminAviatorControl = () => {
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    multiplier: 1.00,
    timer: 15,
    round_number: 1,
    admin_control: 0,
    target_crash: null as number | null,
    history: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [targetCrash, setTargetCrash] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin-aviator-control.php?action=get_state`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.status && data.state) {
        setGameState({
          phase: data.state.phase || 'waiting',
          multiplier: parseFloat(data.state.multiplier) || 1.00,
          timer: parseInt(data.state.timer) || 15,
          round_number: parseInt(data.state.round_number) || 1,
          admin_control: parseInt(data.state.admin_control) || 0,
          target_crash: data.state.target_crash ? parseFloat(data.state.target_crash) : null,
          history: Array.isArray(data.state.history) ? data.state.history : []
        });
        setAutoMode(data.state.admin_control !== 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchGameState();
    pollRef.current = setInterval(fetchGameState, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCrashNow = async () => {
    if (gameState.phase !== 'flying') {
      toast({ title: "Error", description: "Plane is not flying!", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin-aviator-control.php?action=crash_now`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "✅ Plane Crashed!", description: `Crashed at ${data.crash_point}x` });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to crash plane", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSetTargetCrash = async (value?: number) => {
    const target = value || parseFloat(targetCrash);
    
    if (!target || target < 1.01) {
      toast({ title: "Error", description: "Target must be at least 1.01x", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin-aviator-control.php?action=set_target_crash`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ target })
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "✅ Target Set!", description: `Plane will crash at ${target}x` });
        setTargetCrash("");
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to set target", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleToggleAutoMode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin-aviator-control.php?action=toggle_auto`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ auto: !autoMode })
      });
      const data = await response.json();
      
      if (data.status) {
        setAutoMode(!autoMode);
        toast({ 
          title: autoMode ? "🔧 Manual Control Enabled" : "🤖 Auto Mode Enabled",
          description: data.message
        });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle mode", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleStartRound = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin-aviator-control.php?action=start_round`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "🛫 Round Started!", description: "Plane is now flying" });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to start round", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleResetGame = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin-aviator-control.php?action=reset_game`, {
        method: 'POST',
        headers: getAuthHeaders()
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
      case 'flying': return 'text-green-400';
      case 'crashed': return 'text-red-400';
      case 'waiting': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'flying': return 'FLYING';
      case 'crashed': return 'CRASHED';
      case 'waiting': return 'WAITING';
      default: return phase?.toUpperCase() || 'UNKNOWN';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Plane className="w-6 h-6 text-cyan-400" />
              Aviator Control Panel
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">Full control over the Aviator game</p>
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
            <button
              onClick={handleToggleAutoMode}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                autoMode 
                  ? "border border-green-500 text-green-400 bg-transparent" 
                  : "bg-orange-600 text-white"
              }`}
            >
              {autoMode ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {autoMode ? "Auto Mode ON" : "Manual Control"}
            </button>
          </div>
        </div>

        {/* Target Crash Indicator */}
        {gameState.target_crash && (
          <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3 flex items-center justify-between">
            <span className="text-orange-400 text-sm">
              🎯 Target crash set: <strong>{gameState.target_crash}x</strong>
            </span>
            <button 
              onClick={() => handleSetTargetCrash(0)}
              className="text-orange-400 hover:text-orange-300 text-xs underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Current Game Status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Current Phase</p>
            <p className={`text-sm sm:text-lg font-bold ${getPhaseColor(gameState.phase)}`}>
              {getPhaseLabel(gameState.phase)}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Multiplier</p>
            <p className="text-lg sm:text-xl font-bold text-cyan-400">
              {gameState.multiplier.toFixed(2)}x
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Timer</p>
            <p className="text-sm sm:text-lg font-bold text-white">
              {gameState.timer}s
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-slate-400 text-xs mb-1">Round</p>
            <p className="text-sm sm:text-lg font-bold text-purple-400">
              #{gameState.round_number}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Instant Crash */}
          <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700 rounded-lg p-4">
            <h3 className="text-white flex items-center gap-2 text-sm font-semibold mb-2">
              <Zap className="w-4 h-4 text-red-400" />
              Instant Crash
            </h3>
            <p className="text-slate-300 text-xs mb-3">
              Crash the plane immediately at the current multiplier
            </p>
            <button
              onClick={handleCrashNow}
              disabled={loading || gameState.phase !== 'flying'}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {loading ? 'Processing...' : 'CRASH NOW!'}
            </button>
            {gameState.phase !== 'flying' && (
              <p className="text-yellow-400 text-xs text-center mt-2">
                Only available when plane is flying
              </p>
            )}
          </div>

          {/* Target Crash */}
          <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-700 rounded-lg p-4">
            <h3 className="text-white flex items-center gap-2 text-sm font-semibold mb-2">
              <Target className="w-4 h-4 text-orange-400" />
              Set Target Crash Point
            </h3>
            <p className="text-slate-300 text-xs mb-3">
              Set a specific multiplier at which the plane will crash
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="0.01"
                min="1.01"
                max="100"
                placeholder="e.g., 2.50"
                value={targetCrash}
                onChange={(e) => setTargetCrash(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2"
              />
              <button
                onClick={() => handleSetTargetCrash()}
                disabled={loading || !targetCrash}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
              >
                {loading ? '...' : 'Set'}
              </button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {[1.5, 2.0, 3.0, 5.0, 10.0].map((val) => (
                <button
                  key={val}
                  onClick={() => handleSetTargetCrash(val)}
                  disabled={loading}
                  className="border border-orange-600 text-orange-400 hover:bg-orange-600/20 disabled:opacity-50 px-2 py-1 rounded text-xs"
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>

          {/* Start Round */}
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700 rounded-lg p-4">
            <h3 className="text-white flex items-center gap-2 text-sm font-semibold mb-2">
              <Play className="w-4 h-4 text-green-400" />
              Start Round
            </h3>
            <p className="text-slate-300 text-xs mb-3">
              Manually start a new round (skip waiting phase)
            </p>
            <button
              onClick={handleStartRound}
              disabled={loading || gameState.phase === 'flying'}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Starting...' : 'Start Flying'}
            </button>
          </div>

          {/* Reset Game */}
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700 rounded-lg p-4">
            <h3 className="text-white flex items-center gap-2 text-sm font-semibold mb-2">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              Reset Game
            </h3>
            <p className="text-slate-300 text-xs mb-3">
              Reset the game to waiting phase with fresh round
            </p>
            <button
              onClick={handleResetGame}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? 'Resetting...' : 'Reset Game'}
            </button>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white flex items-center gap-2 text-sm font-semibold mb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Recent Crash History
          </h3>
          <div className="flex gap-1 flex-wrap">
            {gameState.history.length > 0 ? (
              gameState.history.map((crash, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    crash >= 2 ? 'bg-green-500/20 text-green-400' :
                    crash >= 1.5 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}
                >
                  {Number(crash).toFixed(2)}x
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-xs">No history yet</span>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAviatorControl;
