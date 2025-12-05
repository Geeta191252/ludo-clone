import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, PerspectiveCamera, RoundedBox, Environment } from '@react-three/drei';
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
  playerName?: string;
}

const PLAYER_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Neha', 'Vijay', 'Pooja', 'Raj', 'Simran',
  'Arjun', 'Anita', 'Deepak', 'Kavita', 'Suresh', 'Meena', 'Rohit', 'Sunita',
  'Lucky7', 'Winner99', 'GoldKing', 'RichBoy', 'ProPlayer', 'BetMaster'
];

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS = ['♠', '♥', '♦', '♣'];

const getCardNumValue = (value: string): number => {
  return CARD_VALUES.indexOf(value) + 1;
};

const CHIP_VALUES = [1, 10, 20, 50, 100, 500];

// 3D Chip Component
const Chip3D: React.FC<{ 
  position: [number, number, number]; 
  value: number;
  onClick?: () => void;
  scale?: number;
}> = ({ position, value, onClick, scale = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
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
    <group position={position} scale={scale} onClick={onClick}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 32]} />
        <meshStandardMaterial color={getColor()} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  );
};

// 3D Playing Card Component
const Card3D: React.FC<{ 
  position: [number, number, number]; 
  value?: string; 
  suit?: string;
  isRevealed: boolean;
  isGold?: boolean;
  isWinner?: boolean;
}> = ({ position, value, suit, isRevealed, isGold, isWinner }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(Math.PI);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isRevealed && rotation > 0) {
        setRotation(prev => Math.max(0, prev - 0.15));
      }
      if (isWinner) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      }
    }
  });

  const isRed = suit === '♥' || suit === '♦';
  const cardColor = isGold ? '#ffd700' : '#ffffff';
  const backColor = isGold ? '#ff8800' : '#1a1a2e';

  return (
    <group ref={meshRef} position={position} rotation={[0, rotation, 0]}>
      {/* Card Front */}
      <RoundedBox args={[0.7, 1, 0.02]} radius={0.05} position={[0, 0, 0.01]}>
        <meshStandardMaterial color={cardColor} />
      </RoundedBox>
      {/* Card Back */}
      <RoundedBox args={[0.7, 1, 0.02]} radius={0.05} position={[0, 0, -0.01]}>
        <meshStandardMaterial color={backColor} />
      </RoundedBox>
      {/* Card Value Text */}
      {isRevealed && value && (
        <Text
          position={[0, 0.15, 0.025]}
          fontSize={0.25}
          color={isGold ? '#000000' : isRed ? '#dc2626' : '#000000'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          {value}
        </Text>
      )}
      {isRevealed && suit && (
        <Text
          position={[0, -0.15, 0.025]}
          fontSize={0.2}
          color={isGold ? '#000000' : isRed ? '#dc2626' : '#000000'}
          anchorX="center"
          anchorY="middle"
        >
          {suit}
        </Text>
      )}
    </group>
  );
};

// 3D Dragon Model
const Dragon3D: React.FC<{ position: [number, number, number]; isWinner: boolean }> = ({ position, isWinner }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      if (isWinner) {
        groupRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Dragon Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Dragon Head */}
      <mesh position={[0.3, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Dragon Snout */}
      <mesh position={[0.5, 0.15, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Dragon Eyes */}
      <mesh position={[0.35, 0.35, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.35, 0.35, -0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
      </mesh>
      {/* Dragon Wings */}
      <mesh position={[-0.2, 0.3, 0.4]} rotation={[0.5, 0.3, 0.5]}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshStandardMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.2, 0.3, -0.4]} rotation={[-0.5, -0.3, 0.5]}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshStandardMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      {/* Dragon Tail */}
      <mesh position={[-0.5, -0.1, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.15, 0.6, 8]} />
        <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Glow Effect for Winner */}
      {isWinner && (
        <pointLight position={[0, 0, 0]} color="#3b82f6" intensity={2} distance={2} />
      )}
    </group>
  );
};

// 3D Tiger Model
const Tiger3D: React.FC<{ position: [number, number, number]; isWinner: boolean }> = ({ position, isWinner }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      if (isWinner) {
        groupRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Tiger Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Tiger Head */}
      <mesh position={[0.4, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#ea580c" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Tiger Ears */}
      <mesh position={[0.45, 0.35, 0.12]}>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <mesh position={[0.45, 0.35, -0.12]}>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      {/* Tiger Eyes */}
      <mesh position={[0.55, 0.2, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.55, 0.2, -0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
      </mesh>
      {/* Tiger Nose */}
      <mesh position={[0.6, 0.1, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Tiger Tail */}
      <mesh position={[-0.5, 0.1, 0]} rotation={[0, 0, 0.8]}>
        <capsuleGeometry args={[0.04, 0.4, 4, 8]} />
        <meshStandardMaterial color="#ea580c" />
      </mesh>
      {/* Tiger Stripes (simplified) */}
      <mesh position={[0.1, 0.15, 0.26]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.1, 0.15, 0.26]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Glow Effect for Winner */}
      {isWinner && (
        <pointLight position={[0, 0, 0]} color="#f97316" intensity={2} distance={2} />
      )}
    </group>
  );
};

// 3D Betting Table
const BettingTable: React.FC<{ 
  onBet: (area: 'dragon' | 'tiger' | 'tie') => void;
  winner: 'dragon' | 'tiger' | 'tie' | null;
  showResult: boolean;
  dragonBets: PlacedChip[];
  tigerBets: PlacedChip[];
  tieBets: PlacedChip[];
}> = ({ onBet, winner, showResult, dragonBets, tigerBets, tieBets }) => {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Main Table */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#1a4d1a" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Table Edge */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[6.2, 0.1, 4.2]} />
        <meshStandardMaterial color="#5a3d2b" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Dragon Bet Area */}
      <group position={[-2, 0.01, 0]} onClick={() => onBet('dragon')}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.8, 2.5]} />
          <meshStandardMaterial 
            color={winner === 'dragon' && showResult ? '#ffd700' : '#1e3a8a'} 
            metalness={0.2} 
            roughness={0.6}
            emissive={winner === 'dragon' && showResult ? '#ffd700' : '#000000'}
            emissiveIntensity={winner === 'dragon' && showResult ? 0.3 : 0}
          />
        </mesh>
        <Text position={[0, 0.02, 0.8]} fontSize={0.2} color="#ffffff" rotation={[-Math.PI / 2, 0, 0]}>
          DRAGON
        </Text>
        <Text position={[0, 0.02, 1]} fontSize={0.12} color="#ffd700" rotation={[-Math.PI / 2, 0, 0]}>
          1:1
        </Text>
        {/* Dragon Chips */}
        {dragonBets.map((chip, idx) => (
          <Chip3D
            key={chip.id}
            position={[(chip.x / 50) - 0.8, 0.1 + idx * 0.05, (chip.y / 50) - 0.5]}
            value={chip.value}
            scale={0.5}
          />
        ))}
      </group>

      {/* Tie Bet Area */}
      <group position={[0, 0.01, 0]} onClick={() => onBet('tie')}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.8, 2.5]} />
          <meshStandardMaterial 
            color={winner === 'tie' && showResult ? '#ffd700' : '#166534'} 
            metalness={0.2} 
            roughness={0.6}
            emissive={winner === 'tie' && showResult ? '#ffd700' : '#000000'}
            emissiveIntensity={winner === 'tie' && showResult ? 0.3 : 0}
          />
        </mesh>
        <Text position={[0, 0.02, 0.8]} fontSize={0.2} color="#ffffff" rotation={[-Math.PI / 2, 0, 0]}>
          TIE
        </Text>
        <Text position={[0, 0.02, 1]} fontSize={0.12} color="#ffd700" rotation={[-Math.PI / 2, 0, 0]}>
          8:1
        </Text>
        {/* Tie Chips */}
        {tieBets.map((chip, idx) => (
          <Chip3D
            key={chip.id}
            position={[(chip.x / 50) - 0.8, 0.1 + idx * 0.05, (chip.y / 50) - 0.5]}
            value={chip.value}
            scale={0.5}
          />
        ))}
      </group>

      {/* Tiger Bet Area */}
      <group position={[2, 0.01, 0]} onClick={() => onBet('tiger')}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.8, 2.5]} />
          <meshStandardMaterial 
            color={winner === 'tiger' && showResult ? '#ffd700' : '#9a3412'} 
            metalness={0.2} 
            roughness={0.6}
            emissive={winner === 'tiger' && showResult ? '#ffd700' : '#000000'}
            emissiveIntensity={winner === 'tiger' && showResult ? 0.3 : 0}
          />
        </mesh>
        <Text position={[0, 0.02, 0.8]} fontSize={0.2} color="#ffffff" rotation={[-Math.PI / 2, 0, 0]}>
          TIGER
        </Text>
        <Text position={[0, 0.02, 1]} fontSize={0.12} color="#ffd700" rotation={[-Math.PI / 2, 0, 0]}>
          1:1
        </Text>
        {/* Tiger Chips */}
        {tigerBets.map((chip, idx) => (
          <Chip3D
            key={chip.id}
            position={[(chip.x / 50) - 0.8, 0.1 + idx * 0.05, (chip.y / 50) - 0.5]}
            value={chip.value}
            scale={0.5}
          />
        ))}
      </group>
    </group>
  );
};

