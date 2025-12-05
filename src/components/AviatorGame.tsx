import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus, History, ChevronDown } from 'lucide-react';
import { useGameSounds } from '@/hooks/useGameSounds';

interface AviatorGameProps {
  onClose: () => void;
  balance?: number;
  onBalanceChange?: (balance: number) => void;
}

interface WinPopup {
  amount: number;
  mult: number;
  visible: boolean;
}

const AviatorGame: React.FC<AviatorGameProps> = ({ onClose, balance: externalBalance, onBalanceChange }) => {
  const [internalBalance, setInternalBalance] = useState(10000);
  const balance = externalBalance !== undefined ? externalBalance : internalBalance;
  
  const setBalance = (value: number | ((prev: number) => number)) => {
    const newBalance = typeof value === 'function' ? value(balance) : value;
    if (onBalanceChange) {
      onBalanceChange(newBalance);
    } else {
      setInternalBalance(newBalance);
    }
  };

  const [betAmount1, setBetAmount1] = useState(10);
  const [betAmount2, setBetAmount2] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [countdown, setCountdown] = useState(5);
  const [bet1Active, setBet1Active] = useState(false);
  const [bet2Active, setBet2Active] = useState(false);
  const [bet1CashedOut, setBet1CashedOut] = useState(false);
  const [bet2CashedOut, setBet2CashedOut] = useState(false);
  const [history, setHistory] = useState<number[]>([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
  const [planePosition, setPlanePosition] = useState({ x: 10, y: 80 });
  const [planeRotation, setPlaneRotation] = useState(-20);
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);
  const [winPopup, setWinPopup] = useState<WinPopup>({ amount: 0, mult: 0, visible: false });
  const [liveUsers, setLiveUsers] = useState(2847);
  const [showHistory, setShowHistory] = useState(false);
  
  // Simulated live bets from other players
  const [liveBets] = useState([
    { username: '*******97', odds: 'x0', bet: 47.52, win: 0 },
    { username: '*******75', odds: 'x0', bet: 32.85, win: 0 },
    { username: '*******83', odds: 'x0', bet: 11.13, win: 0 },
    { username: '*******15', odds: 'x0', bet: 9.67, win: 0 },
    { username: '*******75', odds: 'x0', bet: 8.45, win: 0 },
    { username: '*******83', odds: 'x0', bet: 5.57, win: 0 },
    { username: '*******63', odds: 'x0', bet: 5.51, win: 0 },
    { username: '*******51', odds: 'x0', bet: 5.34, win: 0 },
    { username: '*******41', odds: 'x0', bet: 5.33, win: 0 },
    { username: '*******27', odds: 'x0', bet: 5.30, win: 0 },
    { username: '*******53', odds: 'x0', bet: 5.05, win: 0 },
    { username: '*******53', odds: 'x0', bet: 5.05, win: 0 },
    { username: '*******45', odds: 'x0', bet: 4.24, win: 0 },
    { username: '*******29', odds: 'x0', bet: 4.20, win: 0 },
    { username: '*******27', odds: 'x0', bet: 4.10, win: 0 },
  ]);

  const totalBets = liveBets.reduce((sum, b) => sum + b.bet, 0);
  const totalWinnings = liveBets.reduce((sum, b) => sum + b.win, 0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playChipSound, playWinSound, playLoseSound, playCrashSound, playTakeoffSound, playCountdownBeep, startEngineSound, stopEngineSound } = useGameSounds();

  // Simulate live user count fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
        return Math.max(2500, Math.min(3500, prev + change));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Game loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let engineCleanup: (() => void) | null = null;
    
    if (gamePhase === 'waiting') {
      // 5 second countdown
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            playTakeoffSound();
            setGamePhase('flying');
            setMultiplier(1.00);
            setPathPoints([{ x: 0, y: 100 }]);
            setPlanePosition({ x: 10, y: 80 });
            return 5;
          }
          // Play countdown beep sound
          playCountdownBeep();
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    
    if (gamePhase === 'flying') {
      // Start continuous engine sound
      engineCleanup = startEngineSound();
      
      interval = setInterval(() => {
        setMultiplier(prev => {
          const increment = Math.random() * 0.06 + 0.02;
          const newMultiplier = prev + increment;
          
          const crashChance = (newMultiplier - 1) * 0.012;
          if (Math.random() < crashChance || newMultiplier > 20) {
            stopEngineSound();
            playCrashSound();
            playLoseSound();
            setGamePhase('crashed');
            setHistory(h => [parseFloat(newMultiplier.toFixed(2)), ...h.slice(0, 5)]);
            
            setTimeout(() => {
              setBet1Active(false);
              setBet2Active(false);
              setBet1CashedOut(false);
              setBet2CashedOut(false);
              setCountdown(5);
              setGamePhase('waiting');
            }, 2500);
            
            return newMultiplier;
          }
          
          const progress = Math.min((newMultiplier - 1) / 10, 1);
          const curve = Math.pow(progress, 0.5);
          const newX = 5 + curve * 70;
          const newY = 95 - curve * 65;
          
          setPlanePosition({ x: newX, y: newY });
          setPlaneRotation(-25 + curve * 10);
          
          setPathPoints(prev => [...prev, { x: newX, y: newY }]);
          
          return newMultiplier;
        });
      }, 80);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (engineCleanup) engineCleanup();
      stopEngineSound();
    };
  }, [gamePhase]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    if (pathPoints.length < 2) return;
    
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    
    // Draw gradient fill under curve
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    pathPoints.forEach((point) => {
      ctx.lineTo((point.x / 100) * w, (point.y / 100) * h);
    });
    
    const lastPoint = pathPoints[pathPoints.length - 1];
    ctx.lineTo((lastPoint.x / 100) * w, h);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(180, 30, 50, 0.9)');
    gradient.addColorStop(0.5, 'rgba(140, 20, 40, 0.7)');
    gradient.addColorStop(1, 'rgba(100, 10, 30, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw red line
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    for (let i = 0; i < pathPoints.length; i++) {
      const point = pathPoints[i];
      ctx.lineTo((point.x / 100) * w, (point.y / 100) * h);
    }
    
    ctx.strokeStyle = '#dc143c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [pathPoints]);

  const placeBet = (betNum: 1 | 2) => {
    if (gamePhase !== 'waiting') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    if (balance < amount) return;
    
    playChipSound();
    setBalance(prev => prev - amount);
    if (betNum === 1) setBet1Active(true);
    else setBet2Active(true);
  };

  const cancelBet = (betNum: 1 | 2) => {
    if (gamePhase !== 'waiting') return;
    const isActive = betNum === 1 ? bet1Active : bet2Active;
    if (!isActive) return;
    
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    playChipSound();
    setBalance(prev => prev + amount);
    if (betNum === 1) setBet1Active(false);
    else setBet2Active(false);
  };

  const cashOut = (betNum: 1 | 2) => {
    if (gamePhase !== 'flying') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    const isActive = betNum === 1 ? bet1Active : bet2Active;
    const isCashedOut = betNum === 1 ? bet1CashedOut : bet2CashedOut;
    
    if (!isActive || isCashedOut) return;
    
    playWinSound();
    const winnings = amount * multiplier;
    setBalance(prev => prev + winnings);
    
    setWinPopup({ amount: winnings, mult: multiplier, visible: true });
    setTimeout(() => setWinPopup(prev => ({ ...prev, visible: false })), 2000);
    
    if (betNum === 1) setBet1CashedOut(true);
    else setBet2CashedOut(true);
  };

  const getMultiplierColor = (mult: number) => {
    if (mult >= 5) return 'bg-green-500';
    if (mult >= 2) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-2xl font-black italic text-red-500" style={{ fontFamily: 'cursive' }}>
          Aviator
        </div>
        <button 
          onClick={onClose}
          className="px-8 py-2 rounded-full border border-gray-600 text-green-400 font-medium"
        >
          Exit
        </button>
        <div className="px-6 py-2 rounded-full border border-gray-600 text-white font-medium">
          ₹{balance}
        </div>
      </div>

      {/* History Bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          {history.slice(0, 1).map((mult, i) => (
            <div
              key={i}
              className={`px-3 py-1 rounded-full text-sm font-bold ${getMultiplierColor(mult)}`}
            >
              {mult.toFixed(2)}x
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* Live User Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">{liveUsers.toLocaleString()}</span>
            <span className="text-green-400/70 text-xs">LIVE</span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            <History className="w-4 h-4" />
            <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mx-4 mb-2 p-3 bg-gray-800/90 rounded-xl border border-gray-700 max-h-40 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2 font-semibold">ROUND HISTORY</div>
          <div className="flex flex-wrap gap-2">
            {history.map((mult, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 rounded-full text-sm font-bold ${getMultiplierColor(mult)}`}
              >
                {mult.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="relative flex-1 mx-3 rounded-xl overflow-hidden" style={{ minHeight: '200px', maxHeight: '250px' }}>
        {/* Sunburst Background */}
        <div className="absolute inset-0 bg-[#1a1a1a]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="sunburst-center" cx="100%" cy="100%" r="150%">
                <stop offset="0%" stopColor="#2a2a2a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#sunburst-center)" />
            {/* Sunburst rays */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15) - 90;
              const x2 = 100 + Math.cos((angle * Math.PI) / 180) * 150;
              const y2 = 100 + Math.sin((angle * Math.PI) / 180) * 150;
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={x2}
                  y2={y2}
                  stroke={i % 2 === 0 ? '#252525' : '#1a1a1a'}
                  strokeWidth="8"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Y-axis dots */}
        <div className="absolute left-3 top-4 bottom-16 flex flex-col justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-cyan-400" />
          ))}
        </div>
        
        {/* Canvas for curve */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full z-10"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Multiplier Display */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {gamePhase === 'waiting' ? (
            <div className="text-center">
              <div className="text-6xl font-black text-white mb-2">{countdown}</div>
              <div className="text-xl font-bold text-gray-400">PLACE YOUR BET</div>
              <div className="mt-4 w-32 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                />
              </div>
            </div>
          ) : gamePhase === 'crashed' ? (
            <div className="text-center">
              <div className="text-5xl font-black text-red-500">FLEW AWAY!</div>
              <div className="text-3xl font-bold text-white mt-2">{multiplier.toFixed(2)}x</div>
            </div>
          ) : (
            <div 
              className="text-7xl sm:text-8xl font-black text-white"
              style={{ 
                fontFamily: 'Arial Black, sans-serif',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {multiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Red Airplane */}
        {gamePhase === 'flying' && (
          <div 
            className="absolute z-30 transition-all duration-75"
            style={{ 
              left: `${planePosition.x}%`, 
              top: `${planePosition.y}%`,
              transform: `translate(-50%, -50%) rotate(${planeRotation}deg)`
            }}
          >
            <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
              {/* Plane body */}
              <ellipse cx="35" cy="25" rx="30" ry="12" fill="#dc143c" />
              {/* Cockpit */}
              <ellipse cx="58" cy="25" rx="12" ry="8" fill="#8b0000" />
              {/* Top wing */}
              <path d="M20 25 L35 5 L45 5 L35 25 Z" fill="#dc143c" />
              {/* Bottom wing */}
              <path d="M20 25 L35 45 L45 45 L35 25 Z" fill="#dc143c" />
              {/* Tail */}
              <path d="M5 25 L15 15 L15 35 Z" fill="#dc143c" />
              {/* Propeller */}
              <ellipse cx="68" cy="25" rx="3" ry="10" fill="#333" />
              {/* Window */}
              <ellipse cx="50" cy="23" rx="4" ry="3" fill="#222" />
              {/* X mark on wing */}
              <text x="28" y="28" fill="#8b0000" fontSize="10" fontWeight="bold">X</text>
            </svg>
          </div>
        )}
        
        {/* X-axis dots */}
        <div className="absolute bottom-3 left-8 right-4 flex justify-between z-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/80" />
          ))}
        </div>
      </div>

      {/* Betting Panels */}
      <div className="p-2 space-y-2">
        {[1, 2].map((panelNum) => {
          const betAmount = panelNum === 1 ? betAmount1 : betAmount2;
          const setBetAmount = panelNum === 1 ? setBetAmount1 : setBetAmount2;
          const betActive = panelNum === 1 ? bet1Active : bet2Active;
          const betCashedOut = panelNum === 1 ? bet1CashedOut : bet2CashedOut;

          return (
            <div key={panelNum} className="bg-[#252525] rounded-xl p-2">
              <div className="flex gap-2">
                {/* Bet Amount Section */}
                <div className="flex-1 space-y-1.5">
                  {/* Amount with +/- */}
                  <div className="flex items-center bg-[#1a1a1a] rounded-full px-3 py-1.5">
                    <span className="text-base font-bold flex-1">{betAmount.toFixed(2)}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
                        className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => setBetAmount(betAmount + 10)}
                        className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Preset amounts */}
                  <div className="grid grid-cols-4 gap-1">
                    {[100, 200, 500, 1000].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        className="py-1 rounded-full bg-[#1a1a1a] border border-gray-700 text-gray-400 font-medium text-xs"
                      >
                        {amount}₹
                      </button>
                    ))}
                  </div>
                </div>

                {/* BET Button */}
                <button
                  onClick={() => {
                    if (betActive && gamePhase === 'flying' && !betCashedOut) {
                      cashOut(panelNum as 1 | 2);
                    } else if (betActive && gamePhase === 'waiting') {
                      cancelBet(panelNum as 1 | 2);
                    } else if (!betActive && gamePhase === 'waiting') {
                      placeBet(panelNum as 1 | 2);
                    }
                  }}
                  disabled={
                    (gamePhase === 'crashed') ||
                    (gamePhase === 'flying' && !betActive) ||
                    betCashedOut
                  }
                  className={`w-24 rounded-xl font-bold text-base transition-all active:scale-95 ${
                    betActive && gamePhase === 'flying' && !betCashedOut
                      ? 'bg-orange-500 text-white'
                      : betCashedOut
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : betActive && gamePhase === 'waiting'
                      ? 'bg-red-600 text-white'
                      : gamePhase === 'waiting' && !betActive
                      ? 'bg-green-500 text-white hover:bg-green-400'
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {betActive && gamePhase === 'flying' && !betCashedOut
                    ? `₹${(betAmount * multiplier).toFixed(0)}`
                    : betCashedOut
                    ? 'WON'
                    : betActive && gamePhase === 'waiting'
                    ? 'CANCEL'
                    : 'BET'}
                </button>
      </div>

      {/* Live Bets Stats Panel */}
      <div className="mx-2 mt-2 rounded-xl overflow-hidden">
        {/* Stats Header */}
        <div className="bg-[#1a3a5c] grid grid-cols-3 py-3 px-4 text-center">
          <div>
            <div className="text-cyan-300 text-xs font-medium">Number of bets</div>
            <div className="text-white font-bold flex items-center justify-center gap-1">
              <span className="text-yellow-400">👤</span> {liveBets.length + 390}
            </div>
          </div>
          <div>
            <div className="text-cyan-300 text-xs font-medium">Total bets</div>
            <div className="text-white font-bold flex items-center justify-center gap-1">
              <span className="text-yellow-400">💰</span> {totalBets.toFixed(2)} INR
            </div>
          </div>
          <div>
            <div className="text-cyan-300 text-xs font-medium">Total winnings</div>
            <div className="text-white font-bold flex items-center justify-center gap-1">
              <span className="text-yellow-400">💵</span> {totalWinnings} INR
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-[#2a3a4a] grid grid-cols-4 py-2 px-4 text-xs text-gray-400 font-semibold">
          <div>USERNAME</div>
          <div className="text-center">ODDS</div>
          <div className="text-center">BET</div>
          <div className="text-right">WIN</div>
        </div>

        {/* Table Body */}
        <div className="bg-[#1e2a3a] max-h-48 overflow-y-auto">
          {liveBets.map((bet, i) => (
            <div key={i} className="grid grid-cols-4 py-2 px-4 text-sm border-b border-gray-700/30">
              <div className="text-gray-300">{bet.username}</div>
              <div className="text-center text-gray-400">{bet.odds}</div>
              <div className="text-center text-white">{bet.bet.toFixed(2)} INR</div>
              <div className="text-right text-gray-400">{bet.win} INR</div>
            </div>
          ))}
        </div>
      </div>
            </div>
          );
        })}
      </div>

      {/* Win Popup */}
      {winPopup.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-xl text-center animate-bounce">
            <div className="text-2xl font-bold">YOU WON!</div>
            <div className="text-3xl font-black">₹{winPopup.amount.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AviatorGame;
