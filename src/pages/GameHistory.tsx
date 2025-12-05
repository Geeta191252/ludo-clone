import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const tabs = ["Deposit", "Game", "Penalty", "Bonus"];

const GameHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Bonus");

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F5D547" }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">Games History</h1>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-semibold text-lg whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* Empty state - content will show based on tab */}
        <div className="text-center py-12">
          <p className="text-black/60">No {activeTab.toLowerCase()} history found</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default GameHistory;
