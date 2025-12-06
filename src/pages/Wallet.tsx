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

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [depositChips, setDepositChips] = useState(134);
  const [winningChips, setWinningChips] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");

  // Pay0.shop Configuration - Yahan apna user_token daalo
  const PAY0_USER_TOKEN = "YOUR_PAY0_USER_TOKEN"; // Pay0.shop dashboard se le
  const PAY0_BASE_URL = "https://pay0.shop/pay";
  const REDIRECT_URL = "https://rajasthanludo.com/wallet"; // Aapka domain

  // Generate unique transaction ID
  const generateTxnId = () => {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  // Load wallet data from localStorage
  useEffect(() => {
    const savedDeposit = localStorage.getItem("depositChips");
    const savedWinning = localStorage.getItem("winningChips");
    if (savedDeposit) setDepositChips(Number(savedDeposit));
    if (savedWinning) setWinningChips(Number(savedWinning));

    // Check for payment callback from URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const txnId = urlParams.get('client_txn_id');
    const paidAmount = urlParams.get('amount');

    if (status && txnId) {
      // Clear URL params
      window.history.replaceState({}, '', '/wallet');
      
      if (status === 'success' || status === 'SUCCESS') {
        const addAmount = Number(paidAmount) || 0;
        const currentDeposit = Number(localStorage.getItem("depositChips")) || 0;
        const newDeposit = currentDeposit + addAmount;
        setDepositChips(newDeposit);
        localStorage.setItem("depositChips", newDeposit.toString());
        
        toast({
          title: "Payment Successful!",
          description: `₹${addAmount} added to your wallet`,
        });
      } else if (status === 'failed' || status === 'FAILED') {
        toast({
          title: "Payment Failed",
          description: "Payment was not completed. Please try again.",
          variant: "destructive",
        });
      } else if (status === 'pending' || status === 'PENDING') {
        toast({
          title: "Payment Pending",
          description: "Your payment is being processed. It will be added shortly.",
        });
      }
    }
  }, []);

  // Save wallet data to localStorage
  const saveWalletData = (deposit: number, winning: number) => {
    localStorage.setItem("depositChips", deposit.toString());
    localStorage.setItem("winningChips", winning.toString());
  };

  const handleProceedToPayment = () => {
    const addAmount = Number(amount);
    if (isNaN(addAmount) || addAmount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₹10",
        variant: "destructive",
      });
      return;
    }
    
    // Generate unique transaction ID
    const clientTxnId = generateTxnId();
    
    // Save pending transaction to localStorage
    localStorage.setItem("pendingTxn", JSON.stringify({
      txnId: clientTxnId,
      amount: addAmount,
      timestamp: Date.now()
    }));
    
    // Redirect to Pay0.shop
    const paymentUrl = `${PAY0_BASE_URL}?user_token=${PAY0_USER_TOKEN}&amount=${addAmount}&client_txn_id=${clientTxnId}&redirect_url=${encodeURIComponent(REDIRECT_URL)}`;
    
    window.location.href = paymentUrl;
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
    saveWalletData(depositChips, newWinning);
    setShowWithdrawDialog(false);
    setAmount("");
    setUpiId("");
    
    toast({
      title: "Withdrawal Requested!",
      description: `₹${withdrawAmount} will be sent to ${upiId}`,
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
              Add
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

      {/* Add Chips Dialog - Amount Selection */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm" style={{ backgroundColor: '#F5D547' }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-black">Add Chips</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Notice Box */}
            <div className="p-3 rounded-lg bg-black text-white text-sm">
              <p>ध्यान दें जिस नंबर से केवाईसी हो उसी नंबर से पेमेंट डालें और विड्रॉल उसी नंबर पर लेवे अदर नंबर से पेमेंट डालने पर आईडी 0 कर दी जाए ही</p>
            </div>

            <div>
              <label className="text-sm font-medium text-black">Enter Amount (Min ₹10)</label>
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

            {/* UPI Logo Section */}
            <div className="bg-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-600 tracking-wider">Pay0.shop</div>
              <p className="text-gray-500 text-xs mt-1">Secure UPI Payment Gateway</p>
            </div>

            <Button
              onClick={handleProceedToPayment}
              className="w-full py-6 text-lg font-bold text-white rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Pay ₹{amount || 0} via UPI
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
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
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
