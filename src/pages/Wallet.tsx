import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

// API Base URL - Hostinger पर deploy करने के बाद अपनी site का URL डालो
const API_BASE_URL = window.location.origin;

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [depositChips, setDepositChips] = useState(0);
  const [winningChips, setWinningChips] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load user data
  useEffect(() => {
    const savedMobile = localStorage.getItem("userMobile");
    const savedName = localStorage.getItem("userName");
    if (savedMobile) setMobileNumber(savedMobile);
    if (savedName) setPlayerName(savedName);
    
    // Load balance from localStorage (fallback)
    const savedDeposit = localStorage.getItem("depositChips");
    const savedWinning = localStorage.getItem("winningChips");
    if (savedDeposit) setDepositChips(Number(savedDeposit));
    if (savedWinning) setWinningChips(Number(savedWinning));

    // Try to get balance from server
    if (savedMobile) {
      fetchBalance(savedMobile);
    }
  }, []);

  const fetchBalance = async (mobile: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-balance.php?mobile=${mobile}`);
      const data = await response.json();
      if (data.status) {
        setDepositChips(data.wallet_balance);
        setWinningChips(data.winning_balance);
        localStorage.setItem("depositChips", data.wallet_balance.toString());
        localStorage.setItem("winningChips", data.winning_balance.toString());
      }
    } catch (error) {
      console.log("Using local balance");
    }
  };

  const handleProceedToPayment = async () => {
    const addAmount = Number(amount);
    
    if (isNaN(addAmount) || addAmount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹10",
        variant: "destructive",
      });
      return;
    }

    if (!mobileNumber || mobileNumber.length < 10) {
      toast({
        title: "Mobile Required",
        description: "Please enter valid mobile number",
        variant: "destructive",
      });
      return;
    }

    // Save user data
    localStorage.setItem("userMobile", mobileNumber);
    localStorage.setItem("userName", playerName || "Player");

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/create-order.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: addAmount,
          mobile: mobileNumber,
          name: playerName || "Player"
        })
      });

      const data = await response.json();

      if (data.status && data.payment_url) {
        // Save pending order
        localStorage.setItem("pendingOrderId", data.order_id);
        localStorage.setItem("pendingAmount", addAmount.toString());
        
        // Redirect to payment page
        window.location.href = data.payment_url;
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment gateway not available. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = () => {
    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > winningChips) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough winning chips",
        variant: "destructive",
      });
      return;
    }

    if (!upiId.trim()) {
      toast({
        title: "UPI ID Required",
        description: "Please enter your UPI ID",
        variant: "destructive",
      });
      return;
    }

    const newWinning = winningChips - withdrawAmount;
    setWinningChips(newWinning);
    localStorage.setItem("winningChips", newWinning.toString());
    setShowWithdrawDialog(false);
    setAmount("");
    setUpiId("");
    
    toast({
      title: "Withdrawal Requested!",
      description: `₹${withdrawAmount} will be sent to ${upiId} within 24 hours`,
    });
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5D547' }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">My Wallet</h1>
      </div>

      {/* Wallet Content */}
      <div className="p-4 space-y-6">
        {/* Deposit Chips Section */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          <div className="py-3 px-4 text-center" style={{ backgroundColor: '#1D6B6B' }}>
            <h2 className="text-xl font-bold text-white">Deposit Chips</h2>
          </div>
          
          <div className="p-4 text-center" style={{ backgroundColor: '#FFF8DC' }}>
            <p className="text-red-600 text-sm font-medium">
              यह चिप्स Win अवं Buy की गई चिप्स है इनसे सिर्फ गेम खेले जा सकते है,
              <br />
              बैंक या <span className="italic">UPI</span> से निकाला नहीं जा सकता है
            </p>
          </div>

          <div className="flex justify-center py-6" style={{ backgroundColor: '#F5D547' }}>
            <div className="bg-white rounded-xl shadow-lg px-12 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
              <p className="text-3xl font-bold text-black">₹ {depositChips}</p>
              <p className="text-gray-600 text-lg">Chips</p>
            </div>
          </div>

          <div className="px-4 pb-4" style={{ backgroundColor: '#F5D547' }}>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Add Chips
            </Button>
          </div>
        </div>

        {/* Winning Chips Section */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          <div className="py-3 px-4 text-center" style={{ backgroundColor: '#1D6B6B' }}>
            <h2 className="text-xl font-bold text-white">Winning Chips</h2>
          </div>
          
          <div className="p-4 text-center" style={{ backgroundColor: '#FFF8DC' }}>
            <p className="text-red-600 text-sm font-medium">
              यह चिप्स गेम से जीती हुई एवं रेफरल से कमाई हुई है, इन्हे बैंक या <span className="italic">UPI</span> में
              <br />
              निकाला जा सकता है, इन चिप्स से गेम भी खेला जा सकता है
            </p>
          </div>

          <div className="flex justify-center py-6" style={{ backgroundColor: '#F5D547' }}>
            <div className="bg-white rounded-xl shadow-lg px-12 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
              <p className="text-3xl font-bold text-black">₹ {winningChips}</p>
              <p className="text-gray-600 text-lg">Chips</p>
            </div>
          </div>

          <div className="px-4 pb-4" style={{ backgroundColor: '#F5D547' }}>
            <Button 
              onClick={() => setShowWithdrawDialog(true)}
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Withdrawal
            </Button>
          </div>
        </div>
      </div>

      {/* Add Chips Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm" style={{ backgroundColor: '#F5D547' }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-black">Add Chips</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Notice Box */}
            <div className="p-3 rounded-lg bg-black text-white text-sm">
              <p>ध्यान दें: जिस नंबर से payment करोगे उसी नंबर पर withdrawal मिलेगा</p>
            </div>

            <div>
              <label className="text-sm font-medium text-black">Mobile Number *</label>
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                maxLength={10}
                className="mt-1 bg-white border-2 border-black/20 text-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-black">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mt-1 bg-white border-2 border-black/20 text-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-black">Amount (Min ₹10)</label>
              <Input
                type="number"
                placeholder="₹ Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                className="mt-1 bg-white border-2 border-black/20 text-black"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: '#1D6B6B' }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <Button
              onClick={handleProceedToPayment}
              disabled={isLoading}
              className="w-full py-6 text-lg font-bold text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              {isLoading ? 'Processing...' : `Pay ₹${amount || 0} via UPI`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-sm" style={{ backgroundColor: '#F5D547' }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-black">Withdraw Chips</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#FFF8DC' }}>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-bold text-black">₹ {winningChips}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-black">Enter Amount</label>
              <Input
                type="number"
                placeholder="₹ Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 bg-white border-2 border-black/20 text-black"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-black">UPI ID</label>
              <Input
                type="text"
                placeholder="Enter your UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mt-1 bg-white border-2 border-black/20 text-black"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#1D6B6B' }}
                  disabled={amt > winningChips}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <Button
              onClick={handleWithdraw}
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Withdraw ₹{amount || 0}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Wallet;
