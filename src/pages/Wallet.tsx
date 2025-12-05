import { ArrowLeft, Plus, ArrowDownToLine, Wallet as WalletIcon, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import rupeeIcon from "@/assets/rupee-icon.png";

const Wallet = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">My Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl border border-primary/30">
          <p className="text-muted-foreground mb-2">Total Balance</p>
          <div className="flex items-center gap-2 mb-4">
            <img src={rupeeIcon} alt="₹" className="w-8 h-8" />
            <span className="text-4xl font-bold">10,000</span>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Cash
            </Button>
            <Button className="flex-1" variant="outline">
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="px-4 space-y-3">
        <h3 className="font-semibold text-lg">Balance Details</h3>
        
        <div className="bg-card p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Deposit Balance</p>
              <p className="text-xs text-muted-foreground">Can be used to play</p>
            </div>
          </div>
          <span className="font-bold">₹5,000</span>
        </div>

        <div className="bg-card p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Winning Balance</p>
              <p className="text-xs text-muted-foreground">Can be withdrawn</p>
            </div>
          </div>
          <span className="font-bold">₹5,000</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 mt-4">
        <h3 className="font-semibold text-lg mb-3">Quick Add</h3>
        <div className="grid grid-cols-4 gap-2">
          {[100, 500, 1000, 2000].map((amount) => (
            <Button key={amount} variant="outline" className="h-12">
              ₹{amount}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
