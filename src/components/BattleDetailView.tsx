import { useState, useEffect } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BattleDetailViewProps {
  battle: {
    id: string;
    player1: { id: string; name: string };
    player2: { id: string; name: string };
    entryFee: number;
    prize: number;
  };
  onBack: () => void;
}

const BattleDetailView = ({ battle, onBack }: BattleDetailViewProps) => {
  const [countdown, setCountdown] = useState(300); // 5 minutes countdown
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-yellow-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-green-600 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          BACK
        </button>
        <button className="flex items-center gap-1 text-gray-600 font-semibold">
          RULES <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Players Card */}
      <div className="mx-4 bg-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          {/* Player 1 */}
          <div className="flex flex-col items-center">
            <span className="text-gray-500 italic mb-2">{battle.player1.name}</span>
            <div className="w-20 h-20 rounded-full bg-red-400 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="50" fill="#f87171"/>
                <circle cx="50" cy="35" r="18" fill="#fcd5d5"/>
                <ellipse cx="50" cy="85" rx="30" ry="25" fill="white"/>
                <circle cx="42" cy="32" r="2" fill="#333"/>
                <circle cx="58" cy="32" r="2" fill="#333"/>
                <path d="M 45 42 Q 50 46 55 42" stroke="#333" strokeWidth="2" fill="none"/>
                <ellipse cx="50" cy="18" rx="20" ry="12" fill="#8B4513"/>
              </svg>
            </div>
          </div>

          {/* VS Icon */}
          <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">VS</span>
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center">
            <span className="text-gray-500 italic mb-2">{battle.player2.name}</span>
            <div className="w-20 h-20 rounded-full bg-red-400 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="50" fill="#f87171"/>
                <circle cx="50" cy="35" r="18" fill="#fcd5d5"/>
                <ellipse cx="50" cy="85" rx="30" ry="25" fill="white"/>
                <circle cx="42" cy="32" r="2" fill="#333"/>
                <circle cx="58" cy="32" r="2" fill="#333"/>
                <path d="M 45 42 Q 50 46 55 42" stroke="#333" strokeWidth="2" fill="none"/>
                <ellipse cx="50" cy="18" rx="20" ry="12" fill="#8B4513"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Playing For */}
        <div className="text-center mt-4 text-gray-600 font-medium">
          Playing for ₹ {battle.entryFee}
        </div>
      </div>

      {/* Waiting for Room Code Section */}
      <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-6">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-800">Waiting for Room Code</h2>
          <p className="text-lg text-gray-700 mt-1">
            रूम कोड का इंतजार है। [{countdown}]
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center my-6">
          <div className="relative w-16 h-16">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: `hsl(0, ${70 - i * 8}%, ${60 + i * 4}%)`,
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4) - 6}%`,
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4) - 6}%`,
                  animation: `pulse 1s ease-in-out ${i * 0.125}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Room Code Input */}
        <Input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="bg-gray-200 border-none text-center text-gray-600 h-12"
        />
      </div>

      {/* Submit Button */}
      <div className="mx-4 mt-4">
        <Button 
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold h-12"
          disabled={!roomCode}
        >
          Submit Room Code
        </Button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default BattleDetailView;
