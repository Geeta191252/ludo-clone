import { ArrowLeft, Trophy, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import rupeeIcon from "@/assets/rupee-icon.png";

const games = [
  { id: 1, game: "Ludo Classic", opponent: "Player123", result: "won", amount: 197, date: "Today, 2:30 PM" },
  { id: 2, game: "Aviator", opponent: "-", result: "won", amount: 450, date: "Today, 1:15 PM" },
  { id: 3, game: "Dragon Tiger", opponent: "-", result: "lost", amount: 100, date: "Today, 12:00 PM" },
  { id: 4, game: "Ludo Popular", opponent: "GamerX", result: "lost", amount: 250, date: "Yesterday" },
  { id: 5, game: "Snake & Ladders", opponent: "ProPlayer", result: "won", amount: 98, date: "Yesterday" },
  { id: 6, game: "Aviator", opponent: "-", result: "lost", amount: 200, date: "Dec 3, 2024" },
];

const GameHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Games History</h1>
      </div>

      {/* Games List */}
      <div className="p-4 space-y-3">
        {games.map((game) => (
          <div key={game.id} className="bg-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  game.result === "won" ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {game.result === "won" ? (
                    <Trophy className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{game.game}</p>
                  <p className="text-xs text-muted-foreground">vs {game.opponent}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 ${
                  game.result === "won" ? "text-green-500" : "text-red-500"
                }`}>
                  <span className="text-sm">{game.result === "won" ? "+" : "-"}</span>
                  <img src={rupeeIcon} alt="₹" className="w-4 h-4" />
                  <span className="font-bold">{game.amount}</span>
                </div>
                <p className="text-xs text-muted-foreground">{game.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;
