import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Game {
  id: number;
  name: string;
  slug: string;
  enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge: number;
  multiplier: number;
}

const defaultGames: Game[] = [
  { id: 1, name: "Aviator", slug: "aviator", enabled: true, min_bet: 10, max_bet: 10000, house_edge: 5, multiplier: 1.5 },
  { id: 2, name: "Dragon Tiger", slug: "dragon-tiger", enabled: true, min_bet: 10, max_bet: 50000, house_edge: 3, multiplier: 2 },
  { id: 3, name: "Ludo Classic", slug: "ludo-classic", enabled: true, min_bet: 50, max_bet: 5000, house_edge: 5, multiplier: 2 },
  { id: 4, name: "Ludo Popular", slug: "ludo-popular", enabled: true, min_bet: 100, max_bet: 10000, house_edge: 5, multiplier: 2 },
  { id: 5, name: "Snake & Ladders", slug: "snake-ladders", enabled: true, min_bet: 10, max_bet: 5000, house_edge: 5, multiplier: 2 },
];

const AdminGames = () => {
  const [games, setGames] = useState<Game[]>(defaultGames);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-games.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.status && data.games.length > 0) {
        setGames(data.games);
      }
    } catch (error) {
      console.log("Using default games");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (gameId: number) => {
    setGames(games.map(g => 
      g.id === gameId ? { ...g, enabled: !g.enabled } : g
    ));
  };

  const handleChange = (gameId: number, field: keyof Game, value: number) => {
    setGames(games.map(g => 
      g.id === gameId ? { ...g, [field]: value } : g
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-save-games.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ games }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "Game settings saved!" });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Game Settings</h1>
            <p className="text-slate-400">Configure game parameters</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>

        <div className="grid gap-4">
          {games.map((game) => (
            <Card key={game.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-white">{game.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${game.enabled ? 'text-green-400' : 'text-slate-500'}`}>
                      {game.enabled ? 'Active' : 'Disabled'}
                    </span>
                    <Switch
                      checked={game.enabled}
                      onCheckedChange={() => handleToggle(game.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Min Bet (₹)</label>
                    <Input
                      type="number"
                      value={game.min_bet}
                      onChange={(e) => handleChange(game.id, 'min_bet', parseInt(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Max Bet (₹)</label>
                    <Input
                      type="number"
                      value={game.max_bet}
                      onChange={(e) => handleChange(game.id, 'max_bet', parseInt(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">House Edge (%)</label>
                    <Input
                      type="number"
                      value={game.house_edge}
                      onChange={(e) => handleChange(game.id, 'house_edge', parseFloat(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Win Multiplier</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={game.multiplier}
                      onChange={(e) => handleChange(game.id, 'multiplier', parseFloat(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGames;
