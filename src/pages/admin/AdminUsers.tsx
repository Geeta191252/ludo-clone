import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Edit, Trash2, Plus, Minus, CheckCircle, Clock, Eye, FileText, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rajasthanludo.com/api';

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

interface KycDocument {
  id: number;
  doc_type: string;
  name: string;
  email: string;
  doc_number: string;
  front_image: string;
  back_image: string;
  status: string;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [balanceDialog, setBalanceDialog] = useState<{ user: User; type: 'add' | 'subtract' } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [kycDialog, setKycDialog] = useState<{ user: User; kyc: KycDocument | null } | null>(null);
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      console.log("Fetching users with token:", token ? "Present" : "Missing");
      
      const response = await fetch(`${API_BASE_URL}/admin-users.php`, {
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
      const response = await fetch(`${API_BASE_URL}/admin-update-balance.php`, {
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
      const response = await fetch(`${API_BASE_URL}/admin-delete-user.php`, {
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

  const handleUpdateKycStatus = async (userId: number, status: 'accepted' | 'rejected') => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_BASE_URL}/admin-update-kyc.php`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ user_id: userId, kyc_status: status }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: `KYC ${status === 'accepted' ? 'accepted' : 'cancelled'} successfully` });
        fetchUsers();
        setKycDialog(null);
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update KYC status", variant: "destructive" });
    }
  };

  const handleViewKyc = async (user: User) => {
    setKycLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_BASE_URL}/admin-get-kyc-docs.php?user_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.status && data.kyc) {
        setKycDialog({ user, kyc: data.kyc });
      } else {
        toast({ title: "No Documents", description: "User has not submitted KYC documents yet", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch KYC documents", variant: "destructive" });
    } finally {
      setKycLoading(false);
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
                        <div className="flex items-center gap-2">
                          {user.kyc_status === 'accepted' ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-4 h-4" /> Accepted
                            </span>
                          ) : user.kyc_status === 'rejected' ? (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle className="w-4 h-4" /> Rejected
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Clock className="w-4 h-4" /> Pending
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500 text-purple-500 hover:bg-purple-500/10 text-xs"
                            onClick={() => handleViewKyc(user)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                        </div>
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

        {/* KYC Documents Dialog */}
        <Dialog open={!!kycDialog} onOpenChange={() => setKycDialog(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                KYC Documents - {kycDialog?.user.player_name || kycDialog?.user.mobile}
              </DialogTitle>
            </DialogHeader>
            {kycDialog?.kyc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Document Type:</span>
                    <p className="text-white font-medium">{kycDialog.kyc.doc_type}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Name:</span>
                    <p className="text-white font-medium">{kycDialog.kyc.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <p className="text-white font-medium">{kycDialog.kyc.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Document Number:</span>
                    <p className="text-white font-medium">{kycDialog.kyc.doc_number || '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-slate-400 text-sm">Front Image:</h4>
                  {kycDialog.kyc.front_image ? (
                    <img 
                      src={kycDialog.kyc.front_image} 
                      alt="Front Document" 
                      className="w-full max-h-64 object-contain rounded border border-slate-600"
                    />
                  ) : (
                    <p className="text-slate-500">No front image uploaded</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-slate-400 text-sm">Back Image:</h4>
                  {kycDialog.kyc.back_image ? (
                    <img 
                      src={kycDialog.kyc.back_image} 
                      alt="Back Document" 
                      className="w-full max-h-64 object-contain rounded border border-slate-600"
                    />
                  ) : (
                    <p className="text-slate-500">No back image uploaded</p>
                  )}
                </div>

                <div className="flex gap-3">
                  {kycDialog.user.kyc_status !== 'accepted' && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateKycStatus(kycDialog.user.id, 'accepted')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept KYC
                    </Button>
                  )}
                  {kycDialog.user.kyc_status !== 'rejected' && (
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => handleUpdateKycStatus(kycDialog.user.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel KYC
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No KYC documents found</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
