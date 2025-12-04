import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, HelpCircle, Minus, Plus, History, Volume2, VolumeX, Plane, TrendingUp, Users, Zap, Trophy, Sparkles, Target } from 'lucide-react';

interface AviatorGameProps {
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface WinPopup {
  amount: number;
  mult: number;
  visible: boolean;
}

const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const flyingOscRef = useRef<OscillatorNode | null>(null);
  const flyingGainRef = useRef<GainNode | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playBetSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  const playCashOutSound = useCallback(() => {
    const ctx = getAudioContext();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime([523, 659, 784][i], ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.15);
    }
  }, []);

  const playCrashSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const startFlyingSound = useCallback(() => {
    const ctx = getAudioContext();
    if (flyingOscRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    osc.start(ctx.currentTime);
    flyingOscRef.current = osc;
    flyingGainRef.current = gain;
  }, []);

  const stopFlyingSound = useCallback(() => {
    if (flyingOscRef.current && flyingGainRef.current) {
      const ctx = getAudioContext();
      flyingGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      flyingOscRef.current.stop(ctx.currentTime + 0.1);
      flyingOscRef.current = null;
      flyingGainRef.current = null;
    }
  }, []);

  const updateFlyingPitch = useCallback((multiplier: number) => {
    if (flyingOscRef.current) {
      const ctx = getAudioContext();
      const pitch = 80 + (multiplier - 1) * 15;
      flyingOscRef.current.frequency.setValueAtTime(Math.min(pitch, 180), ctx.currentTime);
    }
  }, []);

  const playTakeoffSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  return { playBetSound, playCashOutSound, playCrashSound, startFlyingSound, stopFlyingSound, updateFlyingPitch, playTakeoffSound };
};

