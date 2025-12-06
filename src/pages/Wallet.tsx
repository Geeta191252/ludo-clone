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
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showUpiInputDialog, setShowUpiInputDialog] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paymentUpiId, setPaymentUpiId] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const paymentMethods = [
    { id: "paytm", name: "Paytm", color: "#00BAF2", deepLink: "paytmmp://pay" },
    { id: "phonepe", name: "PhonePe", color: "#5F259F", deepLink: "phonepe://pay" },
    { id: "googlepay", name: "Google Pay", color: "#4285F4", deepLink: "tez://upi/pay" },
    { id: "upi", name: "UPI", color: "#FF6B00", deepLink: "upi://pay" },
  ];

  // Merchant UPI ID
  const merchantUpiId = "8504021912@slc";

  // Load wallet data from localStorage
  useEffect(() => {
    const savedDeposit = localStorage.getItem("depositChips");
    const savedWinning = localStorage.getItem("winningChips");
    if (savedDeposit) setDepositChips(Number(savedDeposit));
    if (savedWinning) setWinningChips(Number(savedWinning));
  }, []);

  // Save wallet data to localStorage
  const saveWalletData = (deposit: number, winning: number) => {
    localStorage.setItem("depositChips", deposit.toString());
    localStorage.setItem("winningChips", winning.toString());
  };

  const handleProceedToPayment = () => {
    const addAmount = Number(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    setShowAddDialog(false);
    setShowPaymentMethodDialog(true);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    const method = paymentMethods.find(m => m.id === methodId);
    const addAmount = Number(amount);
    
    if (methodId === "upi") {
      // For generic UPI, show UPI ID input
      setShowPaymentMethodDialog(false);
      setShowUpiInputDialog(true);
    } else if (method) {
      // For specific apps (Paytm, PhonePe, Google Pay), redirect to app
      const upiUrl = `${method.deepLink}?pa=${merchantUpiId}&pn=LudoGame&am=${addAmount}&cu=INR&tn=AddChips`;
      
      setShowPaymentMethodDialog(false);
      setShowProcessingDialog(true);
      
      // Try to open the app
      window.location.href = upiUrl;
      
      // Simulate payment completion after delay (in real app, use webhook/callback)
      setTimeout(() => {
        const newDeposit = depositChips + addAmount;
        setDepositChips(newDeposit);
        saveWalletData(newDeposit, winningChips);
        setShowProcessingDialog(false);
        
        toast({
          title: "Payment Successful!",
          description: `₹${addAmount} added via ${method.name}`,
        });
        
        setAmount("");
        setSelectedPaymentMethod("");
      }, 5000);
    }
  };

  const handleUpiSubmit = () => {
    if (!paymentUpiId.trim() || !paymentUpiId.includes('@')) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID (e.g., name@upi)",
        variant: "destructive",
      });
      return;
    }
    
    setShowUpiInputDialog(false);
    setShowProcessingDialog(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const addAmount = Number(amount);
      const newDeposit = depositChips + addAmount;
      setDepositChips(newDeposit);
      saveWalletData(newDeposit, winningChips);
      setShowProcessingDialog(false);
      
      const methodName = paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || "UPI";
      toast({
        title: "Payment Successful!",
        description: `₹${addAmount} added via ${methodName}`,
      });
      
      setAmount("");
      setPaymentUpiId("");
      setSelectedPaymentMethod("");
    }, 3000);
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

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#1D6B6B' }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <Button
              onClick={handleProceedToPayment}
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Add ₹{amount || 0}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selection Dialog */}
      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <DialogContent className="max-w-sm" style={{ backgroundColor: '#F5D547' }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-black">Select Payment Method</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Notice Box */}
            <div className="p-3 rounded-lg bg-black text-white text-sm">
              <p>ध्यान दें जिस नंबर से केवाईसी हो उसी नंबर से पेमेंट डालें और विड्रॉल उसी नंबर पर लेवे अदर नंबर से पेमेंट डालने पर आईडी 0 कर दी जाए ही</p>
            </div>

            {/* Amount Display */}
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-black">Amount to be added ₹{amount}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentMethodDialog(false);
                  setShowAddDialog(true);
                }}
                className="bg-teal-600 text-white hover:bg-teal-700 border-none"
              >
                Edit
              </Button>
            </div>

            {/* UPI Logo Section */}
            <div className="bg-gray-200 rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-gray-500 tracking-wider">UPI</div>
              <p className="text-gray-600 text-sm mt-1">UNIFIED PAYMENTS INTERFACE</p>
            </div>

            {/* Payment Method Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className="py-4 px-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: method.color }}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPI ID Input Dialog */}
      <Dialog open={showUpiInputDialog} onOpenChange={setShowUpiInputDialog}>
        <DialogContent className="max-w-sm" style={{ backgroundColor: '#F5D547' }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-black">
              Enter UPI ID
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#FFF8DC' }}>
              <p className="text-sm text-gray-600">Payment Amount</p>
              <p className="text-2xl font-bold text-black">₹ {amount}</p>
              <p className="text-sm text-teal-600 font-medium mt-1">
                via {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-black">Your UPI ID</label>
              <Input
                type="text"
                placeholder="example@paytm, example@ybl"
                value={paymentUpiId}
                onChange={(e) => setPaymentUpiId(e.target.value)}
                className="mt-1 bg-white border-2 border-black/20 text-black"
              />
              <p className="text-xs text-gray-600 mt-1">
                Payment request will be sent to this UPI ID
              </p>
            </div>

            <Button
              onClick={handleUpiSubmit}
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Pay ₹{amount}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowUpiInputDialog(false);
                setShowPaymentMethodDialog(true);
              }}
              className="w-full py-4 text-black border-2 border-black/20"
            >
              Change Payment Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Processing Payment Dialog */}
      <Dialog open={showProcessingDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" style={{ backgroundColor: '#F5D547' }}>
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-600 flex items-center justify-center animate-pulse">
              <span className="text-white text-2xl">₹</span>
            </div>
            <h3 className="text-xl font-bold text-black">Processing Payment</h3>
            <p className="text-gray-700">
              Payment request sent to <span className="font-medium">{paymentUpiId}</span>
            </p>
            <p className="text-sm text-gray-600">
              Please approve the payment in your {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name} app
            </p>
            <div className="flex justify-center gap-1 pt-4">
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
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
