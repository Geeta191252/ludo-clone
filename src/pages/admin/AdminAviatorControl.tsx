import { useState, useEffect } from "react";
import { Plane, Zap, Target, Play, Pause, RotateCcw, TrendingUp, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "@/hooks/use-toast";

const AdminAviatorControl = () => {
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    multiplier: 1.00,
    timer: 15,
    round_number: 1,
    history: [5.01, 2.60, 3.45, 1.23, 8.92, 1.05, 2.34, 4.56, 1.87, 3.21]
  });
  const [loading, setLoading] = useState(false);
  const [targetCrash, setTargetCrash] = useState("");
  const [autoMode, setAutoMode] = useState(true);

  const handleCrashNow = () => {
    if (gameState.phase !== 'flying') return;
    setGameState(prev => ({
      ...prev,
      phase: 'crashed',
      history: [prev.multiplier, ...prev.history.slice(0, 14)]
    }));
    toast({ title: "Plane Crashed!", description: `Crashed at ${gameState.multiplier.toFixed(2)}x` });
  };

  const handleSetTargetCrash = () => {
    if (!targetCrash || parseFloat(targetCrash) < 1.01) {
      toast({ title: "Error", description: "Target must be at least 1.01x", variant: "destructive" });
      return;
    }
    toast({ title: "Target Set!", description: `Plane will crash at ${targetCrash}x` });
    setTargetCrash("");
  };

  const handleToggleAutoMode = () => {
    setAutoMode(!autoMode);
    toast({ 
      title: autoMode ? "Manual Control Enabled" : "Auto Mode Enabled",
      description: autoMode ? "You now control the game manually" : "Game will run automatically"
    });
  };

  const handleStartRound = () => {
    setGameState(prev => ({ ...prev, phase: 'flying', multiplier: 1.00 }));
    toast({ title: "Round Started!", description: "Plane is now flying" });
  };

  const handleResetGame = () => {
    setGameState(prev => ({ 
      ...prev, 
      phase: 'waiting', 
      timer: 12, 
      multiplier: 1.00,
      round_number: prev.round_number + 1
    }));
    toast({ title: "Game Reset!", description: "New round starting" });
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
          <button
            onClick={handleToggleAutoMode}
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
              CRASH NOW!
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
                onClick={handleSetTargetCrash}
                disabled={loading || !targetCrash}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
              >
                Set
              </button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {[1.5, 2.0, 3.0, 5.0, 10.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setTargetCrash(val.toString())}
                  className="border border-orange-600 text-orange-400 hover:bg-orange-600/20 px-2 py-1 rounded text-xs"
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
              Start Flying
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
              Reset Game
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
            {gameState.history.map((crash, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  crash >= 2 ? 'bg-green-500/20 text-green-400' :
                  crash >= 1.5 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}
              >
                {crash.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAviatorControl;