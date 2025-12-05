import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { ChevronLeft, TrendingUp, User } from 'lucide-react';
import * as THREE from 'three';

interface DragonTigerGameProps {
  onClose: () => void;
}

interface BetHistory {
  id: number;
  winner: 'dragon' | 'tiger' | 'tie';
}

interface PlacedChip {
  id: number;
  value: number;
  x: number;
  y: number;
}

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CHIP_VALUES = [1, 10, 20, 50, 100, 500];

// 3D Chip Component
const Chip3D: React.FC<{ 
  position: [number, number, number]; 
  value: number;
  scale?: number;
}> = ({ position, value, scale = 1 }) => {
  const getColor = () => {
    switch(value) {
      case 1: return '#6b7280';
      case 10: return '#22c55e';
      case 20: return '#3b82f6';
      case 50: return '#ec4899';
      case 100: return '#eab308';
      case 500: return '#f97316';
      default: return '#6b7280';
    }
  };

  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 32]} />
        <meshStandardMaterial color={getColor()} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
};

// 3D Playing Card
const Card3D: React.FC<{ 
  position: [number, number, number]; 
  value?: string; 
  suit?: string;
  isRevealed: boolean;
  color: string;
  isWinner?: boolean;
}> = ({ position, value, suit, isRevealed, color, isWinner }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [rotY, setRotY] = useState(Math.PI);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isRevealed && rotY > 0) {
        setRotY(prev => Math.max(0, prev - 0.12));
      }
      if (isWinner) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.08;
      }
    }
  });

  return (
    <group ref={meshRef} position={position} rotation={[0, rotY, 0]}>
      <RoundedBox args={[0.5, 0.7, 0.02]} radius={0.03}>
        <meshStandardMaterial color="#ffffff" />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.7, 0.02]} radius={0.03} position={[0, 0, -0.01]}>
        <meshStandardMaterial color={color} />
      </RoundedBox>
      {isRevealed && (
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshBasicMaterial color={suit === '♥' || suit === '♦' ? '#dc2626' : '#000000'} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
};

// 3D Dragon
const Dragon3D: React.FC<{ position: [number, number, number]; isWinner: boolean }> = ({ position, isWinner }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      if (isWinner) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15;
        groupRef.current.scale.setScalar(scale);
      } else {
        groupRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0.25, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Snout */}
      <mesh position={[0.4, 0.15, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.3, 0.32, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.3, 0.32, -0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
      </mesh>
      {/* Wings */}
      <mesh position={[-0.15, 0.25, 0.35]} rotation={[0.6, 0.3, 0.5]}>
        <planeGeometry args={[0.4, 0.35]} />
        <meshStandardMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.15, 0.25, -0.35]} rotation={[-0.6, -0.3, 0.5]}>
        <planeGeometry args={[0.4, 0.35]} />
        <meshStandardMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.4, 0, 0]} rotation={[0, 0, 0.6]}>
        <coneGeometry args={[0.1, 0.4, 8]} />
        <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Glow */}
      {isWinner && <pointLight color="#3b82f6" intensity={3} distance={2} />}
    </group>
  );
};

// 3D Tiger
const Tiger3D: React.FC<{ position: [number, number, number]; isWinner: boolean }> = ({ position, isWinner }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3 + Math.PI;
      if (isWinner) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15;
        groupRef.current.scale.setScalar(scale);
      } else {
        groupRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Head */}
      <mesh position={[0.35, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ea580c" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.38, 0.28, 0.1]}>
        <coneGeometry args={[0.05, 0.1, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0.38, 0.28, -0.1]}>
        <coneGeometry args={[0.05, 0.1, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.48, 0.15, 0.08]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.48, 0.15, -0.08]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
      </mesh>
      {/* Nose */}
      <mesh position={[0.52, 0.06, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Stripes */}
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.21, 0]} rotation={[Math.PI / 2, 0, 0.3 * (i - 1)]}>
          <boxGeometry args={[0.06, 0.4, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Tail */}
      <mesh position={[-0.4, 0.1, 0]} rotation={[0, 0, 0.8]}>
        <capsuleGeometry args={[0.03, 0.3, 4, 8]} />
        <meshStandardMaterial color="#ea580c" />
      </mesh>
      {/* Glow */}
      {isWinner && <pointLight color="#f97316" intensity={3} distance={2} />}
    </group>
  );
};