// 3D Scene Component
const GameScene: React.FC<{
  dragonCard: { value: string; suit: string; numValue: number } | null;
  tigerCard: { value: string; suit: string; numValue: number } | null;
  winner: 'dragon' | 'tiger' | 'tie' | null;
  showResult: boolean;
  onBet: (area: 'dragon' | 'tiger' | 'tie') => void;
  dragonBets: PlacedChip[];
  tigerBets: PlacedChip[];
  tieBets: PlacedChip[];
}> = ({ dragonCard, tigerCard, winner, showResult, onBet, dragonBets, tigerBets, tieBets }) => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffd700" />
      
      {/* Dragon */}
      <Dragon3D position={[-2.5, 0.5, -1.5]} isWinner={winner === 'dragon' && showResult} />
      
      {/* Tiger */}
      <Tiger3D position={[2.5, 0.5, -1.5]} isWinner={winner === 'tiger' && showResult} />
      
      {/* Dragon Card */}
      <Card3D 
        position={[-1, 0.5, -1]} 
        value={dragonCard?.value} 
        suit={dragonCard?.suit}
        isRevealed={!!dragonCard}
        isWinner={winner === 'dragon' && showResult}
      />
      
      {/* Tiger Card */}
      <Card3D 
        position={[1, 0.5, -1]} 
        value={tigerCard?.value} 
        suit={tigerCard?.suit}
        isRevealed={!!tigerCard}
        isGold
        isWinner={winner === 'tiger' && showResult}
      />
      
      {/* Betting Table */}
      <BettingTable 
        onBet={onBet} 
        winner={winner} 
        showResult={showResult}
        dragonBets={dragonBets}
        tigerBets={tigerBets}
        tieBets={tieBets}
      />
      
      {/* VS Text */}
      <Text position={[0, 0.8, -1]} fontSize={0.3} color="#ffd700" font="/fonts/Inter-Bold.woff">
        VS
      </Text>

      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.5}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />
    </>
  );
};

