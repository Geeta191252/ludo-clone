import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, HelpCircle, Minus, Plus, History } from 'lucide-react';

interface AviatorGameProps {
  onClose: () => void;
}

const AviatorGame: React.FC<AviatorGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(3000);
  const [betAmount1, setBetAmount1] = useState(1);
  const [betAmount2, setBetAmount2] = useState(1);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [bet1Active, setBet1Active] = useState(false);
  const [bet2Active, setBet2Active] = useState(false);
  const [bet1CashedOut, setBet1CashedOut] = useState(false);
  const [bet2CashedOut, setBet2CashedOut] = useState(false);
  const [history, setHistory] = useState<number[]>([2.94, 2.60, 5.60, 9.49, 1.99, 1.32, 3.21, 1.12, 1.00, 1.35, 1.79, 1.01, 1.11]);
  const [planePosition, setPlanePosition] = useState({ x: 0, y: 100 });
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gamePhase === 'waiting') {
      // Wait 3 seconds then start flying
      const timeout = setTimeout(() => {
        setGamePhase('flying');
        setMultiplier(1.00);
        setPathPoints([]);
        setPlanePosition({ x: 0, y: 100 });
      }, 3000);
      return () => clearTimeout(timeout);
    }
    
    if (gamePhase === 'flying') {
      interval = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + (Math.random() * 0.05 + 0.01);
          
          // Random crash - higher multiplier = higher crash chance
          const crashChance = (newMultiplier - 1) * 0.02;
          if (Math.random() < crashChance || newMultiplier > 10) {
            setGamePhase('crashed');
            // Add to history
            setHistory(h => [parseFloat(newMultiplier.toFixed(2)), ...h.slice(0, 12)]);
            
            // Reset after crash
            setTimeout(() => {
              setBet1Active(false);
              setBet2Active(false);
              setBet1CashedOut(false);
              setBet2CashedOut(false);
              setGamePhase('waiting');
            }, 2000);
            
            return newMultiplier;
          }
          
          // Update plane position
          const progress = Math.min((newMultiplier - 1) / 5, 1);
          setPlanePosition({
            x: progress * 80,
            y: 100 - (progress * 70) - Math.sin(progress * Math.PI) * 20
          });
          
          setPathPoints(prev => [...prev, {
            x: progress * 80,
            y: 100 - (progress * 70) - Math.sin(progress * Math.PI) * 20
          }]);
          
          return newMultiplier;
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gamePhase]);

  // Draw curve on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (pathPoints.length < 2) return;
    
    // Draw gradient curve
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    pathPoints.forEach((point, i) => {
      const x = (point.x / 100) * canvas.width;
      const y = (point.y / 100) * canvas.height;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Complete the shape for fill
    const lastPoint = pathPoints[pathPoints.length - 1];
    ctx.lineTo((lastPoint.x / 100) * canvas.width, canvas.height);
    ctx.closePath();
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.3)');
    gradient.addColorStop(1, 'rgba(220, 38, 38, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    pathPoints.forEach((point, i) => {
      const x = (point.x / 100) * canvas.width;
      const y = (point.y / 100) * canvas.height;
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [pathPoints]);

  const placeBet = (betNum: 1 | 2) => {
    if (gamePhase !== 'waiting') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    if (balance < amount) return;
    
    setBalance(prev => prev - amount);
    if (betNum === 1) setBet1Active(true);
    else setBet2Active(true);
  };

  const cashOut = (betNum: 1 | 2) => {
    if (gamePhase !== 'flying') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    const isActive = betNum === 1 ? bet1Active : bet2Active;
    const isCashedOut = betNum === 1 ? bet1CashedOut : bet2CashedOut;
    
    if (!isActive || isCashedOut) return;
    
    const winnings = amount * multiplier;
    setBalance(prev => prev + winnings);
    
    if (betNum === 1) setBet1CashedOut(true);
    else setBet2CashedOut(true);
  };

  const getMultiplierColor = (mult: number) => {
    if (mult >= 5) return 'bg-purple-600';
    if (mult >= 2) return 'bg-blue-600';
    return 'bg-blue-500';
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#0f0f1a]">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-red-500 font-bold text-xl italic">Aviator</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#2a2a3e] px-4 py-2 rounded-full">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">How to play?</span>
          </button>
          <div className="text-xl font-bold text-white">{balance.toFixed(2)} $</div>
        </div>
      </div>

      {/* History Bar */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto bg-[#1a1a2e]">
        {history.map((mult, i) => (
          <div
            key={i}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${getMultiplierColor(mult)}`}
          >
            {mult.toFixed(2)}x
          </div>
        ))}
        <button className="flex-shrink-0 p-2 bg-[#2a2a3e] rounded-full">
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Game Area */}
      <div className="relative h-[45vh] bg-[#0f0f1a] mx-2 rounded-lg overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.02) 50px, rgba(255,255,255,0.02) 51px)',
        }}></div>
        
        {/* Canvas for curve */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          width={400}
          height={300}
        />
        
        {/* FUN MODE Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="bg-yellow-500 text-black px-6 py-1 rounded-full text-sm font-bold">
            FUN MODE
          </div>
        </div>

        {/* Multiplier Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          {gamePhase === 'waiting' ? (
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">WAITING...</div>
              <div className="text-sm text-gray-500 mt-2">Next round starting soon</div>
            </div>
          ) : gamePhase === 'crashed' ? (
            <div className="text-center">
              <div className="text-6xl font-black text-red-500">FLEW AWAY!</div>
              <div className="text-3xl font-bold text-white mt-2">{multiplier.toFixed(2)}x</div>
            </div>
          ) : (
            <div className="text-8xl font-black text-white" style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
              {multiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Plane */}
        {gamePhase === 'flying' && (
          <div 
            className="absolute transition-all duration-100"
            style={{ 
              left: `${planePosition.x}%`, 
              top: `${planePosition.y}%`,
              transform: 'translate(-50%, -50%) rotate(-15deg)'
            }}
          >
            <div className="text-5xl">✈️</div>
          </div>
        )}

        {/* Grid dots */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 py-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-600 rounded-full"></div>
          ))}
        </div>
        
        {/* Y-axis markers */}
        <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-4">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="w-1 h-1 bg-green-500 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Betting Panels */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {/* Bet Panel 1 */}
        <div className="bg-[#1e1e32] rounded-lg p-3">
          <div className="flex gap-2 mb-3">
            <button className="flex-1 py-1 bg-[#2a2a3e] rounded text-sm font-bold">Bet</button>
            <button className="flex-1 py-1 text-gray-500 text-sm">Auto</button>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex items-center bg-[#0f0f1a] rounded-lg px-3 py-2">
              <span className="text-xl font-bold">{betAmount1.toFixed(2)}</span>
              <div className="ml-auto flex gap-1">
                <button 
                  onClick={() => setBetAmount1(Math.max(1, betAmount1 - 1))}
                  className="w-7 h-7 bg-[#2a2a3e] rounded-full flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setBetAmount1(betAmount1 + 1)}
                  className="w-7 h-7 bg-[#2a2a3e] rounded-full flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[1, 2, 5, 10].map(amount => (
              <button 
                key={amount}
                onClick={() => setBetAmount1(amount)}
                className="py-1 bg-[#0f0f1a] rounded text-xs text-gray-400"
              >
                {amount}$
              </button>
            ))}
          </div>
          
          <button
            onClick={() => {
              if (bet1Active && gamePhase === 'flying' && !bet1CashedOut) {
                cashOut(1);
              } else if (!bet1Active && gamePhase === 'waiting') {
                placeBet(1);
              }
            }}
            disabled={(gamePhase === 'crashed') || (bet1Active && bet1CashedOut)}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              bet1Active && gamePhase === 'flying' && !bet1CashedOut
                ? 'bg-orange-500 hover:bg-orange-600'
                : bet1CashedOut
                ? 'bg-gray-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {bet1Active && gamePhase === 'flying' && !bet1CashedOut
              ? `CASH OUT ${(betAmount1 * multiplier).toFixed(2)}$`
              : bet1CashedOut
              ? 'CASHED OUT'
              : 'BET'}
          </button>
        </div>

        {/* Bet Panel 2 */}
        <div className="bg-[#1e1e32] rounded-lg p-3">
          <div className="flex gap-2 mb-3">
            <button className="flex-1 py-1 bg-[#2a2a3e] rounded text-sm font-bold">Bet</button>
            <button className="flex-1 py-1 text-gray-500 text-sm">Auto</button>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex items-center bg-[#0f0f1a] rounded-lg px-3 py-2">
              <span className="text-xl font-bold">{betAmount2.toFixed(2)}</span>
              <div className="ml-auto flex gap-1">
                <button 
                  onClick={() => setBetAmount2(Math.max(1, betAmount2 - 1))}
                  className="w-7 h-7 bg-[#2a2a3e] rounded-full flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setBetAmount2(betAmount2 + 1)}
                  className="w-7 h-7 bg-[#2a2a3e] rounded-full flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[1, 2, 5, 10].map(amount => (
              <button 
                key={amount}
                onClick={() => setBetAmount2(amount)}
                className="py-1 bg-[#0f0f1a] rounded text-xs text-gray-400"
              >
                {amount}$
              </button>
            ))}
          </div>
          
          <button
            onClick={() => {
              if (bet2Active && gamePhase === 'flying' && !bet2CashedOut) {
                cashOut(2);
              } else if (!bet2Active && gamePhase === 'waiting') {
                placeBet(2);
              }
            }}
            disabled={(gamePhase === 'crashed') || (bet2Active && bet2CashedOut)}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              bet2Active && gamePhase === 'flying' && !bet2CashedOut
                ? 'bg-orange-500 hover:bg-orange-600'
                : bet2CashedOut
                ? 'bg-gray-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {bet2Active && gamePhase === 'flying' && !bet2CashedOut
              ? `CASH OUT ${(betAmount2 * multiplier).toFixed(2)}$`
              : bet2CashedOut
              ? 'CASHED OUT'
              : 'BET'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AviatorGame;