// 3D Table
const BettingTable3D: React.FC<{ 
  winner: 'dragon' | 'tiger' | 'tie' | null;
  showResult: boolean;
  dragonBets: PlacedChip[];
  tigerBets: PlacedChip[];
  tieBets: PlacedChip[];
}> = ({ winner, showResult, dragonBets, tigerBets, tieBets }) => {
  return (
    <group position={[0, -0.3, 0.5]}>
      {/* Table Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial color="#0d3320" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[5.2, 0.1, 3.2]} />
        <meshStandardMaterial color="#5a3d2b" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Dragon Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.7, 0.01, 0]}>
        <planeGeometry args={[1.4, 2]} />
        <meshStandardMaterial 
          color={winner === 'dragon' && showResult ? '#22c55e' : '#1e3a8a'} 
          emissive={winner === 'dragon' && showResult ? '#22c55e' : '#000'}
          emissiveIntensity={winner === 'dragon' && showResult ? 0.4 : 0}
        />
      </mesh>
      {dragonBets.slice(0, 5).map((chip, idx) => (
        <Chip3D key={chip.id} position={[-1.7 + (idx % 3) * 0.2 - 0.2, 0.05 + Math.floor(idx / 3) * 0.04, (idx % 2) * 0.2 - 0.1]} value={chip.value} />
      ))}

      {/* Tie Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.4, 2]} />
        <meshStandardMaterial 
          color={winner === 'tie' && showResult ? '#22c55e' : '#166534'} 
          emissive={winner === 'tie' && showResult ? '#22c55e' : '#000'}
          emissiveIntensity={winner === 'tie' && showResult ? 0.4 : 0}
        />
      </mesh>
      {tieBets.slice(0, 5).map((chip, idx) => (
        <Chip3D key={chip.id} position={[(idx % 3) * 0.2 - 0.2, 0.05 + Math.floor(idx / 3) * 0.04, (idx % 2) * 0.2 - 0.1]} value={chip.value} />
      ))}

      {/* Tiger Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.7, 0.01, 0]}>
        <planeGeometry args={[1.4, 2]} />
        <meshStandardMaterial 
          color={winner === 'tiger' && showResult ? '#22c55e' : '#9a3412'} 
          emissive={winner === 'tiger' && showResult ? '#22c55e' : '#000'}
          emissiveIntensity={winner === 'tiger' && showResult ? 0.4 : 0}
        />
      </mesh>
      {tigerBets.slice(0, 5).map((chip, idx) => (
        <Chip3D key={chip.id} position={[1.7 + (idx % 3) * 0.2 - 0.2, 0.05 + Math.floor(idx / 3) * 0.04, (idx % 2) * 0.2 - 0.1]} value={chip.value} />
      ))}
    </group>
  );
};

// Game Scene
const GameScene: React.FC<{
  dragonCard: { value: string; suit: string; numValue: number } | null;
  tigerCard: { value: string; suit: string; numValue: number } | null;
  winner: 'dragon' | 'tiger' | 'tie' | null;
  showResult: boolean;
  dragonBets: PlacedChip[];
  tigerBets: PlacedChip[];
  tieBets: PlacedChip[];
}> = ({ dragonCard, tigerCard, winner, showResult, dragonBets, tigerBets, tieBets }) => {
  return (
    <>
      <color attach="background" args={['#0d1a2d']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 3, 2]} intensity={0.6} color="#60a5fa" />
      <pointLight position={[3, 3, 2]} intensity={0.6} color="#f97316" />
      
      <Dragon3D position={[-1.8, 0.3, -0.8]} isWinner={winner === 'dragon' && showResult} />
      <Tiger3D position={[1.8, 0.3, -0.8]} isWinner={winner === 'tiger' && showResult} />
      
      <Card3D 
        position={[-0.5, 0.5, -0.5]} 
        value={dragonCard?.value} 
        suit={dragonCard?.suit}
        isRevealed={!!dragonCard}
        color="#1e40af"
        isWinner={winner === 'dragon' && showResult}
      />
      
      <Card3D 
        position={[0.5, 0.5, -0.5]} 
        value={tigerCard?.value} 
        suit={tigerCard?.suit}
        isRevealed={!!tigerCard}
        color="#c2410c"
        isWinner={winner === 'tiger' && showResult}
      />
      
      <BettingTable3D
        winner={winner}
        showResult={showResult}
        dragonBets={dragonBets}
        tigerBets={tigerBets}
        tieBets={tieBets}
      />

      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 8}
        maxAzimuthAngle={Math.PI / 8}
      />
    </>
  );
};

// Chip UI Component
const ChipIcon: React.FC<{ value: number; selected?: boolean; onClick?: () => void }> = ({ value, selected, onClick }) => {
  const getColors = () => {
    switch(value) {
      case 1: return { bg: 'from-gray-500 to-gray-700', ring: 'ring-gray-400' };
      case 10: return { bg: 'from-green-500 to-green-700', ring: 'ring-green-400' };
      case 20: return { bg: 'from-blue-500 to-blue-700', ring: 'ring-blue-400' };
      case 50: return { bg: 'from-pink-500 to-pink-700', ring: 'ring-pink-400' };
      case 100: return { bg: 'from-yellow-400 to-yellow-600', ring: 'ring-yellow-300' };
      case 500: return { bg: 'from-orange-500 to-orange-700', ring: 'ring-orange-400' };
      default: return { bg: 'from-gray-500 to-gray-700', ring: 'ring-gray-400' };
    }
  };

  const colors = getColors();

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full bg-gradient-to-b ${colors.bg} flex flex-col items-center justify-center
        border-4 border-white/30 shadow-lg transition-all
        ${selected ? `ring-4 ${colors.ring} scale-110` : 'hover:scale-105'}`}
    >
      <span className="text-white font-bold text-sm">{value}</span>
      <span className="text-white/70 text-[8px]">CHIP</span>
    </button>
  );
};

const DragonTigerGame: React.FC<DragonTigerGameProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(10000);
  const [selectedChip, setSelectedChip] = useState(10);
  const [dragonBets, setDragonBets] = useState<PlacedChip[]>([]);
  const [tigerBets, setTigerBets] = useState<PlacedChip[]>([]);
  const [tieBets, setTieBets] = useState<PlacedChip[]>([]);
  const [dragonCard, setDragonCard] = useState<{ value: string; suit: string; numValue: number } | null>(null);
  const [tigerCard, setTigerCard] = useState<{ value: string; suit: string; numValue: number } | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<BetHistory[]>([
    { id: 1, winner: 'tiger' }, { id: 2, winner: 'dragon' }, { id: 3, winner: 'dragon' },
    { id: 4, winner: 'tiger' }, { id: 5, winner: 'dragon' }, { id: 6, winner: 'tiger' },
    { id: 7, winner: 'tie' }, { id: 8, winner: 'tie' }, { id: 9, winner: 'tie' },
    { id: 10, winner: 'tiger' }, { id: 11, winner: 'tiger' }, { id: 12, winner: 'dragon' },
  ]);
  const [timer, setTimer] = useState(15);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'result'>('betting');

  const dragonTotal = dragonBets.reduce((sum, chip) => sum + chip.value, 0);
  const tigerTotal = tigerBets.reduce((sum, chip) => sum + chip.value, 0);
  const tieTotal = tieBets.reduce((sum, chip) => sum + chip.value, 0);

  useEffect(() => {
    if (gamePhase === 'betting' && timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && gamePhase === 'betting') {
      handleDeal();
    }
  }, [timer, gamePhase]);

  const placeBet = (area: 'dragon' | 'tiger' | 'tie') => {
    if (gamePhase !== 'betting' || balance < selectedChip) return;

    const newChip: PlacedChip = {
      id: Date.now() + Math.random(),
      value: selectedChip,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
    };

    setBalance(prev => prev - selectedChip);
    if (area === 'dragon') setDragonBets(prev => [...prev, newChip]);
    else if (area === 'tiger') setTigerBets(prev => [...prev, newChip]);
    else setTieBets(prev => [...prev, newChip]);
  };

  const handleDeal = () => {
    if (gamePhase !== 'betting') return;
    setGamePhase('dealing');
    setShowResult(false);
    setWinner(null);

    // Winner logic: Area with LEAST bets wins
    let gameWinner: 'dragon' | 'tiger' | 'tie';
    
    if (dragonTotal === 0 && tigerTotal === 0 && tieTotal === 0) {
      const allAreas: ('dragon' | 'tiger' | 'tie')[] = ['dragon', 'tiger', 'tie'];
      gameWinner = allAreas[Math.floor(Math.random() * 3)];
    } else {
      const bets = [
        { area: 'dragon' as const, amount: dragonTotal },
        { area: 'tiger' as const, amount: tigerTotal },
        { area: 'tie' as const, amount: tieTotal }
      ];
      bets.sort((a, b) => a.amount - b.amount);
      const lowestAmount = bets[0].amount;
      const lowestBets = bets.filter(b => b.amount === lowestAmount);
      gameWinner = lowestBets[Math.floor(Math.random() * lowestBets.length)].area;
    }

    const generateMatchingCards = () => {
      let dragonCardValue: number, tigerCardValue: number;
      
      if (gameWinner === 'dragon') {
        dragonCardValue = 7 + Math.floor(Math.random() * 6);
        tigerCardValue = Math.floor(Math.random() * dragonCardValue);
      } else if (gameWinner === 'tiger') {
        tigerCardValue = 7 + Math.floor(Math.random() * 6);
        dragonCardValue = Math.floor(Math.random() * tigerCardValue);
      } else {
        dragonCardValue = Math.floor(Math.random() * 13);
        tigerCardValue = dragonCardValue;
      }
      
      return {
        dragon: { value: CARD_VALUES[dragonCardValue], suit: CARD_SUITS[Math.floor(Math.random() * 4)], numValue: dragonCardValue + 1 },
        tiger: { value: CARD_VALUES[tigerCardValue], suit: CARD_SUITS[Math.floor(Math.random() * 4)], numValue: tigerCardValue + 1 }
      };
    };

    const cards = generateMatchingCards();

    setTimeout(() => {
      setDragonCard(cards.dragon);
      setTimeout(() => {
        setTigerCard(cards.tiger);
        setTimeout(() => {
          setWinner(gameWinner);
          setShowResult(true);
          setGamePhase('result');

          let winnings = 0;
          if (gameWinner === 'dragon') winnings = dragonTotal * 2;
          else if (gameWinner === 'tiger') winnings = tigerTotal * 2;
          else winnings = tieTotal * 8;
          
          if (winnings > 0) setBalance(prev => prev + winnings);
          setHistory(prev => [{ id: Date.now(), winner: gameWinner }, ...prev.slice(0, 19)]);

          setTimeout(() => {
            setDragonCard(null);
            setTigerCard(null);
            setDragonBets([]);
            setTigerBets([]);
            setTieBets([]);
            setShowResult(false);
            setWinner(null);
            setTimer(15);
            setGamePhase('betting');
          }, 4000);
        }, 500);
      }, 800);
    }, 500);
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-gradient-to-b from-[#0d1a2d] via-[#162236] to-[#0d1a2d]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">Dragon Tiger 3D</div>
          <div className="text-sm text-gray-300">Balance: ₹{balance.toLocaleString()}</div>
        </div>
        <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
          <span className="text-lg">₹</span> Add Cash
        </button>
      </div>

      {/* History Bar */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {history.map((h, i) => (
            <div
              key={h.id + '-' + i}
              className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] ${
                h.winner === 'tiger' ? 'bg-amber-600' : h.winner === 'dragon' ? 'bg-blue-600' : 'bg-green-500'
              }`}
            >
              {h.winner === 'tiger' ? 'T' : h.winner === 'dragon' ? 'D' : 'Tie'}
            </div>
          ))}
          <button className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[55vh] w-full pt-28">
        <Canvas shadows camera={{ position: [0, 3, 4], fov: 50 }}>
          <GameScene
            dragonCard={dragonCard}
            tigerCard={tigerCard}
            winner={winner}
            showResult={showResult}
            dragonBets={dragonBets}
            tigerBets={tigerBets}
            tieBets={tieBets}
          />
        </Canvas>
      </div>

      {/* Timer */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 z-10">
        <div className={`px-6 py-2 rounded-full text-lg font-bold ${
          gamePhase === 'betting' ? (timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600') : 'bg-yellow-600'
        }`}>
          {gamePhase === 'betting' ? `Bet: ${timer}s` : gamePhase === 'dealing' ? 'Dealing...' : 'Result'}
        </div>
      </div>

      {/* Bet Areas - Clickable */}
      <div className="absolute left-4 right-4 z-10" style={{ top: '58vh' }}>
        <div className="flex justify-between gap-2">
          <button 
            onClick={() => placeBet('dragon')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              gamePhase === 'betting' ? 'bg-blue-600 hover:bg-blue-500 active:scale-95' : 'bg-blue-600/50'
            }`}
          >
            Dragon: ₹{dragonTotal}
          </button>
          <button 
            onClick={() => placeBet('tie')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              gamePhase === 'betting' ? 'bg-green-600 hover:bg-green-500 active:scale-95' : 'bg-green-600/50'
            }`}
          >
            Tie: ₹{tieTotal}
          </button>
          <button 
            onClick={() => placeBet('tiger')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              gamePhase === 'betting' ? 'bg-orange-600 hover:bg-orange-500 active:scale-95' : 'bg-orange-600/50'
            }`}
          >
            Tiger: ₹{tigerTotal}
          </button>
        </div>
      </div>

      {/* Chip Selection */}
      <div className="absolute bottom-20 left-0 right-0 z-20">
        <div className="flex items-center justify-center gap-2 px-4">
          {CHIP_VALUES.map((value) => (
            <ChipIcon key={value} value={value} selected={selectedChip === value} onClick={() => setSelectedChip(value)} />
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent pt-6 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center border-2 border-yellow-400">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Player</div>
              <div className="text-yellow-400 font-bold">₹{balance.toLocaleString()}</div>
            </div>
          </div>

          <button 
            onClick={() => gamePhase === 'betting' && handleDeal()}
            className="bg-gradient-to-b from-amber-500 to-amber-700 px-8 py-3 rounded-lg font-bold shadow-lg border-2 border-amber-400 disabled:opacity-50"
            disabled={gamePhase !== 'betting'}
          >
            DEAL NOW
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border-2 border-gray-500">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Win Popup */}
      {showResult && ((winner === 'dragon' && dragonTotal > 0) || (winner === 'tiger' && tigerTotal > 0) || (winner === 'tie' && tieTotal > 0)) && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 px-8 py-4 rounded-2xl shadow-2xl animate-bounce border-4 border-yellow-300">
            <div className="text-black font-black text-2xl text-center">
              🎉 YOU WON! 🎉
              <div className="text-xl">
                +₹{winner === 'dragon' ? dragonTotal * 2 : winner === 'tiger' ? tigerTotal * 2 : tieTotal * 8}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragonTigerGame;
