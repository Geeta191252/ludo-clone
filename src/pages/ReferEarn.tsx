import { ArrowLeft, Copy, Share2, Gift, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ReferEarn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const referralCode = "ROCKY123";

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const shareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join RockyLudo",
        text: `Use my referral code ${referralCode} to get bonus on signup!`,
        url: "https://rockyludo.com",
      });
    } else {
      copyCode();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Refer & Earn</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-2xl border border-primary/30 text-center">
          <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Refer Friends & Earn</h2>
          <p className="text-muted-foreground">Get ₹50 for every friend who joins and plays!</p>
        </div>

        {/* Referral Code */}
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background p-3 rounded-lg border border-border font-mono text-lg font-bold text-center">
              {referralCode}
            </div>
            <Button onClick={copyCode} variant="outline" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button onClick={shareCode} className="w-full h-12">
          <Share2 className="w-5 h-5 mr-2" />
          Share with Friends
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-4 rounded-xl text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </div>
          <div className="bg-card p-4 rounded-xl text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">₹600</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* How it works */}
        <div>
          <h3 className="font-semibold text-lg mb-3">How it works</h3>
          <div className="space-y-3">
            {[
              { step: 1, text: "Share your referral code with friends" },
              { step: 2, text: "Friend signs up using your code" },
              { step: 3, text: "Friend plays their first game" },
              { step: 4, text: "You both get ₹50 bonus!" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {item.step}
                </div>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferEarn;
