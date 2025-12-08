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
}

const AdminAviatorControl = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetCrash, setTargetCrash] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchGameState();
    // Poll for game state updates
    pollingRef.current = setInterval(fetchGameState, 500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchGameState = async () => {
    try {
      const response = await fetch("/api/admin-aviator-control.php?action=get_state", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await response.json();
      if (data.status) {
        setGameState(data.state);
        setAutoMode(data.state.admin_control !== 1);
      }
    } catch (error) {
      console.error("Failed to fetch game state");
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
      const data = await response.json();
      if (data.status) {
        toast({ title: "✈️ Plane Crashed!", description: `Crashed at ${data.crash_point}x` });
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
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
      const data = await response.json();
      if (data.status) {
        toast({ title: "🎯 Target Set!", description: `Plane will crash at ${targetCrash}x` });
        setTargetCrash("");
        fetchGameState();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
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
      const data = await response.json();
      if (data.status) {
        setAutoMode(!autoMode);
        toast({ 
          title: autoMode ? "🎮 Manual Control Enabled" : "🤖 Auto Mode Enabled",
          description: autoMode ? "You now control the game manually" : "Game will run automatically"
        });
      }
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
      const data = await response.json();
      if (data.status) {
        toast({ title: "🚀 Round Started!", description: "Plane is now flying" });
        fetchGameState();
      }
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
      const data = await response.json();
      if (data.status) {
        toast({ title: "🔄 Game Reset!", description: "New round starting" });
        fetchGameState();
      }
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
      default: return phase?.toUpperCase();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Plane className="w-8 h-8 text-cyan-400" />
              Aviator Control Panel
            </h1>
            <p className="text-slate-400">Full control over the Aviator game</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Current Phase</p>
              <p className={`text-2xl font-bold ${getPhaseColor(gameState?.phase || '')}`}>
                {getPhaseLabel(gameState?.phase || '')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Current Multiplier</p>
              <p className="text-3xl font-bold text-cyan-400">
                {gameState?.multiplier?.toFixed(2) || '1.00'}x
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Timer</p>
              <p className="text-2xl font-bold text-white">
                {gameState?.timer || 0}s
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-2">Round Number</p>
              <p className="text-2xl font-bold text-purple-400">
                #{gameState?.round_number || 1}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instant Crash */}
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-400" />
                Instant Crash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm">
                Crash the plane immediately at the current multiplier
              </p>
              <Button
                onClick={handleCrashNow}
                disabled={loading || gameState?.phase !== 'flying'}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                CRASH NOW!
              </Button>
              {gameState?.phase !== 'flying' && (
                <p className="text-yellow-400 text-xs text-center">
                  ⚠️ Only available when plane is flying
                </p>
              )}
            </CardContent>
          </Card>

          {/* Target Crash */}
          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                Set Target Crash Point
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm">
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
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Start Round
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm">
                Manually start a new round (skip waiting phase)
              </p>
              <Button
                onClick={handleStartRound}
                disabled={loading || gameState?.phase === 'flying'}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Flying
              </Button>
            </CardContent>
          </Card>

          {/* Reset Game */}
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-400" />
                Reset Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm">
                Reset the game to waiting phase with fresh round
              </p>
              <Button
                onClick={handleResetGame}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset Game
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent History */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Recent Crash History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {gameState?.history?.slice(0, 15).map((crash, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    crash >= 2 ? 'bg-green-500/20 text-green-400' :
                    crash >= 1.5 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}
                >
                  {crash}x
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAviatorControl;