const AviatorGame: React.FC<AviatorGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(3000);
  const [betAmount1, setBetAmount1] = useState(10);
  const [betAmount2, setBetAmount2] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [bet1Active, setBet1Active] = useState(false);
  const [bet2Active, setBet2Active] = useState(false);
  const [bet1CashedOut, setBet1CashedOut] = useState(false);
  const [bet2CashedOut, setBet2CashedOut] = useState(false);
  const [history, setHistory] = useState<number[]>([2.94, 2.60, 5.60, 9.49, 1.99, 1.32, 3.21, 1.12, 1.00, 1.35, 1.79, 1.01, 1.11]);
  const [planePosition, setPlanePosition] = useState({ x: 5, y: 85 });
  const [planeRotation, setPlaneRotation] = useState(-25);
  const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stars, setStars] = useState<{x: number, y: number, size: number, speed: number, twinkle: number}[]>([]);
  const [countDown, setCountDown] = useState(5);
  const [winPopup, setWinPopup] = useState<WinPopup>({ amount: 0, mult: 0, visible: false });
  const [autoCashout1, setAutoCashout1] = useState<number | null>(null);
  const [autoCashout2, setAutoCashout2] = useState<number | null>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const { playBetSound, playCashOutSound, playCrashSound, startFlyingSound, stopFlyingSound, updateFlyingPitch, playTakeoffSound } = useSound();

  // Initialize stars with twinkle
  useEffect(() => {
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      twinkle: Math.random() * Math.PI * 2
    }));
    setStars(newStars);
  }, []);

  // Animate stars with twinkle
  useEffect(() => {
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      setStars(prev => prev.map(star => ({
        ...star,
        x: star.x - star.speed,
        twinkle: star.twinkle + 0.1,
        ...(star.x < -2 ? { x: 102, y: Math.random() * 100 } : {})
      })));
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Particle system
  useEffect(() => {
    if (gamePhase !== 'flying') {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles(prev => {
        const colors = ['#ff6b35', '#ffd700', '#ff4444', '#ffaa00', '#ffffff'];
        const newParticles: Particle[] = Array.from({ length: 4 }, () => ({
          x: planePosition.x - 2,
          y: planePosition.y + (Math.random() - 0.5) * 3,
          vx: -Math.random() * 3 - 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          maxLife: 1,
          size: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)]
        }));
        
        const updated = [...prev, ...newParticles]
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.25,
            y: p.y + p.vy * 0.25,
            life: p.life - 0.04,
            size: p.size * 0.97
          }))
          .filter(p => p.life > 0);
        
        return updated.slice(-80);
      });
    }, 40);

    return () => clearInterval(interval);
  }, [gamePhase, planePosition]);

  // Countdown timer with animation
  useEffect(() => {
    if (gamePhase === 'waiting') {
      setCountDown(5);
      const interval = setInterval(() => {
        setCountDown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  // Auto cashout check
  useEffect(() => {
    if (gamePhase === 'flying') {
      if (autoCashout1 && bet1Active && !bet1CashedOut && multiplier >= autoCashout1) {
        cashOut(1);
      }
      if (autoCashout2 && bet2Active && !bet2CashedOut && multiplier >= autoCashout2) {
        cashOut(2);
      }
    }
  }, [multiplier, gamePhase, autoCashout1, autoCashout2, bet1Active, bet2Active, bet1CashedOut, bet2CashedOut]);

  // Game loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gamePhase === 'waiting') {
      const timeout = setTimeout(() => {
        setGamePhase('flying');
        setMultiplier(1.00);
        setPathPoints([{ x: 5, y: 85 }]);
        setPlanePosition({ x: 5, y: 85 });
        setShowExplosion(false);
        if (soundEnabled) {
          playTakeoffSound();
          startFlyingSound();
        }
      }, 5500);
      return () => clearTimeout(timeout);
    }
    
    if (gamePhase === 'flying') {
      interval = setInterval(() => {
        setMultiplier(prev => {
          const increment = Math.random() * 0.04 + 0.02;
          const newMultiplier = prev + increment;
          
          if (soundEnabled) {
            updateFlyingPitch(newMultiplier);
          }
          
          const crashChance = (newMultiplier - 1) * 0.012;
          if (Math.random() < crashChance || newMultiplier > 20) {
            setGamePhase('crashed');
            setShowExplosion(true);
            if (soundEnabled) {
              stopFlyingSound();
              playCrashSound();
            }
            setHistory(h => [parseFloat(newMultiplier.toFixed(2)), ...h.slice(0, 12)]);
            
            setTimeout(() => {
              setBet1Active(false);
              setBet2Active(false);
              setBet1CashedOut(false);
              setBet2CashedOut(false);
              setGamePhase('waiting');
              setShowExplosion(false);
            }, 3000);
            
            return newMultiplier;
          }
          
          const progress = Math.min((newMultiplier - 1) / 10, 1);
          const curve = Math.pow(progress, 0.6);
          const newX = 5 + curve * 80;
          const newY = 85 - curve * 72 - Math.sin(progress * Math.PI * 0.7) * 8;
          
          setPlanePosition({ x: newX, y: newY });
          setPlaneRotation(-30 + curve * 20);
          
          setPathPoints(prev => [...prev, { x: newX, y: newY }]);
          
          return newMultiplier;
        });
      }, 70);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gamePhase, soundEnabled, playTakeoffSound, startFlyingSound, updateFlyingPitch, stopFlyingSound, playCrashSound]);

  // Canvas rendering with glow effects
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
    
    // Gradient fill
    ctx.beginPath();
    ctx.moveTo((pathPoints[0].x / 100) * w, h);
    
    pathPoints.forEach((point) => {
      ctx.lineTo((point.x / 100) * w, (point.y / 100) * h);
    });
    
    const lastPoint = pathPoints[pathPoints.length - 1];
    ctx.lineTo((lastPoint.x / 100) * w, h);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(255, 107, 53, 0.5)');
    gradient.addColorStop(0.3, 'rgba(255, 107, 53, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Outer glow
    ctx.beginPath();
    ctx.moveTo((pathPoints[0].x / 100) * w, (pathPoints[0].y / 100) * h);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo((pathPoints[i].x / 100) * w, (pathPoints[i].y / 100) * h);
    }
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.6)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Main line
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Core bright line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [pathPoints]);

  const placeBet = (betNum: 1 | 2) => {
    if (gamePhase !== 'waiting') return;
    const amount = betNum === 1 ? betAmount1 : betAmount2;
    if (balance < amount) return;
    
    if (soundEnabled) playBetSound();
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
    
    if (soundEnabled) playCashOutSound();
    const winnings = amount * multiplier;
    setBalance(prev => prev + winnings);
    
    // Show win popup
    setWinPopup({ amount: winnings, mult: multiplier, visible: true });
    setTimeout(() => setWinPopup(prev => ({ ...prev, visible: false })), 2000);
    
    if (betNum === 1) setBet1CashedOut(true);
    else setBet2CashedOut(true);
  };

  const getMultiplierColor = (mult: number) => {
    if (mult >= 10) return 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-black font-black';
    if (mult >= 5) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (mult >= 2) return 'bg-gradient-to-r from-cyan-500 to-blue-500';
    return 'bg-slate-600/80';
  };

  const getMultiplierSize = () => {
    const scale = Math.min(1 + (multiplier - 1) * 0.015, 1.3);
    return { transform: `scale(${scale})` };
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a20] via-[#050515] to-[#020208] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(100,50,150,0.15)_0%,_transparent_60%)] pointer-events-none" />
      
      {/* Win Popup */}
      {winPopup.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <div className="bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 text-white px-8 py-6 rounded-2xl shadow-2xl border-2 border-green-300/50"
                 style={{ boxShadow: '0 0 60px rgba(34, 197, 94, 0.5)' }}>
              <div className="flex items-center gap-3 justify-center mb-2">
                <Trophy className="w-8 h-8 text-yellow-300" />
                <span className="text-3xl font-black">YOU WON!</span>
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <div className="text-4xl font-black text-center">${winPopup.amount.toFixed(2)}</div>
              <div className="text-lg text-center text-green-100">at {winPopup.mult.toFixed(2)}x</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between p-3 bg-gradient-to-r from-[#1a1a3a]/90 to-[#0d1025]/90 backdrop-blur-sm border-b border-white/5 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg"
                   style={{ boxShadow: '0 0 20px rgba(255, 107, 53, 0.4)' }}>
                <Plane className="w-6 h-6 text-white -rotate-45" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="text-xl font-black tracking-wider bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                AVIATOR
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Users className="w-3 h-3" /> 3,847 playing
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl transition-all ${soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all">
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-4 py-2 rounded-xl">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xl font-black text-yellow-400">${balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* History Bar */}
      <div className="relative flex items-center gap-2 px-3 py-2.5 overflow-x-auto bg-black/30 backdrop-blur-sm z-10 scrollbar-hide">
        <div className="flex items-center gap-1.5 text-gray-400 text-sm mr-2 flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">History</span>
        </div>
        {history.map((mult, i) => (
          <div
            key={i}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold ${getMultiplierColor(mult)} shadow-lg transition-all hover:scale-105`}
          >
            {mult.toFixed(2)}x
          </div>
        ))}
        <button className="flex-shrink-0 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all ml-auto">
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Game Area */}
      <div className="relative h-[40vh] mx-2 my-2 rounded-2xl overflow-hidden border border-white/5 z-10"
           style={{ background: 'linear-gradient(180deg, rgba(10, 10, 30, 0.9) 0%, rgba(5, 5, 20, 0.95) 100%)' }}>
        
        {/* Animated Stars */}
        <div className="absolute inset-0 overflow-hidden">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: 'white',
                opacity: 0.3 + Math.sin(star.twinkle) * 0.3,
                boxShadow: star.size > 1.5 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.5)` : 'none'
              }}
            />
          ))}
        </div>
        
        {/* Grid */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 8.33}%`} y1="0" x2={`${i * 8.33}%`} y2="100%" stroke="white" strokeWidth="1" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 14.28}%`} x2="100%" y2={`${i * 14.28}%`} stroke="white" strokeWidth="1" />
            ))}
          </svg>
        </div>
        
        {/* Canvas for curve */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life * 0.8,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Explosion effect */}
        {showExplosion && (
          <div 
            className="absolute pointer-events-none animate-ping"
            style={{
              left: `${planePosition.x}%`,
              top: `${planePosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-60" 
                 style={{ boxShadow: '0 0 60px rgba(255, 100, 50, 0.8)' }} />
          </div>
        )}

        {/* Multiplier Display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {gamePhase === 'waiting' ? (
            <div className="text-center">
              <div className="relative mb-4">
                <div className="text-8xl font-black text-white/10">{countDown > 0 ? countDown : '•'}</div>
                {countDown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-orange-500/50 rounded-full animate-ping" />
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-300 animate-pulse tracking-widest">
                WAITING FOR TAKEOFF
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Target className="w-5 h-5 text-orange-400" />
                <span className="text-gray-400">Place your bets now!</span>
              </div>
            </div>
          ) : gamePhase === 'crashed' ? (
            <div className="text-center">
              <div className="text-5xl sm:text-7xl font-black text-red-500 animate-pulse mb-2" 
                   style={{ textShadow: '0 0 60px rgba(239, 68, 68, 0.6)' }}>
                FLEW AWAY!
              </div>
              <div className="text-4xl font-bold text-white/80">{multiplier.toFixed(2)}x</div>
            </div>
          ) : (
            <div className="text-center transition-transform duration-100" style={getMultiplierSize()}>
              <div 
                className="text-7xl sm:text-9xl font-black"
                style={{ 
                  background: multiplier >= 5 
                    ? 'linear-gradient(180deg, #ffd700 0%, #ff6b35 50%, #ff4444 100%)'
                    : multiplier >= 2
                    ? 'linear-gradient(180deg, #fff 0%, #ffd700 100%)'
                    : 'linear-gradient(180deg, #fff 0%, #ccc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: multiplier >= 2 ? '0 0 80px rgba(255, 215, 0, 0.5)' : 'none',
                  filter: multiplier >= 5 ? 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.5))' : 'none'
                }}
              >
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}
        </div>

        {/* Plane */}
        {gamePhase === 'flying' && (
          <div 
            className="absolute transition-all duration-75 ease-out z-20"
            style={{ 
              left: `${planePosition.x}%`, 
              top: `${planePosition.y}%`,
              transform: `translate(-50%, -50%) rotate(${planeRotation}deg)`
            }}
          >
            {/* Glow layers */}
            <div className="absolute inset-0 -m-6 bg-orange-500/20 rounded-full blur-2xl" />
            <div className="absolute inset-0 -m-3 bg-yellow-500/30 rounded-full blur-xl" />
            
            {/* Plane body */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-2xl"
                   style={{ boxShadow: '0 0 40px rgba(255, 107, 53, 0.7), 0 0 80px rgba(255, 107, 53, 0.4), inset 0 -2px 10px rgba(0,0,0,0.3)' }}>
                <Plane className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              {/* Engine glow */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-gradient-to-r from-yellow-400 to-transparent rounded-full blur-sm" />
            </div>
          </div>
        )}

        {/* Y-axis markers */}
        <div className="absolute left-3 top-4 bottom-4 flex flex-col justify-between">
          {[10, 8, 6, 4, 2, 1].map((n) => (
            <div key={n} className="text-xs text-gray-500 font-medium">{n}x</div>
          ))}
        </div>
      </div>

      {/* Betting Panels */}
      <div className="relative grid grid-cols-2 gap-2 p-2 z-10">
        {[1, 2].map((panelNum) => {
          const betAmount = panelNum === 1 ? betAmount1 : betAmount2;
          const setBetAmount = panelNum === 1 ? setBetAmount1 : setBetAmount2;
          const betActive = panelNum === 1 ? bet1Active : bet2Active;
          const betCashedOut = panelNum === 1 ? bet1CashedOut : bet2CashedOut;
          const autoCashout = panelNum === 1 ? autoCashout1 : autoCashout2;
          const setAutoCashout = panelNum === 1 ? setAutoCashout1 : setAutoCashout2;

          return (
            <div key={panelNum} className="bg-gradient-to-b from-[#1a1a3a]/80 to-[#0d1025]/80 backdrop-blur-sm rounded-xl p-3 border border-white/5">
              <div className="flex gap-1 mb-3">
                <button className="flex-1 py-1.5 bg-white/10 rounded-lg text-sm font-bold">Bet</button>
                <button className="flex-1 py-1.5 text-gray-500 text-sm hover:bg-white/5 rounded-lg transition-colors">Auto</button>
              </div>
              
              <div className="flex items-center bg-black/40 rounded-xl px-3 py-2 mb-2 border border-white/5">
                <span className="text-2xl font-black text-white">${betAmount}</span>
                <div className="ml-auto flex gap-1">
                  <button 
                    onClick={() => setBetAmount(Math.max(1, betAmount - 10))}
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setBetAmount(betAmount + 10)}
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-1 mb-2">
                {[10, 50, 100, 500].map(amount => (
                  <button 
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      betAmount === amount 
                        ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' 
                        : 'bg-black/30 text-gray-400 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Auto cashout input */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400">Auto @</span>
                <input
                  type="number"
                  placeholder="2.00"
                  value={autoCashout || ''}
                  onChange={(e) => setAutoCashout(e.target.value ? parseFloat(e.target.value) : null)}
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
                <span className="text-xs text-gray-400">x</span>
              </div>
              
              <button
                onClick={() => {
                  if (betActive && gamePhase === 'flying' && !betCashedOut) {
                    cashOut(panelNum as 1 | 2);
                  } else if (!betActive && gamePhase === 'waiting') {
                    placeBet(panelNum as 1 | 2);
                  }
                }}
                disabled={(gamePhase === 'crashed') || (betActive && betCashedOut)}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-[0.98] ${
                  betActive && gamePhase === 'flying' && !betCashedOut
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black animate-pulse'
                    : betCashedOut
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    : betActive && gamePhase === 'waiting'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                }`}
                style={{ 
                  boxShadow: betActive && gamePhase === 'flying' && !betCashedOut 
                    ? '0 0 30px rgba(255, 165, 0, 0.5)' 
                    : betCashedOut 
                    ? '0 0 20px rgba(34, 197, 94, 0.4)'
                    : '0 0 20px rgba(34, 197, 94, 0.3)' 
                }}
              >
                {betActive && gamePhase === 'flying' && !betCashedOut
                  ? `CASH OUT $${(betAmount * multiplier).toFixed(2)}`
                  : betCashedOut
                  ? `✓ WON $${(betAmount * multiplier).toFixed(2)}`
                  : betActive && gamePhase === 'waiting'
                  ? 'CANCEL BET'
                  : 'PLACE BET'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AviatorGame;
