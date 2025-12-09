import { useState, useEffect } from "react";
import { ArrowLeft, Info, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BattleDetailViewProps {
  battle: {
    id: string;
    player1: { id: string; name: string };
    player2: { id: string; name: string };
    entryFee: number;
    prize: number;
    roomCode?: string;
  };
  onBack: () => void;
  onSendCode?: (code: string) => void;
  apiBase?: string;
}

// Generate random room code
const generateRoomCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const BattleDetailView = ({ battle, onBack, onSendCode, apiBase = '' }: BattleDetailViewProps) => {
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(300);
  const [roomCode, setRoomCode] = useState("");
  const [generatedCode] = useState(() => generateRoomCode());
  const [codeSent, setCodeSent] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState(battle.roomCode || "");
  
  // Check if current user is the creator (player1 = YOU) or joiner (player2 = YOU)
  const isCreator = battle.player1.id === "YOU";
  const isJoiner = battle.player2.id === "YOU";

  // Poll for room code updates (for joiner/opponent)
  useEffect(() => {
    if (!isCreator && !currentRoomCode) {
      const pollRoomCode = async () => {
        try {
          const response = await fetch(`${apiBase}/api/ludo-battles.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_battle',
              battleId: battle.id
            })
          });
          const data = await response.json();
          if (data.success && data.battle.roomCode) {
            setCurrentRoomCode(data.battle.roomCode);
          }
        } catch (error) {
          console.error('Error polling room code:', error);
        }
      };

      pollRoomCode();
      const interval = setInterval(pollRoomCode, 2000);
      return () => clearInterval(interval);
    }
  }, [isCreator, currentRoomCode, battle.id, apiBase]);

  const handleSetRoomCode = () => {
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter room code",
        variant: "destructive",
      });
      return;
    }
    onSendCode?.(roomCode);
    setCodeSent(true);
    toast({
      title: "Code Sent!",
      description: "Room code sent to opponent",
    });
  };

  const handleSendCode = () => {
    onSendCode?.(generatedCode);
    setCodeSent(true);
    toast({
      title: "Code Sent!",
      description: "Room code sent to opponent",
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
  };

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

      {/* Joiner View - Show Room Code */}
      {isJoiner ? (
        <>
          {/* Room Code Display - only show after creator sends code */}
          {currentRoomCode ? (
            <div className="mx-4 mt-4 bg-gray-200 rounded-xl p-4 flex items-center justify-between">
              <span className="font-bold text-gray-800 text-lg">
                Room Code {currentRoomCode}
              </span>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(currentRoomCode);
                  toast({ title: "Copied!", description: "Room code copied" });
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4"
              >
                COPY CODE
              </Button>
            </div>
          ) : (
            <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800">Waiting for Room Code</h2>
                <p className="text-lg text-gray-700 mt-1">
                  रूम कोड का इंतजार है। [{countdown}]
                </p>
              </div>
              <div className="flex justify-center my-6">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}


          {/* Download App Section */}
          <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-6">
            <p className="text-center text-gray-700 text-lg mb-4">
              Play ludo game in Ludo King App
            </p>
            <div className="flex gap-3">
              <a 
                href="https://apps.apple.com/app/ludo-king/id993090598" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-black rounded-lg p-3 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 16.97 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
                <div className="text-white text-left">
                  <div className="text-[10px]">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.ludo.king" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-black rounded-lg p-3 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"/>
                  <path fill="#FBBC04" d="M16.247 15.055l-2.455-2.455L16.247 10.145l3.892 2.236a1 1 0 0 1 0 1.738l-3.892 2.236-.55-.3z"/>
                  <path fill="#4285F4" d="M3.609 22.186L13.792 12l2.455 2.455-9.728 5.59a1 1 0 0 1-.91 2.141z"/>
                  <path fill="#34A853" d="M3.609 1.814a1 1 0 0 1 .91-.141l12.183 6.99L13.792 12 3.609 1.814z"/>
                </svg>
                <div className="text-white text-left">
                  <div className="text-[10px]">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-4">
            <p className="text-gray-700 leading-relaxed">
              यह LudoClassicManual है यहा आप SET ROOM CODE मे दुसरे गेम के कोड देते है या शेयर करते है तो टेबल कैंसल कर दिया जाएगा और Penalty लगा दी जाए
            </p>
          </div>

          {/* Game Rules */}
          <div className="mx-4 mt-4 bg-white rounded-xl p-4 mb-8">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Game Rules</h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">Record Every Game While Playing.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">For Cancellation Of Game, Video Proof Is Necessary.</p>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-700 leading-relaxed">
                  • <strong>महत्वपूर्ण नोट:</strong> कृपया गलत गेम परिणाम अपलोड न करें, अन्यथा आपके वॉलेट बैलेंस पर Penalty लगाई जायगी। गलत रिजल्ट अपडेट करने पर 50 रुपये पेनल्टी लगेगी।
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-700 leading-relaxed">
                  • <strong>महत्वपूर्ण नोट:</strong> यदि आप गेम के परिणामों को अपडेट नहीं करते हैं, तो आपके वॉलेट बैलेंस पर जुर्माना लगाया जाएगा। रिजल्ट अपडेट नहीं करने पर 25 रुपये पेनल्टी लगेगी।
                </p>
              </div>
            </div>
          </div>

          {/* Match Status */}
          <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-4 mb-8">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Match Status</h3>
            <p className="text-gray-600 italic mb-4">
              After completion of your game, select the status of the game and post your screenshot below.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-center">
                <div className="text-xl">I</div>
                <div className="text-lg">WON</div>
              </button>
              <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg text-center">
                <div className="text-xl">I</div>
                <div className="text-lg">LOST</div>
              </button>
              <button className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-lg text-center border-2 border-gray-900">
                <div className="text-lg">CANCEL</div>
              </button>
            </div>
          </div>
        </>
      ) : isCreator ? (
        <>
          {/* Creator View - Set Room Code */}
          {codeSent ? (
            <div className="mx-4 mt-4 bg-gray-200 rounded-xl p-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-green-600">Room Code Sent!</h2>
                <p className="text-2xl font-bold text-gray-800 mt-2">{roomCode}</p>
                <p className="text-gray-600 mt-4">Waiting for opponent to join...</p>
              </div>
            </div>
          ) : (
            /* Set Room Code Form */
            <div className="mx-4 mt-4 bg-gray-200 rounded-xl p-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800">Set Room Code</h2>
                <p className="text-gray-600 mt-1">लूडो किंग से रूम कोड अपलोड करें</p>
              </div>
              
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Enter Room Code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full bg-white border-2 border-red-400 text-gray-900 text-center text-lg py-6"
                />
              </div>
              
              <Button 
                onClick={handleSetRoomCode}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-lg"
              >
                SET ROOM CODE
              </Button>
              
              <div className="text-center mt-4">
                <span className="text-blue-500 font-medium">Remaining Time :</span>
                <span className="text-red-500 font-bold text-3xl ml-2">{countdown}</span>
                <span className="text-red-500 font-medium ml-1">seconds</span>
              </div>
            </div>
          )}

          {/* Game Rules for Creator */}
          <div className="mx-4 mt-4 bg-white rounded-xl p-4 mb-8">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Game Rules</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">Record Every Game While Playing.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">For Cancellation Of Game, Video Proof Is Necessary.</p>
              </div>
            </div>
          </div>

          {/* Match Status for Creator */}
          <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-4 mb-8">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Match Status</h3>
            <p className="text-gray-600 italic mb-4">
              After completion of your game, select the status of the game and post your screenshot below.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-center">
                <div className="text-xl">I</div>
                <div className="text-lg">WON</div>
              </button>
              <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg text-center">
                <div className="text-xl">I</div>
                <div className="text-lg">LOST</div>
              </button>
              <button className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-lg text-center border-2 border-gray-900">
                <div className="text-lg">CANCEL</div>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Other Player View (spectator) */}
          {battle.roomCode ? (
            <div className="mx-4 mt-4 bg-green-100 rounded-xl p-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-green-800">Room Code</h2>
                <p className="text-3xl font-bold text-green-600 mt-4">{battle.roomCode}</p>
              </div>
            </div>
          ) : (
            <div className="mx-4 mt-4 bg-gray-100 rounded-xl p-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800">Waiting for Room Code</h2>
                <p className="text-lg text-gray-700 mt-1">रूम कोड का इंतजार है। [{countdown}]</p>
              </div>
              <div className="flex justify-center my-6">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </>
      )}

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
