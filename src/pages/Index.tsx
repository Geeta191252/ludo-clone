import { useState } from "react";
import CommissionBanner from "@/components/CommissionBanner";
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

  // When a game is selected, show only the battle arena
  if (selectedGame) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="max-w-md mx-auto">
          <CommissionBanner />
          <Header onMenuClick={() => setSidebarOpen(true)} walletBalance={100} />
          
          <main>
            <GamesSection 
              selectedGame={selectedGame} 
              onGameSelect={setSelectedGame} 
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
        <CommissionBanner />
        <Header onMenuClick={() => setSidebarOpen(true)} walletBalance={100} />
        
        <main>
          <NoticeBox />
          <InstantWithdrawal />
          <GamesSection 
            selectedGame={selectedGame} 
            onGameSelect={setSelectedGame} 
          />
        </main>
      </div>
      
      <WhatsAppButton />
      <BottomNav />
    </div>
  );
};

export default Index;
