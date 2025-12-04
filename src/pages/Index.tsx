import { useState } from "react";
import CommissionBanner from "@/components/CommissionBanner";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import NoticeBox from "@/components/NoticeBox";
import InstantWithdrawal from "@/components/InstantWithdrawal";
import GamesSection from "@/components/GamesSection";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="max-w-md mx-auto">
        <CommissionBanner />
        <Header onMenuClick={() => setSidebarOpen(true)} walletBalance={100} />
        
        <main>
          <NoticeBox />
          <InstantWithdrawal />
          <GamesSection />
        </main>
      </div>
      
      <WhatsAppButton />
      <BottomNav />
    </div>
  );
};

export default Index;
