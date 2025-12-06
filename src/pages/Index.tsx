import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import NoticeBox from "@/components/NoticeBox";
import InstantWithdrawal from "@/components/InstantWithdrawal";
import GamesSection from "@/components/GamesSection";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";

type GameType = 'ludo-classic' | 'ludo-popular' | 'snake' | 'dragon-tiger' | 'aviator';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("userToken");
    
    if (!user || !token) {
      navigate("/auth");
      return;
    }

    // Load wallet balance from user data
    try {
      const userData = JSON.parse(user);
      setWalletBalance(userData.wallet_balance || 0);
    } catch {
      navigate("/auth");
      return;
    }
    
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // When a game is selected, show only the battle arena
  if (selectedGame) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="max-w-md mx-auto">
          <Header onMenuClick={() => setSidebarOpen(true)} walletBalance={walletBalance} />
          
          <main>
            <GamesSection 
              selectedGame={selectedGame} 
              onGameSelect={setSelectedGame}
              walletBalance={walletBalance}
              onWalletChange={setWalletBalance}
            />
          </main>
        </div>
        
        <WhatsAppButton />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="max-w-md mx-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} walletBalance={walletBalance} />
        
        <main>
          <NoticeBox />
          <InstantWithdrawal />
          <GamesSection 
            selectedGame={selectedGame} 
            onGameSelect={setSelectedGame}
            walletBalance={walletBalance}
            onWalletChange={setWalletBalance}
          />
        </main>
      </div>
      
      <WhatsAppButton />
      <BottomNav />
    </div>
  );
};

export default Index;
