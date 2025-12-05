import { ArrowLeft, Copy, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

const ReferEarn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const referralCode = "HXY4744B";

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const shareWhatsApp = () => {
    const text = `Join RockyLudo and use my referral code ${referralCode} to get bonus!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareTelegram = () => {
    const text = `Join RockyLudo and use my referral code ${referralCode} to get bonus!`;
    window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F5D547" }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">Refer & Earn</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Your Referral Earnings */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          <div className="py-3 px-4 text-center" style={{ backgroundColor: "#1D6B6B" }}>
            <h2 className="text-xl font-bold text-white">Your Referral Earnings</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-black/20" style={{ backgroundColor: "#FFF8DC" }}>
            <div className="p-4 text-center">
              <p className="text-black font-semibold">Referred Players</p>
              <p className="text-3xl font-bold text-black">0</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-black font-semibold">Total Earnings</p>
              <p className="text-3xl font-bold text-black">₹ 0</p>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          <div className="py-3 px-4 text-center" style={{ backgroundColor: "#1D6B6B" }}>
            <h2 className="text-xl font-bold text-white">Referral Code</h2>
          </div>
          <div className="p-4" style={{ backgroundColor: "#FFF8DC" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-white p-4 rounded-lg border-2 border-black/20">
                <p className="text-2xl font-bold italic text-black">{referralCode}</p>
              </div>
              <Button 
                onClick={copyCode}
                className="px-6 py-6 text-lg font-bold"
                style={{ backgroundColor: "#FFF8DC", color: "#1D6B6B", border: "2px solid #1D6B6B" }}
              >
                Copy
              </Button>
            </div>

            <p className="text-center text-2xl font-bold text-black mb-4">OR</p>

            {/* Social Share Buttons */}
            <div className="flex justify-center gap-4">
              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="w-8 h-8 text-white" />
              </button>

              {/* Instagram */}
              <button
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>

              {/* Telegram */}
              <button
                onClick={shareTelegram}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#0088cc" }}
              >
                <Send className="w-8 h-8 text-white" />
              </button>

              {/* Copy */}
              <button
                onClick={copyCode}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#6B7280" }}
              >
                <Copy className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          <div className="py-3 px-4 text-center" style={{ backgroundColor: "#1D6B6B" }}>
            <h2 className="text-xl font-bold text-white">How It Works</h2>
          </div>
          <div className="p-4 space-y-4" style={{ backgroundColor: "#FFF8DC" }}>
            <p className="text-black text-lg">
              1. You can refer and earn 2% of your referral&apos;s winnings every time.
            </p>
            <p className="text-black text-lg">
              2. If your player plays for ₹10,000 and wins, you will get ₹200 as a referral amount.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ReferEarn;
