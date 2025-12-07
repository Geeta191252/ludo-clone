import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rajasthanludo.com/api';

interface Withdrawal {
  id: string;
  amount: number;
  payment: string;
  status: string;
  date: string;
}

const WithdrawHistory = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const mobile = localStorage.getItem('userMobile');
      
      if (!mobile) {
        navigate('/auth');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/get-transaction-history.php?mobile=${mobile}&type=withdrawal`);
      const data = await response.json();
      
      if (data.status) {
        setWithdrawals(data.transactions || []);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F5D547" }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">Withdraw History</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
          </div>
        ) : withdrawals.length > 0 ? (
          withdrawals.map((withdrawal) => (
            <div 
              key={withdrawal.id} 
              className="bg-white rounded-2xl p-4 border border-black/10"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-black">Withdraw History</h3>
                <span className="text-red-500 font-bold text-xl">(-)₹{withdrawal.amount}</span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-black">
                    <span className="font-bold">Order ID</span>: {withdrawal.id}
                  </p>
                  <p className="text-black">
                    <span className="font-bold">Status</span>:
                    <span className={`ml-1 ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-black">Payment: {withdrawal.payment}</p>
                  <p className="text-black">{withdrawal.date}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-black/60">No withdraw history found</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default WithdrawHistory;
