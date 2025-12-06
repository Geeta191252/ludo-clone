import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, TrendingUp, Gamepad2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface DashboardStats {
  total_users: number;
  total_deposits: number;
  total_withdrawals: number;
  active_games: number;
  today_deposits: number;
  today_withdrawals: number;
  pending_withdrawals: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    active_games: 0,
    today_deposits: 0,
    today_withdrawals: 0,
    pending_withdrawals: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-dashboard.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.status) {
        setStats(data.stats);
        setRecentTransactions(data.recent_transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Users", value: stats.total_users, icon: Users, color: "from-blue-500 to-cyan-500" },
    { title: "Total Deposits", value: `₹${stats.total_deposits.toLocaleString()}`, icon: TrendingUp, color: "from-green-500 to-emerald-500" },
    { title: "Total Withdrawals", value: `₹${stats.total_withdrawals.toLocaleString()}`, icon: IndianRupee, color: "from-orange-500 to-amber-500" },
    { title: "Active Games", value: stats.active_games, icon: Gamepad2, color: "from-purple-500 to-pink-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Welcome to Admin Panel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Today's Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-500">₹{stats.today_deposits.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Today's Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-500">₹{stats.today_withdrawals.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Pending Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-500">{stats.pending_withdrawals}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-400 text-sm">User</th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm">Type</th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm">Amount</th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm">Status</th>
                    <th className="text-left py-3 px-2 text-slate-400 text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx, index) => (
                      <tr key={index} className="border-b border-slate-700/50">
                        <td className="py-3 px-2 text-white">{tx.mobile}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-white">₹{tx.amount}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                            tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400 text-sm">{tx.created_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
