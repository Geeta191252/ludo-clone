import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Zap, Target, Play, Pause, RotateCcw, TrendingUp, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "@/hooks/use-toast";

interface GameState {
  phase: string;
  multiplier: number;
  timer: number;
  round_number: number;
  crash_point: number | null;
  history: number[];
  admin_control?: number;
  target_crash?: number;
}

const AdminAviatorControl = () => {
  console.log("AdminAviatorControl rendering...");
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    multiplier: 1.00,
    timer: 15,
    round_number: 1,
    crash_point: null,
    history: [5.01, 2.60, 3.45, 1.23, 8.92, 1.05, 2.34, 4.56, 1.87, 3.21]
  });
  const [loading, setLoading] = useState(false);
  const [targetCrash, setTargetCrash] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("AdminAviatorControl useEffect running...");
    fetchGameState();
    pollingRef.current = setInterval(fetchGameState, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchGameState = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;
      
      const response = await fetch("/api/admin-aviator-control.php?action=get_state", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.status && data.state) {
          setGameState(data.state);
          setAutoMode(data.state.admin_control !== 1);
          setApiConnected(true);
        }
      } catch {
        // API not working, use local state
        setApiConnected(false);
      }
    } catch {
      setApiConnected(false);
    }
  };

  const handleCrashNow = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-aviator-control.php?action=crash_now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.status) {
          toast({ title: "✈️ Plane Crashed!", description: `Crashed at ${data.crash_point}x` });
          fetchGameState();
        } else {
          toast({ title: "Error", description: data.message, variant: "destructive" });
        }
      } catch {
        // Fallback for local demo
        setGameState(prev => ({
          ...prev,
          phase: 'crashed',
          crash_point: prev.multiplier,
          history: [prev.multiplier, ...prev.history.slice(0, 14)]
        }));
        toast({ title: "✈️ Plane Crashed!", description: `Crashed at ${gameState.multiplier.toFixed(2)}x` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to crash plane", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetTargetCrash = async () => {
    if (!targetCrash || parseFloat(targetCrash) < 1.01) {
      toast({ title: "Error", description: "Target must be at least 1.01x", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin-aviator-control.php?action=set_target_crash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ target: parseFloat(targetCrash) }),
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.status) {
          toast({ title: "🎯 Target Set!", description: `Plane will crash at ${targetCrash}x` });
          setTargetCrash("");
          fetchGameState();
        } else {
          toast({ title: "Error", description: data.message, variant: "destructive" });
        }
      } catch {
        toast({ title: "🎯 Target Set!", description: `Plane will crash at ${targetCrash}x` });
        setTargetCrash("");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to set target", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoMode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-aviator-control.php?action=toggle_auto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({ auto: !autoMode }),
      });
      const text = await response.text();
      try {
        JSON.parse(text);
      } catch {}
      setAutoMode(!autoMode);
      toast({ 
        title: autoMode ? "🎮 Manual Control Enabled" : "🤖 Auto Mode Enabled",
        description: autoMode ? "You now control the game manually" : "Game will run automatically"
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle mode", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRound = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-aviator-control.php?action=start_round", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const text = await response.text();
      try {
        JSON.parse(text);
      } catch {}
      setGameState(prev => ({ ...prev, phase: 'flying', multiplier: 1.00 }));
      toast({ title: "🚀 Round Started!", description: "Plane is now flying" });
      fetchGameState();
    } catch (error) {
      toast({ title: "Error", description: "Failed to start round", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetGame = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin-aviator-control.php?action=reset_game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const text = await response.text();
      try {
        JSON.parse(text);
      } catch {}
      setGameState(prev => ({ 
        ...prev, 
        phase: 'waiting', 
        timer: 12, 
        multiplier: 1.00,
        round_number: prev.round_number + 1
      }));
      toast({ title: "🔄 Game Reset!", description: "New round starting" });
      fetchGameState();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset game", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
      case 'flying': return '✈️ FLYING';
      case 'crashed': return '💥 CRASHED';
      case 'waiting': return '⏳ WAITING';
      default: return phase?.toUpperCase() || 'UNKNOWN';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Plane className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
              Aviator Control Panel
            </h1>
            <p className="text-slate-400 text-sm">Full control over the Aviator game</p>
            {!apiConnected && (
              <p className="text-yellow-500 text-xs mt-1">⚠️ Running in demo mode - PHP API not connected</p>
            )}
          </div>
          <Button
            onClick={handleToggleAutoMode}
            variant={autoMode ? "outline" : "default"}
            className={autoMode ? "border-green-500 text-green-400" : "bg-orange-600 hover:bg-orange-700"}
          >
            {autoMode ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Auto Mode ON
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Manual Control
              </>
            )}
          </Button>
        </div>

        {/* Current Game Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-slate-400 text-xs sm:text-sm mb-1 sm:mb-2">Current Phase</p>
              <p className={`text-lg sm:text-2xl font-bold ${getPhaseColor(gameState.phase)}`}>
                {getPhaseLabel(gameState.phase)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-slate-400 text-xs sm:text-sm mb-1 sm:mb-2">Current Multiplier</p>
              <p className="text-xl sm:text-3xl font-bold text-cyan-400">
                {gameState.multiplier?.toFixed(2) || '1.00'}x
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-slate-400 text-xs sm:text-sm mb-1 sm:mb-2">Timer</p>
              <p className="text-lg sm:text-2xl font-bold text-white">
                {gameState.timer || 0}s
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-slate-400 text-xs sm:text-sm mb-1 sm:mb-2">Round Number</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-400">
                #{gameState.round_number || 1}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Instant Crash */}
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <Zap className="w-5 h-5 text-red-400" />
                Instant Crash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-slate-300 text-xs sm:text-sm">
                Crash the plane immediately at the current multiplier
              </p>
              <Button
                onClick={handleCrashNow}
                disabled={loading || gameState.phase !== 'flying'}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 sm:h-14 text-base sm:text-lg"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                CRASH NOW!
              </Button>
              {gameState.phase !== 'flying' && (
                <p className="text-yellow-400 text-xs text-center">
                  ⚠️ Only available when plane is flying
                </p>
              )}
            </CardContent>
          </Card>

          {/* Target Crash */}
          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <Target className="w-5 h-5 text-orange-400" />
                Set Target Crash Point
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-slate-300 text-xs sm:text-sm">
                Set a specific multiplier at which the plane will crash
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="1.01"
                  max="100"
                  placeholder="e.g., 2.50"
                  value={targetCrash}
                  onChange={(e) => setTargetCrash(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  onClick={handleSetTargetCrash}
                  disabled={loading || !targetCrash}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Set
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1.5, 2.0, 3.0, 5.0, 10.0].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetCrash(val.toString())}
                    className="border-orange-600 text-orange-400 hover:bg-orange-600/20"
                  >
                    {val}x
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Start Round */}
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <Play className="w-5 h-5 text-green-400" />
                Start Round
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-slate-300 text-xs sm:text-sm">
                Manually start a new round (skip waiting phase)
              </p>
              <Button
                onClick={handleStartRound}
                disabled={loading || gameState.phase === 'flying'}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-11 sm:h-12"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Flying
              </Button>
            </CardContent>
          </Card>

          {/* Reset Game */}
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                <RotateCcw className="w-5 h-5 text-blue-400" />
                Reset Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-slate-300 text-xs sm:text-sm">
                Reset the game to waiting phase with fresh round
              </p>
              <Button
                onClick={handleResetGame}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-12"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset Game
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent History */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Recent Crash History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {(gameState.history || []).slice(0, 15).map((crash, index) => (
                <span
                  key={index}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    crash >= 2 ? 'bg-green-500/20 text-green-400' :
                    crash >= 1.5 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}
                >
                  {typeof crash === 'number' ? crash.toFixed(2) : crash}x
                </span>
              ))}
              {(!gameState.history || gameState.history.length === 0) && (
                <p className="text-slate-500 text-sm">No crash history yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAviatorControl;
