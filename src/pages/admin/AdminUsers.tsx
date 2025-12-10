import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Edit, Trash2, Plus, Minus, CheckCircle, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface User {
  id: number;
  mobile: string;
  player_name: string;
  wallet_balance: number;
  winning_balance: number;
  created_at: string;
  status: string;
  kyc_status: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [balanceDialog, setBalanceDialog] = useState<{ user: User; type: 'add' | 'subtract' } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      console.log("Fetching users with token:", token ? "Present" : "Missing");
      
      const response = await fetch("/api/admin-users.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Response status:", response.status);
      const text = await response.text();
      console.log("Raw response:", text);
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed data:", data);
        if (data.status) {
          setUsers(data.users || []);
        } else {
          toast({ title: "Error", description: data.message || "Failed to fetch users", variant: "destructive" });
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        toast({ title: "Error", description: "Invalid response from server", variant: "destructive" });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!balanceDialog || !balanceAmount) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-update-balance.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          user_id: balanceDialog.user.id,
          amount: parseFloat(balanceAmount),
          type: balanceDialog.type,
        }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "Balance updated successfully" });
        fetchUsers();
        setBalanceDialog(null);
        setBalanceAmount("");
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update balance", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-delete-user.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "User deleted successfully" });
        fetchUsers();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const handleAcceptKyc = async (userId: number) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-update-kyc.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ user_id: userId, kyc_status: 'accepted' }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "KYC accepted successfully" });
        fetchUsers();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update KYC status", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user => 
    user.mobile.includes(search) || 
    (user.player_name && user.player_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Users Management</h1>
            <p className="text-slate-400">Manage all registered users</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by mobile or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white w-full sm:w-64"
            />
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">ID</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Mobile</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Name</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Wallet</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Winning</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">KYC</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Registered</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-4 px-4 text-white">#{user.id}</td>
                      <td className="py-4 px-4 text-white">{user.mobile}</td>
                      <td className="py-4 px-4 text-white">{user.player_name || '-'}</td>
                      <td className="py-4 px-4 text-green-400">₹{user.wallet_balance.toLocaleString()}</td>
                      <td className="py-4 px-4 text-yellow-400">₹{user.winning_balance.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        {user.kyc_status === 'accepted' ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" /> Accepted
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            onClick={() => handleAcceptKyc(user.id)}
                          >
                            Accept KYC
                          </Button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">{user.created_at}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                            onClick={() => setBalanceDialog({ user, type: 'add' })}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                            onClick={() => setBalanceDialog({ user, type: 'subtract' })}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        {loading ? "Loading..." : "No users found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Balance Dialog */}
        <Dialog open={!!balanceDialog} onOpenChange={() => setBalanceDialog(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {balanceDialog?.type === 'add' ? 'Add Balance' : 'Subtract Balance'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-400">
                User: {balanceDialog?.user.mobile}
              </p>
              <p className="text-slate-400">
                Current Balance: ₹{balanceDialog?.user.wallet_balance.toLocaleString()}
              </p>
              <Input
                type="number"
                placeholder="Enter amount"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                onClick={handleUpdateBalance}
                className={`w-full ${
                  balanceDialog?.type === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {balanceDialog?.type === 'add' ? 'Add Balance' : 'Subtract Balance'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
