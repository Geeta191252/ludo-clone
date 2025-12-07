import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rajasthanludo.com/api';

const tabs = ["Deposit", "Game", "Penalty", "Bonus"];

interface Transaction {
  id: string;
  amount: number;
  status: string;
  date: string;
  type: string;
  utr?: string;
}

const GameHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || "Deposit";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions(activeTab.toLowerCase());
  }, [activeTab]);

  const fetchTransactions = async (type: string) => {
    try {
      setLoading(true);
      const mobile = localStorage.getItem('userMobile');
      
      if (!mobile) {
        navigate('/auth');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/get-transaction-history.php?mobile=${mobile}&type=${type}`);
      const data = await response.json();
      
      if (data.status) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAmountPrefix = (type: string) => {
    if (type === 'Deposit' || type === 'Bonus') return '+';
    if (type === 'Penalty') return '-';
    return '';
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F5D547" }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">Games History</h1>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-semibold text-lg whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
          </div>
        ) : transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="bg-white rounded-2xl p-4 border border-black/10"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-black">{transaction.type} History</h3>
                  <p className="text-sm text-gray-600">ID: {transaction.id}</p>
                </div>
                <span className={`font-bold text-xl ${activeTab === 'Penalty' ? 'text-red-500' : 'text-green-600'}`}>
                  {getAmountPrefix(activeTab)}₹{transaction.amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
                <span className="text-sm text-gray-600">{transaction.date}</span>
              </div>
              {transaction.utr && (
                <p className="text-sm text-gray-500 mt-2">UTR: {transaction.utr}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-black/60">No {activeTab.toLowerCase()} history found</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default GameHistory;
