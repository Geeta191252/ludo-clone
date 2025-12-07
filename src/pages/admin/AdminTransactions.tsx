import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Check, X, Download, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Transaction {
  id: number;
  order_id: string;
  mobile: string;
  amount: number;
  type: string;
  status: string;
  utr: string;
  upi_id: string;
  created_at: string;
}

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'DEPOSIT' | 'WITHDRAWAL'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'SUCCESS' | 'FAILED'>('all');
  const [loading, setLoading] = useState(true);
  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-transactions.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.status) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId: number, newStatus: 'SUCCESS' | 'FAILED') => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-update-transaction.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ transaction_id: transactionId, status: newStatus }),
      });
      
      const text = await response.text();
      console.log("Server response:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        toast({ title: "Error", description: "Server error: " + text.substring(0, 100), variant: "destructive" });
        return;
      }
      
      if (data.status) {
        toast({ title: "Success", description: "Transaction updated" });
        fetchTransactions();
      } else {
        toast({ title: "Error", description: data.message || "Unknown error", variant: "destructive" });
      }
    } catch (error) {
      console.error("Request error:", error);
      toast({ title: "Error", description: "Network error: " + String(error), variant: "destructive" });
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    setVerifyingOrder(orderId);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/verify-payment.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      
      const data = await response.json();
      
      if (data.status && data.payment_status === 'SUCCESS') {
        toast({ title: "✅ Payment Verified!", description: `₹${data.amount} added to wallet` });
        fetchTransactions();
      } else if (data.status) {
        toast({ title: "⏳ Payment Pending", description: data.message });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to verify payment", variant: "destructive" });
    } finally {
      setVerifyingOrder(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.order_id.includes(search) || tx.mobile.includes(search);
    const matchesType = filter === 'all' || tx.type === filter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Order ID', 'Mobile', 'Amount', 'Type', 'Status', 'UTR', 'Date'];
    const rows = filteredTransactions.map(tx => [
      tx.order_id, tx.mobile, tx.amount, tx.type, tx.status, tx.utr || '-', tx.created_at
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-slate-400">Manage deposits & withdrawals</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white w-48"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
            <Button onClick={exportCSV} variant="outline" className="border-slate-700">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Order ID</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Mobile</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Amount</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Type</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Status</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">UTR/UPI</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Date</th>
                    <th className="text-left py-4 px-4 text-slate-400 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-4 px-4 text-white font-mono text-sm">{tx.order_id}</td>
                      <td className="py-4 px-4 text-white">{tx.mobile}</td>
                      <td className="py-4 px-4 text-white font-semibold">₹{tx.amount.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {tx.utr || tx.upi_id || '-'}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">{tx.created_at}</td>
                      <td className="py-4 px-4">
                        {tx.status === 'PENDING' && tx.type === 'DEPOSIT' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleVerifyPayment(tx.order_id)}
                            disabled={verifyingOrder === tx.order_id}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${verifyingOrder === tx.order_id ? 'animate-spin' : ''}`} />
                            Verify
                          </Button>
                        )}
                        {tx.status === 'PENDING' && tx.type === 'WITHDRAWAL' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateStatus(tx.id, 'SUCCESS')}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(tx.id, 'FAILED')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        {loading ? "Loading..." : "No transactions found"}
                      </td>
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

export default AdminTransactions;