// Chip Selection UI Component
const ChipIcon: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; selected?: boolean }> = ({ 
  value, size = 'md', onClick, selected 
}) => {
  const getColors = () => {
    switch(value) {
      case 1: return { outer: '#6b7280', inner: '#4b5563', text: '#fff', ring: '#888' };
      case 10: return { outer: '#22c55e', inner: '#16a34a', text: '#fff', ring: '#4ade80' };
      case 20: return { outer: '#3b82f6', inner: '#2563eb', text: '#fff', ring: '#60a5fa' };
      case 50: return { outer: '#ec4899', inner: '#db2777', text: '#fff', ring: '#f472b6' };
      case 100: return { outer: '#eab308', inner: '#ca8a04', text: '#000', ring: '#fde047' };
      case 500: return { outer: '#f97316', inner: '#ea580c', text: '#fff', ring: '#fb923c' };
      default: return { outer: '#6b7280', inner: '#4b5563', text: '#fff', ring: '#888' };
    }
  };

  const colors = getColors();
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };
  const fontSizes = {
    sm: 'text-[8px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full relative flex items-center justify-center transition-all
        ${selected ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''} 
        ${onClick ? 'hover:scale-105 active:scale-95' : ''}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${colors.outer}, ${colors.inner})`,
        boxShadow: `0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)`,
        border: `3px solid ${colors.ring}`,
      }}
    >
      <div className="absolute inset-1 rounded-full border-2 border-white/20"></div>
      <div className={`${fontSizes[size]} font-bold flex flex-col items-center leading-tight`} style={{ color: colors.text }}>
        <span>{value >= 1000 ? value/1000 : value}</span>
        <span className="text-[6px] opacity-80">CHIP</span>
      </div>
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
    { id: 1, winner: 'dragon' }, { id: 2, winner: 'dragon' }, { id: 3, winner: 'tiger' },
    { id: 4, winner: 'dragon' }, { id: 5, winner: 'tiger' }, { id: 6, winner: 'tiger' },
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

    // Winner logic: Area with LEAST bets wins (house edge)
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
      let dragonCardValue: number;
      let tigerCardValue: number;
      
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
        dragon: {
          value: CARD_VALUES[dragonCardValue],
          suit: CARD_SUITS[Math.floor(Math.random() * 4)],
          numValue: dragonCardValue + 1
        },
        tiger: {
          value: CARD_VALUES[tigerCardValue],
          suit: CARD_SUITS[Math.floor(Math.random() * 4)],
          numValue: tigerCardValue + 1
        }
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
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">Dragon Tiger 3D</div>
          <div className="text-sm text-gray-300">Balance: ₹{balance.toLocaleString()}</div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
            <span className="text-lg">₹</span> Add Cash
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[60vh] w-full">
        <Canvas shadows camera={{ position: [0, 4, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <GameScene
              dragonCard={dragonCard}
              tigerCard={tigerCard}
              winner={winner}
              showResult={showResult}
              onBet={placeBet}
              dragonBets={dragonBets}
              tigerBets={tigerBets}
              tieBets={tieBets}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* History Bar */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {history.map((h, i) => (
            <div
              key={h.id + '-' + i}
              className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] ${
                h.winner === 'dragon' ? 'bg-blue-600' : h.winner === 'tiger' ? 'bg-amber-600' : 'bg-green-500'
              }`}
            >
              {h.winner === 'dragon' ? 'D' : h.winner === 'tiger' ? 'T' : 'Tie'}
            </div>
          ))}
          <button className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className={`px-6 py-2 rounded-full text-lg font-bold ${
          gamePhase === 'betting' 
            ? timer <= 5 ? 'bg-red-600 animate-pulse' : 'bg-green-600'
            : 'bg-yellow-600'
        }`}>
          {gamePhase === 'betting' ? `Bet: ${timer}s` : gamePhase === 'dealing' ? 'Dealing...' : 'Result'}
        </div>
      </div>

      {/* Bet Totals */}
      <div className="absolute left-4 right-4 z-10" style={{ top: '55vh' }}>
        <div className="flex justify-between text-sm font-bold">
          <div className="bg-blue-600/80 px-3 py-1 rounded">Dragon: ₹{dragonTotal}</div>
          <div className="bg-green-600/80 px-3 py-1 rounded">Tie: ₹{tieTotal}</div>
          <div className="bg-orange-600/80 px-3 py-1 rounded">Tiger: ₹{tigerTotal}</div>
        </div>
      </div>

      {/* Chip Selection */}
      <div className="absolute bottom-20 left-0 right-0 z-20">
        <div className="flex items-center justify-center gap-3 px-4">
          {CHIP_VALUES.map((value) => (
            <ChipIcon
              key={value}
              value={value}
              size="lg"
              selected={selectedChip === value}
              onClick={() => setSelectedChip(value)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-4 px-4">
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
            className="bg-gradient-to-b from-amber-600 to-amber-800 px-8 py-3 rounded-lg font-bold shadow-lg border-2 border-amber-500 disabled:opacity-50"
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
      {showResult && (
        ((winner === 'dragon' && dragonTotal > 0) || 
         (winner === 'tiger' && tigerTotal > 0) || 
         (winner === 'tie' && tieTotal > 0)) && (
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
      ))}
    </div>
  );
};

export default DragonTigerGame;
