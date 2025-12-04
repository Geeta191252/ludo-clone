import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, HelpCircle, Minus, Plus, History, Volume2, VolumeX, Plane, TrendingUp, Users, Zap } from 'lucide-react';

interface AviatorGameProps {
  onClose: () => void;
}

// Particle type for trail effect
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

// Sound effects using Web Audio API
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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  const playCrashSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noise = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.type = 'square';
    noise.frequency.setValueAtTime(100, ctx.currentTime);
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.3);
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
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
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
      const pitch = 80 + (multiplier - 1) * 20;
      flyingOscRef.current.frequency.setValueAtTime(Math.min(pitch, 200), ctx.currentTime);
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
  const [stars, setStars] = useState<{x: number, y: number, size: number, speed: number}[]>([]);
  const [countDown, setCountDown] = useState(3);
  const [liveBets, setLiveBets] = useState([
    { user: 'Player***123', bet: 50, mult: null },
    { user: 'Lucky***789', bet: 100, mult: 2.45 },
    { user: 'Win***456', bet: 25, mult: null },
  ]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const { playBetSound, playCashOutSound, playCrashSound, startFlyingSound, stopFlyingSound, updateFlyingPitch, playTakeoffSound } = useSound();

  // Initialize stars
  useEffect(() => {
    const newStars = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1
    }));
    setStars(newStars);
  }, []);

  // Animate stars
  useEffect(() => {
    const animate = () => {
      setStars(prev => prev.map(star => ({
        ...star,
        x: star.x - star.speed,
        ...(star.x < 0 ? { x: 100, y: Math.random() * 100 } : {})
      })));
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Update particles
  useEffect(() => {
    if (gamePhase !== 'flying') {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles(prev => {
        // Add new particles
        const newParticles: Particle[] = Array.from({ length: 3 }, () => ({
          x: planePosition.x,
          y: planePosition.y,
          vx: -Math.random() * 2 - 1,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          maxLife: 1,
          size: Math.random() * 4 + 2,
          color: Math.random() > 0.5 ? '#ff6b35' : '#ffd700'
        }));
        
        // Update existing particles
        const updated = [...prev, ...newParticles]
          .map(p => ({
            ...p,
            x: p.x + p.vx * 0.3,
            y: p.y + p.vy * 0.3,
            life: p.life - 0.05
          }))
          .filter(p => p.life > 0);
        
        return updated.slice(-50);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gamePhase, planePosition]);

  // Countdown timer
  useEffect(() => {
    if (gamePhase === 'waiting') {
      setCountDown(3);
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

  // Game loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gamePhase === 'waiting') {
      const timeout = setTimeout(() => {
        setGamePhase('flying');
        setMultiplier(1.00);
        setPathPoints([{ x: 5, y: 85 }]);
        setPlanePosition({ x: 5, y: 85 });
        if (soundEnabled) {
          playTakeoffSound();
          startFlyingSound();
        }
      }, 3500);
      return () => clearTimeout(timeout);
    }
    
    if (gamePhase === 'flying') {
      interval = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + (Math.random() * 0.05 + 0.02);
          
          if (soundEnabled) {
            updateFlyingPitch(newMultiplier);
          }
          
          const crashChance = (newMultiplier - 1) * 0.015;
          if (Math.random() < crashChance || newMultiplier > 15) {
            setGamePhase('crashed');
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
            }, 2500);
            
            return newMultiplier;
          }
          
          const progress = Math.min((newMultiplier - 1) / 8, 1);
          const curve = Math.pow(progress, 0.7);
          const newX = 5 + curve * 75;
          const newY = 85 - curve * 70 - Math.sin(progress * Math.PI * 0.8) * 10;
          
          setPlanePosition({ x: newX, y: newY });
          setPlaneRotation(-25 + curve * 15);
          
          setPathPoints(prev => [...prev, { x: newX, y: newY }]);
          
          return newMultiplier;
        });
      }, 80);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gamePhase, soundEnabled, playTakeoffSound, startFlyingSound, updateFlyingPitch, stopFlyingSound, playCrashSound]);

  // Draw curve on canvas
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
    ctx.moveTo((pathPoints[0].x / 100) * w, h);
    
    pathPoints.forEach((point) => {
      const x = (point.x / 100) * w;
      const y = (point.y / 100) * h;
      ctx.lineTo(x, y);
    });
    
    const lastPoint = pathPoints[pathPoints.length - 1];
    ctx.lineTo((lastPoint.x / 100) * w, h);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw glowing line
    ctx.beginPath();
    ctx.moveTo((pathPoints[0].x / 100) * w, (pathPoints[0].y / 100) * h);
    
    for (let i = 1; i < pathPoints.length; i++) {
      const point = pathPoints[i];
      ctx.lineTo((point.x / 100) * w, (point.y / 100) * h);
    }
    
    // Glow effect
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Core line
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
    
    if (betNum === 1) setBet1CashedOut(true);
    else setBet2CashedOut(true);
  };

  const getMultiplierColor = (mult: number) => {
    if (mult >= 10) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
    if (mult >= 5) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (mult >= 2) return 'bg-gradient-to-r from-blue-500 to-cyan-400';
    return 'bg-slate-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d1025] to-[#0a0a1a] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1a1a3a] to-[#0d1025] border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="text-lg font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                AVIATOR
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> 2,847 online
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
          </button>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full transition-all">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">How to play?</span>
          </button>
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-4 py-2 rounded-full">
            <span className="text-xl font-bold text-yellow-400">${balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* History Bar */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto bg-black/20 scrollbar-hide">
        <div className="flex items-center gap-1 text-gray-400 text-sm mr-2">
          <TrendingUp className="w-4 h-4" />
          <span>History</span>
        </div>
        {history.map((mult, i) => (
          <div
            key={i}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${getMultiplierColor(mult)} shadow-lg`}
          >
            {mult.toFixed(2)}x
          </div>
        ))}
        <button className="flex-shrink-0 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all ml-auto">
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Game Area */}
      <div className="relative h-[42vh] mx-2 my-2 rounded-2xl overflow-hidden bg-gradient-to-b from-[#0d1530] to-[#0a0a1a] border border-white/5">
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: Math.random() * 0.5 + 0.3,
                boxShadow: star.size > 1.5 ? '0 0 4px rgba(255,255,255,0.5)' : 'none'
              }}
            />
          ))}
        </div>
        
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="white" strokeWidth="1" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 20}%`} x2="100%" y2={`${i * 20}%`} stroke="white" strokeWidth="1" />
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
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Multiplier Display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {gamePhase === 'waiting' ? (
            <div className="text-center">
              <div className="text-7xl font-black text-white/20 mb-2">{countDown > 0 ? countDown : '...'}</div>
              <div className="text-xl font-bold text-gray-400 animate-pulse">
                WAITING FOR TAKEOFF
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-sm text-gray-500">Place your bets now!</span>
              </div>
            </div>
          ) : gamePhase === 'crashed' ? (
            <div className="text-center animate-scale-in">
              <div className="text-5xl sm:text-7xl font-black text-red-500 mb-2" 
                   style={{ textShadow: '0 0 40px rgba(239, 68, 68, 0.5)' }}>
                FLEW AWAY!
              </div>
              <div className="text-4xl font-bold text-white/80">{multiplier.toFixed(2)}x</div>
            </div>
          ) : (
            <div 
              className="text-center"
              style={{ transform: `scale(${1 + (multiplier - 1) * 0.02})` }}
            >
              <div 
                className="text-7xl sm:text-9xl font-black"
                style={{ 
                  background: `linear-gradient(180deg, #fff ${100 - multiplier * 10}%, #ffd700 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 60px rgba(255, 215, 0, 0.4)'
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
            className="absolute transition-all duration-75 ease-out"
            style={{ 
              left: `${planePosition.x}%`, 
              top: `${planePosition.y}%`,
              transform: `translate(-50%, -50%) rotate(${planeRotation}deg)`
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 -m-4 bg-orange-500/30 rounded-full blur-xl" />
            {/* Plane body */}
            <div className="relative bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-full p-3 shadow-lg"
                 style={{ boxShadow: '0 0 30px rgba(255, 107, 53, 0.6), 0 0 60px rgba(255, 107, 53, 0.3)' }}>
              <Plane className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Crashed plane */}
        {gamePhase === 'crashed' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-bounce opacity-50">
              <Plane className="w-16 h-16 text-red-500 rotate-180" />
            </div>
          </div>
        )}

        {/* Y-axis markers */}
        <div className="absolute left-3 top-4 bottom-4 flex flex-col justify-between">
          {[10, 8, 6, 4, 2, 0].map((n) => (
            <div key={n} className="text-xs text-gray-500">{n}x</div>
          ))}
        </div>
      </div>

      {/* Live Bets Ticker */}
      <div className="mx-2 mb-2 px-3 py-2 bg-black/30 rounded-xl border border-white/5">
        <div className="flex items-center gap-4 overflow-x-auto text-xs">
          <span className="text-gray-400 flex-shrink-0">Live Bets:</span>
          {liveBets.map((bet, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-gray-400">{bet.user}</span>
              <span className="text-white font-bold">${bet.bet}</span>
              {bet.mult && <span className="text-green-400">→ {bet.mult}x</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Betting Panels */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {/* Bet Panel 1 */}
        <div className="bg-gradient-to-b from-[#1a1a3a] to-[#0d1025] rounded-xl p-3 border border-white/5">
          <div className="flex gap-1 mb-3">
            <button className="flex-1 py-1.5 bg-white/10 rounded-lg text-sm font-bold">Bet</button>
            <button className="flex-1 py-1.5 text-gray-500 text-sm hover:bg-white/5 rounded-lg transition-colors">Auto</button>
          </div>
          
          <div className="flex items-center bg-black/30 rounded-xl px-3 py-2 mb-2 border border-white/5">
            <span className="text-2xl font-bold text-white">${betAmount1.toFixed(0)}</span>
            <div className="ml-auto flex gap-1">
              <button 
                onClick={() => setBetAmount1(Math.max(1, betAmount1 - 10))}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setBetAmount1(betAmount1 + 10)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[10, 50, 100, 500].map(amount => (
              <button 
                key={amount}
                onClick={() => setBetAmount1(amount)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                  betAmount1 === amount 
                    ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' 
                    : 'bg-black/30 text-gray-400 hover:bg-white/10'
                }`}
              >
                ${amount}
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
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
              bet1Active && gamePhase === 'flying' && !bet1CashedOut
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black shadow-orange-500/30'
                : bet1CashedOut
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30'
            }`}
          >
            {bet1Active && gamePhase === 'flying' && !bet1CashedOut
              ? `CASH OUT $${(betAmount1 * multiplier).toFixed(2)}`
              : bet1CashedOut
              ? '✓ CASHED OUT'
              : 'PLACE BET'}
          </button>
        </div>

        {/* Bet Panel 2 */}
        <div className="bg-gradient-to-b from-[#1a1a3a] to-[#0d1025] rounded-xl p-3 border border-white/5">
          <div className="flex gap-1 mb-3">
            <button className="flex-1 py-1.5 bg-white/10 rounded-lg text-sm font-bold">Bet</button>
            <button className="flex-1 py-1.5 text-gray-500 text-sm hover:bg-white/5 rounded-lg transition-colors">Auto</button>
          </div>
          
          <div className="flex items-center bg-black/30 rounded-xl px-3 py-2 mb-2 border border-white/5">
            <span className="text-2xl font-bold text-white">${betAmount2.toFixed(0)}</span>
            <div className="ml-auto flex gap-1">
              <button 
                onClick={() => setBetAmount2(Math.max(1, betAmount2 - 10))}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setBetAmount2(betAmount2 + 10)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-3">
            {[10, 50, 100, 500].map(amount => (
              <button 
                key={amount}
                onClick={() => setBetAmount2(amount)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                  betAmount2 === amount 
                    ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' 
                    : 'bg-black/30 text-gray-400 hover:bg-white/10'
                }`}
              >
                ${amount}
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
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
              bet2Active && gamePhase === 'flying' && !bet2CashedOut
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black shadow-orange-500/30'
                : bet2CashedOut
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30'
            }`}
          >
            {bet2Active && gamePhase === 'flying' && !bet2CashedOut
              ? `CASH OUT $${(betAmount2 * multiplier).toFixed(2)}`
              : bet2CashedOut
              ? '✓ CASHED OUT'
              : 'PLACE BET'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AviatorGame;
