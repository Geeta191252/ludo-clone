import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  AlertTriangle, 
  IndianRupee,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Trash2
} from "lucide-react";

interface Battle {
  id: string;
  creator_id: string;
  creator_name: string;
  opponent_id: string | null;
  opponent_name: string | null;
  entry_fee: number;
  prize: number;
  room_code: string | null;
  winner_id: string | null;
  creator_result: string | null;
  opponent_result: string | null;
  creator_screenshot?: string;
  opponent_screenshot?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface Stats {
  total_battles: number;
  open_battles: number;
  running_battles: number;
  completed_battles: number;
  disputed_battles: number;
  cancelled_battles: number;
  total_prize_pool: number;
  total_commission: number;
}

const AdminLudoControl = () => {
  const [stats, setStats] = useState<Stats>({
    total_battles: 0,
    open_battles: 0,
    running_battles: 0,
    completed_battles: 0,
    disputed_battles: 0,
    cancelled_battles: 0,
    total_prize_pool: 0,
    total_commission: 0
  });
  const [battles, setBattles] = useState<Battle[]>([]);
  const [disputedBattles, setDisputedBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [viewScreenshots, setViewScreenshots] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      
      // Fetch stats
      const statsRes = await fetch("/api/admin-ludo-battles.php?action=stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.status) setStats(statsData.stats);
      
      // Fetch battles
      const battlesRes = await fetch(`/api/admin-ludo-battles.php?action=all&status=${filter === 'all' ? '' : filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const battlesData = await battlesRes.json();
      if (battlesData.status) setBattles(battlesData.battles);
      
      // Fetch disputed battles
      const disputedRes = await fetch("/api/admin-ludo-battles.php?action=disputed", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const disputedData = await disputedRes.json();
      if (disputedData.status) setDisputedBattles(disputedData.battles);
      
    } catch (error) {
      console.error("Failed to fetch ludo data");
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (battleId: string, winnerType: 'creator' | 'opponent') => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin-ludo-battles.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          action: "resolve_dispute",
          battle_id: battleId,
          winner_type: winnerType
        })
      });
      const data = await res.json();
      if (data.status) {
        toast({ title: "Success", description: data.message });
        fetchData();
        setSelectedBattle(null);
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
    }
  };

  const cancelBattle = async (battleId: string, refund: boolean = true) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin-ludo-battles.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          action: "cancel_battle",
          battle_id: battleId,
          refund
        })
      });
      const data = await res.json();
      if (data.status) {
        toast({ title: "Success", description: data.message });
        fetchData();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel battle", variant: "destructive" });
    }
  };

  const deleteBattle = async (battleId: string) => {
    if (!confirm("Are you sure you want to delete this battle?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin-ludo-battles.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          action: "delete_battle",
          battle_id: battleId
        })
      });
      const data = await res.json();
      if (data.status) {
        toast({ title: "Success", description: data.message });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete battle", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string, winnerId?: string | null) => {
    if (winnerId === 'ADMIN_DISPUTE') {
      return <Badge className="bg-red-500/20 text-red-400">Disputed</Badge>;
    }
    switch (status) {
      case 'open': return <Badge className="bg-blue-500/20 text-blue-400">Open</Badge>;
      case 'requested': return <Badge className="bg-yellow-500/20 text-yellow-400">Requested</Badge>;
      case 'running': return <Badge className="bg-green-500/20 text-green-400">Running</Badge>;
      case 'completed': return <Badge className="bg-purple-500/20 text-purple-400">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-slate-500/20 text-slate-400">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Ludo Classic Control</h1>
            <p className="text-slate-400">Manage Ludo battles and disputes</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Battles</p>
                  <p className="text-xl font-bold text-white">{stats.total_battles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Running</p>
                  <p className="text-xl font-bold text-white">{stats.running_battles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Disputed</p>
                  <p className="text-xl font-bold text-white">{stats.disputed_battles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Commission</p>
                  <p className="text-xl font-bold text-white">₹{stats.total_commission}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="disputes" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="disputes" className="data-[state=active]:bg-red-500/20">
              Disputes ({stats.disputed_battles})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20">
              All Battles
            </TabsTrigger>
          </TabsList>

          {/* Disputes Tab */}
          <TabsContent value="disputes">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Disputed Battles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {disputedBattles.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No disputed battles</p>
                ) : (
                  <div className="space-y-4">
                    {disputedBattles.map((battle) => (
                      <div key={battle.id} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">Battle #{battle.id.slice(-8)}</p>
                            <p className="text-sm text-slate-400">Room Code: {battle.room_code || 'N/A'}</p>
                          </div>
                          <Badge className="bg-red-500/20 text-red-400">DISPUTED</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Creator</p>
                            <p className="text-white">{battle.creator_name}</p>
                            <p className="text-sm text-slate-400">{battle.creator_id}</p>
                            <Badge className="mt-2 bg-green-500/20 text-green-400">{battle.creator_result}</Badge>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Opponent</p>
                            <p className="text-white">{battle.opponent_name}</p>
                            <p className="text-sm text-slate-400">{battle.opponent_id}</p>
                            <Badge className="mt-2 bg-green-500/20 text-green-400">{battle.opponent_result}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-400 text-sm">Entry: ₹{battle.entry_fee} | Prize: ₹{battle.prize}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => { setSelectedBattle(battle); setViewScreenshots(true); }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Screenshots
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => resolveDispute(battle.id, 'creator')}
                            >
                              Creator Wins
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => resolveDispute(battle.id, 'opponent')}
                            >
                              Opponent Wins
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Battles Tab */}
          <TabsContent value="all">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">All Battles</CardTitle>
                <div className="flex gap-2">
                  {['all', 'open', 'running', 'completed', 'cancelled'].map((f) => (
                    <Button 
                      key={f} 
                      size="sm" 
                      variant={filter === f ? "default" : "outline"}
                      onClick={() => setFilter(f)}
                      className="capitalize"
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Battle ID</th>
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Creator</th>
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Opponent</th>
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Entry</th>
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Status</th>
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Date</th>
                        <th className="text-left py-3 px-2 text-slate-400 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battles.map((battle) => (
                        <tr key={battle.id} className="border-b border-slate-700/50">
                          <td className="py-3 px-2 text-white text-sm">{battle.id.slice(-10)}</td>
                          <td className="py-3 px-2 text-white text-sm">{battle.creator_name}</td>
                          <td className="py-3 px-2 text-white text-sm">{battle.opponent_name || '-'}</td>
                          <td className="py-3 px-2 text-white text-sm">₹{battle.entry_fee}</td>
                          <td className="py-3 px-2">{getStatusBadge(battle.status, battle.winner_id)}</td>
                          <td className="py-3 px-2 text-slate-400 text-sm">{battle.created_at}</td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              {battle.status === 'running' && (
                                <Button size="sm" variant="outline" onClick={() => cancelBattle(battle.id)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="text-red-400" onClick={() => deleteBattle(battle.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Screenshots Dialog */}
        <Dialog open={viewScreenshots} onOpenChange={setViewScreenshots}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-white">Battle Screenshots</DialogTitle>
            </DialogHeader>
            {selectedBattle && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Creator: {selectedBattle.creator_name}</p>
                  {selectedBattle.creator_screenshot ? (
                    <img 
                      src={selectedBattle.creator_screenshot} 
                      alt="Creator Screenshot" 
                      className="w-full rounded-lg border border-slate-600"
                    />
                  ) : (
                    <div className="bg-slate-700 rounded-lg p-8 text-center text-slate-400">
                      No screenshot uploaded
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Opponent: {selectedBattle.opponent_name}</p>
                  {selectedBattle.opponent_screenshot ? (
                    <img 
                      src={selectedBattle.opponent_screenshot} 
                      alt="Opponent Screenshot" 
                      className="w-full rounded-lg border border-slate-600"
                    />
                  ) : (
                    <div className="bg-slate-700 rounded-lg p-8 text-center text-slate-400">
                      No screenshot uploaded
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewScreenshots(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLudoControl;
