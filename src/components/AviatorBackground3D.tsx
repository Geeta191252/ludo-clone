import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Animated colorful clouds that move across the sky
const ColorfulClouds = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const cloudPositions = useMemo(() => [
    { pos: [-15, 8, -20], color: '#ff6b6b', scale: 3 },
    { pos: [10, 12, -25], color: '#ffd93d', scale: 4 },
    { pos: [-8, 15, -30], color: '#6bcb77', scale: 3.5 },
    { pos: [20, 10, -22], color: '#4d96ff', scale: 2.8 },
    { pos: [-20, 6, -18], color: '#ff6b6b', scale: 2.5 },
    { pos: [15, 14, -28], color: '#c9b1ff', scale: 3.2 },
    { pos: [0, 18, -35], color: '#ffd93d', scale: 4.5 },
    { pos: [-12, 5, -15], color: '#ff9ff3', scale: 2 },
    { pos: [25, 8, -20], color: '#54a0ff', scale: 3 },
    { pos: [-25, 12, -25], color: '#5f27cd', scale: 3.5 },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    }
  });

  return (
    <group ref={groupRef}>
      {cloudPositions.map((cloud, i) => (
        <Cloud
          key={i}
          position={cloud.pos as [number, number, number]}
          speed={0.2 + i * 0.05}
          opacity={0.6}
          color={cloud.color}
          scale={cloud.scale}
        />
      ))}
    </group>
  );
};

// 3D Trees
const Tree = ({ position }: { position: [number, number, number] }) => {
  const treeRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (treeRef.current) {
      // Gentle swaying
      treeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;
    }
  });

  return (
    <group ref={treeRef} position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 1.0, 0]}>
        <coneGeometry args={[0.5, 0.8, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.4, 0.7, 8]} />
        <meshStandardMaterial color="#388E3C" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial color="#43A047" roughness={0.8} />
      </mesh>
    </group>
  );
};

// Palm Tree for variety
const PalmTree = ({ position }: { position: [number, number, number] }) => {
  const palmRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (palmRef.current) {
      palmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.03;
    }
  });

  return (
    <group ref={palmRef} position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 1.6, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      {/* Palm leaves */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh key={i} position={[0, 1.6, 0]} rotation={[0.5, (angle * Math.PI) / 180, 0]}>
          <boxGeometry args={[0.8, 0.02, 0.15]} />
          <meshStandardMaterial color="#4CAF50" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

// Plants/Bushes
const Bush = ({ position, color = "#4CAF50" }: { position: [number, number, number], color?: string }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.12, 0.1, 0.1]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.12, -0.08]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
};

// Moving Road
const Road = ({ scrollSpeed }: { scrollSpeed: number }) => {
  const roadRef = useRef<THREE.Group>(null);
  const stripeOffsetRef = useRef(0);
  const stripesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    stripeOffsetRef.current += delta * scrollSpeed * 5;
    if (stripesRef.current) {
      stripesRef.current.position.x = -(stripeOffsetRef.current % 2);
    }
  });

  return (
    <group ref={roadRef} position={[0, 0.01, 5]}>
      {/* Main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 3]} />
        <meshStandardMaterial color="#37474F" roughness={0.9} />
      </mesh>
      {/* Road stripes */}
      <group ref={stripesRef}>
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh key={i} position={[-50 + i * 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 0.1]} />
            <meshStandardMaterial color="#FFC107" roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Road edges */}
      <mesh position={[0, 0.015, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.015, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
    </group>
  );
};

// Ground with grass
const Ground = () => {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 100]} />
        <meshStandardMaterial color="#7CB342" roughness={0.9} />
      </mesh>
      {/* Grass patches */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.random() * 60 - 30, 0.02, Math.random() * 20 - 10]}
          rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
        >
          <circleGeometry args={[0.5 + Math.random() * 0.5, 6]} />
          <meshStandardMaterial color={`hsl(${100 + Math.random() * 20}, 60%, ${35 + Math.random() * 15}%)`} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Hills in background
