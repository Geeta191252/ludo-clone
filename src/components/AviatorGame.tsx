import React, { useState, useEffect, useRef } from 'react';
import { X, History, ChevronDown, Users, Coins, DollarSign } from 'lucide-react';
import { useGameSync } from '@/hooks/useGameSync';

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

// Helper function to update balance on server
const updateServerBalance = async (amount: number, type: 'deduct' | 'add') => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    const mobile = userData.mobile;
    if (!mobile) return null;

    const response = await fetch('/api/update-balance.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, amount, type })
    });
    const data = await response.json();
    if (data.status) {
      // Update localStorage with new balance
      userData.wallet_balance = data.wallet_balance;
      userData.winning_balance = data.winning_balance;
      localStorage.setItem('user', JSON.stringify(userData));
      return data.wallet_balance + data.winning_balance;
    }
    return null;
  } catch (error) {
    console.error('Error updating balance:', error);
    return null;
  }
};

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

  // Use game sync hook for real-time multiplayer
  const { gameState, liveBets: syncedBets, livePlayerCount, serverAvailable } = useGameSync('aviator');

  const [betAmount1, setBetAmount1] = useState(10);
  const [betAmount2, setBetAmount2] = useState(10);
  const [bet1Active, setBet1Active] = useState(false);
  const [bet2Active, setBet2Active] = useState(false);
  const [bet1CashedOut, setBet1CashedOut] = useState(false);
  const [bet2CashedOut, setBet2CashedOut] = useState(false);
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);
  const [winPopup, setWinPopup] = useState<WinPopup>({ amount: 0, mult: 0, visible: false });
  const [showHistory, setShowHistory] = useState(false);
  const [localBets, setLocalBets] = useState<{username: string, odds: string, bet: number, win: number, isUser?: boolean, betNum?: number}[]>([]);
  const prevPhaseRef = useRef<string | null>(null);
  
  // Local game state - always active for immediate display
  const [localGamePhase, setLocalGamePhase] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [localMultiplier, setLocalMultiplier] = useState(1.00);
  const [localCountdown, setLocalCountdown] = useState(10);
  const [localHistory, setLocalHistory] = useState<number[]>([5.01, 2.60, 3.45, 1.23, 8.92]);
  const [localPlanePos, setLocalPlanePos] = useState({ x: 10, y: 80 });
  const [localCrashPoint] = useState(() => 1.2 + Math.random() * 13.8);
  const [currentCrashPoint, setCurrentCrashPoint] = useState(localCrashPoint);

  // USE SERVER STATE when available for TRUE synchronization across devices
  // Smooth interpolation for plane animation to avoid stuttering
  const hasValidServerState = serverAvailable && gameState && gameState.phase;
  
  // Get raw values from server or local
  const rawMultiplier = hasValidServerState ? Number(gameState.multiplier || 1.00) : localMultiplier;
  const gamePhase = hasValidServerState ? (gameState.phase as 'waiting' | 'flying' | 'crashed') : localGamePhase;
  const countdown = hasValidServerState ? Number(gameState.timer || 5) : localCountdown;
  const history = hasValidServerState && Array.isArray(gameState.history) 
    ? gameState.history.map((h: any) => typeof h === 'number' ? h : (h.crash_point || h)) 
    : localHistory;
  const rawPlanePosition = hasValidServerState 
    ? { x: Number(gameState.plane_x || 10), y: Number(gameState.plane_y || 80) }
    : localPlanePos;
  
  // CLIENT-SIDE SMOOTH ANIMATION - completely independent of server updates
  // This runs at 60fps and never stutters because it doesn't depend on server polling
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [animatedPlanePos, setAnimatedPlanePos] = useState({ x: 10, y: 80 });
  
  // Sound refs - using preloaded audio elements
  const flyingSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashSoundRef = useRef<HTMLAudioElement | null>(null);
  const countdownSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsInitializedRef = useRef(false);
  
  // Initialize sounds only once
  useEffect(() => {
    if (soundsInitializedRef.current) return;
    soundsInitializedRef.current = true;
    
    // Flying sound - plays during plane flight
    const flyingSound = new Audio();
    flyingSound.src = '/sounds/plane-flying.mp3';
    flyingSound.loop = true;
    flyingSound.volume = 0.5;
    flyingSound.preload = 'auto';
    flyingSoundRef.current = flyingSound;
    
    // Crash sound - plays when plane crashes
    const crashSound = new Audio();
    crashSound.src = '/sounds/plane-crash.mp3';
    crashSound.volume = 0.7;
    crashSound.preload = 'auto';
    crashSoundRef.current = crashSound;
    
    // Countdown sound - plays during 10 sec waiting timer
    const countdownSound = new Audio();
    countdownSound.src = '/sounds/game-start.mp3';
    countdownSound.loop = true;
    countdownSound.volume = 0.6;
    countdownSound.preload = 'auto';
    countdownSoundRef.current = countdownSound;
    
    return () => {
      [flyingSoundRef, crashSoundRef, countdownSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
          ref.current = null;
        }
      });
    };
  }, []);
  
  // Handle all game sounds based on phase
  useEffect(() => {
    const playSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.log('Sound play error:', err));
      }
    };
    
    const stopSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
    
    if (gamePhase === 'waiting') {
      // Stop other sounds, play countdown
      stopSound(flyingSoundRef);
      stopSound(crashSoundRef);
      playSound(countdownSoundRef);
    } else if (gamePhase === 'flying') {
      // Stop countdown, play flying sound
      stopSound(countdownSoundRef);
      stopSound(crashSoundRef);
      playSound(flyingSoundRef);
    } else if (gamePhase === 'crashed') {
      // Stop all, play crash sound
      stopSound(countdownSoundRef);
      stopSound(flyingSoundRef);
      playSound(crashSoundRef);
    }
  }, [gamePhase]);
  
  // Continuous smooth plane animation during flying phase
  useEffect(() => {
    if (gamePhase !== 'flying') {
      // Reset plane position when not flying
      setAnimatedPlanePos({ x: 10, y: 80 });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Stop flying sound when not flying
      if (flyingSoundRef.current) {
        flyingSoundRef.current.pause();
        flyingSoundRef.current.currentTime = 0;
      }
      return;
    }
    
    // Play flying sound when plane takes off
    if (flyingSoundRef.current) {
      flyingSoundRef.current.currentTime = 0;
      flyingSoundRef.current.play().catch(() => {});
    }
    
    startTimeRef.current = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTimeRef.current;
      // Calculate smooth position based on time elapsed (creates constant smooth movement)
      const progress = elapsed / 1000; // seconds
      
      // Smooth continuous movement - plane flies from left-bottom to right-top
      const newX = Math.min(10 + progress * 8, 85); // Move right at constant speed
      const newY = Math.max(80 - progress * 7, 15); // Move up at constant speed
      
      setAnimatedPlanePos({ x: newX, y: newY });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gamePhase]);
  
  // Use server multiplier for display, but client-side position for smooth animation
  const multiplier = rawMultiplier;
  const planePosition = animatedPlanePos; // Use client-animated position - never stutters!
  const liveUsers = livePlayerCount || 1;
  const planeRotation = -25 + Math.pow(Math.min((multiplier - 1) / 10, 1), 0.5) * 10;

  // Run local game simulation ONLY when server is not available (fallback mode)
  useEffect(() => {
    // If server is providing valid state, don't run local simulation
    if (hasValidServerState) return;

    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    
    if (localGamePhase === 'waiting') {
      interval = setInterval(() => {
        setLocalCountdown(prev => {
          if (prev <= 1) {
            setLocalGamePhase('flying');
            setLocalMultiplier(1.00);
            setLocalPlanePos({ x: 10, y: 80 });
            // Generate new crash point for this round
            setCurrentCrashPoint(1.2 + Math.random() * 13.8);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (localGamePhase === 'flying') {
      interval = setInterval(() => {
        setLocalMultiplier(prev => {
          const newMult = prev + 0.03 + Math.random() * 0.05;
          if (newMult >= currentCrashPoint) {
            setLocalGamePhase('crashed');
            setLocalHistory(h => [Number(newMult.toFixed(2)), ...h.slice(0, 19)]);
            return newMult;
          }
          // Update plane position
          setLocalPlanePos({
            x: Math.min(10 + (newMult - 1) * 15, 85),
            y: Math.max(80 - (newMult - 1) * 12, 15)
          });
          return newMult;
        });
      }, 100);
    } else if (localGamePhase === 'crashed') {
      timeout = setTimeout(() => {
        setLocalGamePhase('waiting');
        setLocalCountdown(5);
        setLocalMultiplier(1.00);
        setLocalPlanePos({ x: 10, y: 80 });
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [localGamePhase, currentCrashPoint, hasValidServerState]);

  // Combine synced bets with local user bets - ONLY REAL USERS
  const liveBets = [
    ...localBets.filter(b => b.isUser),
    ...syncedBets.map(b => ({
      username: b.username || `***${b.mobile?.slice(-4) || '****'}`,
      odds: b.odds || 'x0',
      bet: Number(b.bet_amount) || 0,
      win: Number(b.win_amount) || 0,
      isUser: false
    }))
  ].sort((a, b) => b.bet - a.bet);
  
  // Calculated stats from actual bets (with safety checks)
  const validBets = liveBets.filter(b => b && typeof b.bet === 'number');
  const numberOfBets = validBets.length;
  const totalBetsAmount = validBets.reduce((sum, b) => sum + b.bet, 0);
  const totalWinningsAmount = validBets.reduce((sum, b) => sum + (b.win || 0), 0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle phase transitions for game logic (sounds are handled in the main sound effect above)
  useEffect(() => {
    if (prevPhaseRef.current !== gamePhase) {
      if (gamePhase === 'flying' && prevPhaseRef.current === 'waiting') {
        setPathPoints([{ x: 0, y: 100 }]);
      } else if (gamePhase === 'crashed' && prevPhaseRef.current === 'flying') {
        // Reset user bets on crash
        setBet1Active(false);
        setBet2Active(false);
        setBet1CashedOut(false);
        setBet2CashedOut(false);
        setLocalBets([]);
        setPathPoints([]);
      } else if (gamePhase === 'waiting' && prevPhaseRef.current === 'crashed') {
        setPathPoints([]);
      }
      prevPhaseRef.current = gamePhase;
    }
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
    
    // Draw golden line only (no fill)
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    for (let i = 0; i < pathPoints.length; i++) {
      const point = pathPoints[i];
      ctx.lineTo((point.x / 100) * w, (point.y / 100) * h);
    }
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [pathPoints]);

  const placeBet = async (betNum: 1 | 2) => {
    if (gamePhase !== 'waiting') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    if (balance < amount) return;
    
    // Bet placed
    
    // Update server balance
    const newBalance = await updateServerBalance(amount, 'deduct');
    if (newBalance !== null) {
      setBalance(newBalance);
    } else {
      setBalance(prev => prev - amount);
    }
    
    if (betNum === 1) setBet1Active(true);
    else setBet2Active(true);
    
    // Add user's bet to the table
    const userBet = {
      username: `YOU (Bet ${betNum})`,
      odds: 'x0',
      bet: amount,
      win: 0,
      isUser: true,
      betNum: betNum
    };
    setLocalBets(prev => [userBet, ...prev.filter(b => !(b.isUser && b.betNum === betNum))]);
  };

  const cancelBet = async (betNum: 1 | 2) => {
    if (gamePhase !== 'waiting') return;
    const isActive = betNum === 1 ? bet1Active : bet2Active;
    if (!isActive) return;
    
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    // Bet cancelled
    
    // Refund to server
    const newBalance = await updateServerBalance(amount, 'add');
    if (newBalance !== null) {
      setBalance(newBalance);
    } else {
      setBalance(prev => prev + amount);
    }
    
    if (betNum === 1) setBet1Active(false);
    else setBet2Active(false);
    
    // Remove user's bet from table
    setLocalBets(prev => prev.filter(b => !(b.isUser && b.betNum === betNum)));
  };

  const cashOut = async (betNum: 1 | 2) => {
    if (gamePhase !== 'flying') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    const isActive = betNum === 1 ? bet1Active : bet2Active;
    const isCashedOut = betNum === 1 ? bet1CashedOut : bet2CashedOut;
    
    if (!isActive || isCashedOut) return;
    
    // Cash out - win!
    const winnings = amount * multiplier;
    
    // Add winnings to server
    const newBalance = await updateServerBalance(winnings, 'add');
    if (newBalance !== null) {
      setBalance(newBalance);
    } else {
      setBalance(prev => prev + winnings);
    }
    
    setWinPopup({ amount: winnings, mult: multiplier, visible: true });
    setTimeout(() => setWinPopup(prev => ({ ...prev, visible: false })), 2000);
    
    if (betNum === 1) setBet1CashedOut(true);
    else setBet2CashedOut(true);
    
    // Update user's bet in table with win
    setLocalBets(prev => prev.map(b => {
      if (b.isUser && b.betNum === betNum) {
        return { ...b, odds: `x${multiplier.toFixed(2)}`, win: Math.floor(winnings) };
      }
      return b;
    }));
  };

  const getMultiplierColor = (mult: number) => {
    if (mult >= 5) return 'bg-green-500';
    if (mult >= 2) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  // No loading state needed - game runs locally if server unavailable

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
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${serverAvailable ? 'bg-green-500/20 border-green-500/50' : 'bg-yellow-500/20 border-yellow-500/50'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${serverAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className={`text-sm font-semibold ${serverAvailable ? 'text-green-400' : 'text-yellow-400'}`}>{liveUsers.toLocaleString()}</span>
            <span className={`text-xs ${serverAvailable ? 'text-green-400/70' : 'text-yellow-400/70'}`}>{serverAvailable ? 'LIVE SYNC' : 'LOCAL'}</span>
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
      <div className="relative mx-3 rounded-xl overflow-hidden" style={{ height: '140px' }}>
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
              <div className="text-5xl font-black text-white mb-1">{countdown}</div>
              <div className="text-sm font-bold text-gray-400">PLACE YOUR BET</div>
              <div className="mt-2 w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                />
              </div>
            </div>
          ) : gamePhase === 'crashed' ? (
            <div className="text-center">
              <div className="text-4xl font-black text-red-500">FLEW AWAY!</div>
              <div className="text-2xl font-bold text-white mt-1">{multiplier.toFixed(2)}x</div>
            </div>
          ) : (
            <div 
              className="text-5xl font-black text-white"
              style={{ 
                fontFamily: 'Arial Black, sans-serif',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {multiplier.toFixed(2)}x
            </div>
          )}
        </div>

        {/* Golden Propeller Airplane - Uses client-side animation for butter-smooth movement */}
        {gamePhase === 'flying' && (
          <div 
            className="absolute z-30"
            style={{ 
              left: `${planePosition.x}%`, 
              top: `${planePosition.y}%`,
              transform: `translate(-50%, -50%) rotate(${planeRotation}deg)`,
              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))'
            }}
          >
            <svg width="60" height="38" viewBox="0 0 120 70" fill="none">
              <defs>
                <linearGradient id="bodyGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFD93D" />
                  <stop offset="30%" stopColor="#F4A42E" />
                  <stop offset="70%" stopColor="#E08B1A" />
                  <stop offset="100%" stopColor="#C67614" />
                </linearGradient>
                <linearGradient id="wingGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFEB6B" />
                  <stop offset="50%" stopColor="#E8A424" />
                  <stop offset="100%" stopColor="#B86B0A" />
                </linearGradient>
                <linearGradient id="cockpitGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFE066" />
                  <stop offset="100%" stopColor="#D4871A" />
                </linearGradient>
                <linearGradient id="engineGold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4871A" />
                  <stop offset="100%" stopColor="#8B5A0A" />
                </linearGradient>
              </defs>
              
              {/* Tail Section */}
              <path d="M8 35 L22 22 L28 24 L22 35 Z" fill="url(#wingGold)" />
              <path d="M8 35 L22 48 L28 46 L22 35 Z" fill="url(#wingGold)" />
              <ellipse cx="15" cy="35" rx="8" ry="5" fill="url(#bodyGold)" />
              
              {/* Main Fuselage */}
              <ellipse cx="55" cy="35" rx="42" ry="14" fill="url(#bodyGold)" />
              
              {/* Top Wing */}
              <path d="M35 35 L55 8 L68 12 L52 35 Z" fill="url(#wingGold)" stroke="#C67614" strokeWidth="0.5" />
              
              {/* Bottom Wing */}
              <path d="M35 35 L55 62 L68 58 L52 35 Z" fill="url(#wingGold)" stroke="#C67614" strokeWidth="0.5" />
              
              {/* Cockpit Dome */}
              <ellipse cx="68" cy="30" rx="14" ry="10" fill="url(#cockpitGold)" />
              <ellipse cx="68" cy="30" rx="11" ry="7" fill="#5C3D0A" opacity="0.85" />
              <ellipse cx="66" cy="28" rx="4" ry="2" fill="#8B6914" opacity="0.4" />
              
              {/* Nose/Engine Section */}
              <ellipse cx="95" cy="35" rx="12" ry="9" fill="url(#engineGold)" />
              <circle cx="102" cy="35" r="6" fill="#8B5A0A" />
              <circle cx="102" cy="35" r="4" fill="#6B4A0A" />
              
              {/* Propeller */}
              <ellipse cx="110" cy="35" rx="3" ry="14" fill="#444" opacity="0.8">
                <animateTransform 
                  attributeName="transform" 
                  type="rotate" 
                  from="0 110 35" 
                  to="360 110 35" 
                  dur="0.08s" 
                  repeatCount="indefinite"
                />
              </ellipse>
              
              {/* Wing Highlights */}
              <path d="M40 32 L52 14 L56 16 L46 32 Z" fill="#FFE066" opacity="0.3" />
              
              {/* Body Highlight */}
              <ellipse cx="50" cy="28" rx="25" ry="4" fill="#FFE066" opacity="0.25" />
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
            <div key={panelNum} className="bg-[#1a2332] rounded-xl p-3">
              <div className="flex gap-3">
                {/* Left Side - Input and Quick Amounts */}
                <div className="flex-1 space-y-2">
                  {/* Input with X button */}
                  <div className="flex items-center bg-[#0d1520] rounded-lg border border-gray-600 px-3 py-2">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value) || 1))}
                      className="bg-transparent text-white text-lg font-medium flex-1 outline-none w-full"
                    />
                    <button 
                      onClick={() => setBetAmount(1)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Quick Amount Buttons - 2 rows */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 5, 10, 50, 100].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        className="py-2 rounded-lg bg-[#2a3a4d] border border-gray-600 text-white font-semibold text-sm hover:bg-[#3a4a5d] transition-colors"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Side - Autoplay and Bet Button */}
                <div className="flex flex-col gap-2 w-36">
                  {/* Enable Autoplay Button */}
                  <button className="py-2 px-3 rounded-lg border-2 border-orange-500 text-orange-500 font-bold text-xs hover:bg-orange-500/10 transition-colors">
                    ENABLE AUTOPLAY
                  </button>

                  {/* Place a Bet Button */}
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
                    className={`flex-1 rounded-lg font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center ${
                      betActive && gamePhase === 'flying' && !betCashedOut
                        ? 'bg-orange-500 text-white'
                        : betCashedOut
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : betActive && gamePhase === 'waiting'
                        ? 'bg-red-600 text-white'
                        : 'bg-orange-500 text-white hover:bg-orange-400'
                    }`}
                  >
                    {betActive && gamePhase === 'flying' && !betCashedOut ? (
                      <span>₹{(betAmount * multiplier).toFixed(0)}</span>
                    ) : betCashedOut ? (
                      <span>WON</span>
                    ) : betActive && gamePhase === 'waiting' ? (
                      <span>CANCEL</span>
                    ) : (
                      <>
                        <span>PLACE A BET</span>
                        <span className="text-[10px] font-normal opacity-80">(on the next round)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Bets Stats Panel */}
      <div className="mx-2 mb-2 rounded-xl overflow-hidden">
        {/* Stats Header - Gradient */}
        <div className="bg-gradient-to-r from-[#1a3a5c] to-[#5c2a3a] grid grid-cols-3 py-3 px-2 text-center">
          <div>
            <div className="text-cyan-300 text-xs font-medium">Number of bets</div>
            <div className="text-white font-bold flex items-center justify-center gap-1 text-sm">
              <Users className="w-4 h-4 text-cyan-300" /> {numberOfBets}
            </div>
          </div>
          <div>
            <div className="text-cyan-300 text-xs font-medium">Total bets</div>
            <div className="text-white font-bold flex items-center justify-center gap-1 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" /> ₹{totalBetsAmount.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-red-300 text-xs font-medium">Total winnings</div>
            <div className="text-white font-bold flex items-center justify-center gap-1 text-sm">
              <DollarSign className="w-4 h-4 text-green-400" /> ₹{totalWinningsAmount}
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-[#1e2a3a] grid grid-cols-4 py-2 px-3 text-xs text-gray-400 font-semibold">
          <div>USERNAME</div>
          <div className="text-center">ODDS</div>
          <div className="text-center">BET</div>
          <div className="text-right">WIN</div>
        </div>

        {/* Table Body */}
        <div className="bg-[#151d28] max-h-40 overflow-y-auto">
          {[...liveBets]
            .sort((a, b) => {
              // User bets first, Bet 1 before Bet 2
              const aIsUser = (a as any).isUser;
              const bIsUser = (b as any).isUser;
              if (aIsUser && !bIsUser) return -1;
              if (!aIsUser && bIsUser) return 1;
              if (aIsUser && bIsUser) {
                return (a as any).betNum - (b as any).betNum;
              }
              return b.bet - a.bet; // Sort others by bet amount
            })
            .map((bet, i) => {
              const isUserBet = (bet as any).isUser;
              const isLoser = gamePhase === 'crashed' && bet.odds === 'x0'; // User lost - didn't cash out
              const isWinner = bet.win > 0;
              return (
                <div 
                  key={i} 
                  className={`grid grid-cols-4 py-2.5 px-3 text-sm border-b border-gray-800/50 ${
                    isUserBet ? 'bg-yellow-500/20 border-l-4 border-l-yellow-500' : ''
                  }`}
                >
                  <div className={
                    isUserBet ? 'text-yellow-400 font-bold' : 
                    isLoser ? 'text-red-500' : 
                    'text-gray-300'
                  }>{bet.username}</div>
                  <div className={`text-center ${
                    isWinner ? 'text-green-400' : 
                    isLoser ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>{bet.odds}</div>
                  <div className={`text-center ${
                    isUserBet ? 'text-yellow-400 font-semibold' : 
                    isLoser ? 'text-red-500' : 
                    'text-white'
                  }`}>₹{bet.bet}</div>
                  <div className={`text-right ${
                    isWinner ? 'text-green-400 font-semibold' : 
                    isLoser ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>₹{bet.win}</div>
                </div>
              );
            })}
        </div>
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
