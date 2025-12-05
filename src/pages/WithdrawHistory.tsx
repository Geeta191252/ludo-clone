import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const withdrawals = [
  { 
    id: "0009499", 
    amount: 2000, 
    payment: "ACCOUNT", 
    status: "approved", 
    date: "Oct 13 6:44 PM" 
  },
];

const WithdrawHistory = () => {
  const navigate = useNavigate();

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
        {withdrawals.map((withdrawal) => (
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
                  <span className="font-bold">Status</span>:{withdrawal.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-black">Payment :{withdrawal.payment}</p>
                <p className="text-black">{withdrawal.date}</p>
              </div>
            </div>
          </div>
        ))}

        {withdrawals.length === 0 && (
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
