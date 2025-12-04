import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Marquee from "@/components/Marquee";
import InstantWithdrawal from "@/components/InstantWithdrawal";
import GamesSection from "@/components/GamesSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="max-w-md mx-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main>
          <div className="px-4">
            <Marquee />
          </div>
          
          <InstantWithdrawal />
          
          <GamesSection />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