const Hills = () => {
  return (
    <group position={[0, 0, -30]}>
      <mesh position={[-20, 2, 0]}>
        <sphereGeometry args={[8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#558B2F" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3, -5]}>
        <sphereGeometry args={[10, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#689F38" roughness={0.9} />
      </mesh>
      <mesh position={[25, 2.5, 0]}>
        <sphereGeometry args={[9, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7CB342" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Sun with glow
const Sun = () => {
  const sunRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group position={[30, 25, -50]}>
      <mesh ref={sunRef}>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#FDD835" />
      </mesh>
      {/* Sun rays */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 12]}>
          <boxGeometry args={[0.3, 8, 0.1]} />
          <meshBasicMaterial color="#FFEB3B" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

// Flying birds
const Bird = ({ startPosition }: { startPosition: [number, number, number] }) => {
  const birdRef = useRef<THREE.Group>(null);
  const wingRef1 = useRef<THREE.Mesh>(null);
  const wingRef2 = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (birdRef.current) {
      birdRef.current.position.x = startPosition[0] + Math.sin(state.clock.elapsedTime * 0.5 + startPosition[0]) * 10;
      birdRef.current.position.y = startPosition[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
    }
    if (wingRef1.current && wingRef2.current) {
      const wingAngle = Math.sin(state.clock.elapsedTime * 8) * 0.4;
      wingRef1.current.rotation.z = wingAngle;
      wingRef2.current.rotation.z = -wingAngle;
    }
  });

  return (
    <group ref={birdRef} position={startPosition}>
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Wings */}
      <mesh ref={wingRef1} position={[0, 0, 0.15]}>
        <boxGeometry args={[0.05, 0.02, 0.3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={wingRef2} position={[0, 0, -0.15]}>
        <boxGeometry args={[0.05, 0.02, 0.3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

interface AviatorBackground3DProps {
  isFlying: boolean;
  multiplier: number;
}

const SceneContent = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  const scrollSpeed = isFlying ? Math.min(multiplier * 0.5, 5) : 0.1;
  
  // Generate tree positions
  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 25; i++) {
      positions.push([
        Math.random() * 80 - 40,
        0,
        Math.random() * 15 - 20
      ]);
    }
    return positions;
  }, []);

  // Generate palm positions
  const palmPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 10; i++) {
      positions.push([
        Math.random() * 60 - 30,
        0,
        8 + Math.random() * 5
      ]);
    }
    return positions;
  }, []);

  // Generate bush positions
  const bushPositions = useMemo(() => {
    const positions: { pos: [number, number, number], color: string }[] = [];
    const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7'];
    for (let i = 0; i < 40; i++) {
      positions.push({
        pos: [
          Math.random() * 70 - 35,
          0,
          Math.random() * 25 - 15
        ],
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    return positions;
  }, []);

  // Bird positions
  const birdPositions: [number, number, number][] = useMemo(() => [
    [-10, 15, -15],
    [5, 18, -20],
    [15, 12, -18],
    [-15, 20, -25],
    [0, 16, -22],
  ], []);

  return (
    <>
      {/* Sky gradient background */}
      <color attach="background" args={['#87CEEB']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#FFF8E1" castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} color="#B3E5FC" />
      <hemisphereLight args={['#87CEEB', '#7CB342', 0.5]} />
      
      {/* Stars (visible faintly) */}
      <Stars radius={100} depth={50} count={1000} factor={2} saturation={0} fade speed={0.5} />
      
      {/* Sun */}
      <Sun />
      
      {/* Colorful clouds */}
      <ColorfulClouds />
      
      {/* Hills */}
      <Hills />
      
      {/* Ground */}
      <Ground />
      
      {/* Road */}
      <Road scrollSpeed={scrollSpeed} />
      
      {/* Trees */}
      {treePositions.map((pos, i) => (
        <Tree key={`tree-${i}`} position={pos} />
      ))}
      
      {/* Palm trees */}
      {palmPositions.map((pos, i) => (
        <PalmTree key={`palm-${i}`} position={pos} />
      ))}
      
      {/* Bushes */}
      {bushPositions.map((bush, i) => (
        <Bush key={`bush-${i}`} position={bush.pos} color={bush.color} />
      ))}
      
      {/* Birds */}
      {birdPositions.map((pos, i) => (
        <Bird key={`bird-${i}`} startPosition={pos} />
      ))}
    </>
  );
};

const AviatorBackground3D = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 8, 25], fov: 60, near: 0.1, far: 200 }}
        style={{ background: 'linear-gradient(180deg, #1a237e 0%, #3949ab 30%, #7986cb 60%, #c5cae9 100%)' }}
        gl={{ antialias: true, alpha: false }}
      >
        <SceneContent isFlying={isFlying} multiplier={multiplier} />
      </Canvas>
    </div>
  );
};

export default AviatorBackground3D;
