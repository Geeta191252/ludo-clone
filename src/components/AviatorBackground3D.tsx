import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AviatorBackground3DProps {
  isFlying: boolean;
  multiplier: number;
}

// 3D Building Component
const Building = ({ 
  position, 
  width, 
  height, 
  depth, 
  color,
  scrollSpeed
}: { 
  position: [number, number, number]; 
  width: number; 
  height: number; 
  depth: number;
  color: string;
  scrollSpeed: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialX = useRef(position[0]);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.x -= delta * scrollSpeed;
      // Reset position when out of view
      if (meshRef.current.position.x < -60) {
        meshRef.current.position.x = 60;
      }
    }
  });

  // Generate window positions
  const windows = useMemo(() => {
    const wins: { x: number; y: number }[] = [];
    const rows = Math.floor(height / 1.2);
    const cols = Math.floor(width / 0.8);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > 0.2) {
          wins.push({
            x: -width/2 + 0.4 + col * 0.8,
            y: -height/2 + 0.6 + row * 1.2
          });
        }
      }
    }
    return wins;
  }, [width, height]);

  return (
    <group>
      <mesh ref={meshRef} position={[initialX.current, position[1] + height/2, position[2]]}>
        {/* Building body */}
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
        
        {/* Windows */}
        {windows.map((win, i) => (
          <mesh key={i} position={[win.x, win.y, depth/2 + 0.01]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshBasicMaterial color="#87CEEB" />
          </mesh>
        ))}
      </mesh>
    </group>
  );
};

// 3D Cloud
const Cloud = ({ 
  position, 
  scale,
  scrollSpeed
}: { 
  position: [number, number, number]; 
  scale: number;
  scrollSpeed: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = useRef(position[0]);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x -= delta * scrollSpeed * 0.3;
      if (groupRef.current.position.x < -80) {
        groupRef.current.position.x = 80;
      }
    }
  });

  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-1.5, -0.3, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[1.5, -0.3, 0]}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

// 3D Tree (round bush style like reference)
const Tree = ({ 
  position,
  scrollSpeed
}: { 
  position: [number, number, number];
  scrollSpeed: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = useRef(position[0]);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x -= delta * scrollSpeed;
      if (groupRef.current.position.x < -60) {
        groupRef.current.position.x = 60;
      }
    }
  });

  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.6, 8]} />
        <meshStandardMaterial color="#5D4E37" />
      </mesh>
      {/* Foliage (round style) */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#2D5A27" />
      </mesh>
      <mesh position={[-0.6, 1.9, 0.3]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#3D7A35" />
      </mesh>
      <mesh position={[0.6, 1.9, -0.3]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#3D7A35" />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#4A8B42" />
      </mesh>
    </group>
  );
};

// Road with moving stripes
const Road = ({ scrollSpeed }: { scrollSpeed: number }) => {
  const stripesRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(0);

  useFrame((_, delta) => {
    offsetRef.current += delta * scrollSpeed * 3;
    if (stripesRef.current) {
      stripesRef.current.position.x = -(offsetRef.current % 4);
    }
  });

  return (
    <group position={[0, 0.01, 8]}>
      {/* Main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 4]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
      
      {/* Road stripes */}
      <group ref={stripesRef}>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} position={[-80 + i * 4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2, 0.2]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
        ))}
      </group>
      
      {/* Sidewalk */}
      <mesh position={[0, 0.05, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 1]} />
        <meshStandardMaterial color="#C4A35A" />
      </mesh>
    </group>
  );
};

// Ground
const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[200, 100]} />
      <meshStandardMaterial color="#7CB342" />
    </mesh>
  );
};

// City Silhouette (far background)
const CitySilhouette = () => {
  const buildings = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      x: -70 + i * 5,
      height: 8 + Math.random() * 15,
      width: 3 + Math.random() * 2
    }));
  }, []);

  return (
    <group position={[0, 0, -40]}>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.height / 2, 0]}>
          <boxGeometry args={[b.width, b.height, 2]} />
          <meshStandardMaterial color="#1a3a5c" />
        </mesh>
      ))}
    </group>
  );
};

const SceneContent = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  const scrollSpeed = isFlying ? Math.min(multiplier * 2, 15) : 0;

  // Generate buildings for different layers
  const midBuildings = useMemo(() => {
    const colors = ['#E8976E', '#F5DEB3', '#C4A35A', '#E8B87A', '#D4A574'];
    return Array.from({ length: 12 }).map((_, i) => ({
      position: [-50 + i * 10, 0, -5 - Math.random() * 5] as [number, number, number],
      width: 3 + Math.random() * 2,
      height: 5 + Math.random() * 8,
      depth: 3,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, []);

  const frontBuildings = useMemo(() => {
    const colors = ['#D4765C', '#F5E6D3', '#E8C97A', '#D98C5F'];
    return Array.from({ length: 8 }).map((_, i) => ({
      position: [-40 + i * 12, 0, 2] as [number, number, number],
      width: 4 + Math.random() * 3,
      height: 4 + Math.random() * 5,
      depth: 4,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, []);

  const clouds = useMemo(() => [
    { position: [-30, 18, -30] as [number, number, number], scale: 1.5 },
    { position: [20, 22, -35] as [number, number, number], scale: 1.2 },
    { position: [50, 16, -28] as [number, number, number], scale: 1 },
    { position: [-60, 20, -32] as [number, number, number], scale: 1.3 },
    { position: [0, 25, -40] as [number, number, number], scale: 1.8 },
  ], []);

  const trees = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      position: [-45 + i * 10, 0, 5] as [number, number, number]
    }));
  }, []);

  return (
    <>
      {/* Sky gradient background */}
      <color attach="background" args={['#87CEEB']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1} color="#FFF8E1" />
      <hemisphereLight args={['#87CEEB', '#7CB342', 0.4]} />
      
      {/* Far city silhouette */}
      <CitySilhouette />
      
      {/* Clouds */}
      {clouds.map((cloud, i) => (
        <Cloud 
          key={i} 
          position={cloud.position} 
          scale={cloud.scale}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Mid buildings */}
      {midBuildings.map((building, i) => (
        <Building
          key={`mid-${i}`}
          position={building.position}
          width={building.width}
          height={building.height}
          depth={building.depth}
          color={building.color}
          scrollSpeed={scrollSpeed * 0.6}
        />
      ))}
      
      {/* Front buildings */}
      {frontBuildings.map((building, i) => (
        <Building
          key={`front-${i}`}
          position={building.position}
          width={building.width}
          height={building.height}
          depth={building.depth}
          color={building.color}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Trees */}
      {trees.map((tree, i) => (
        <Tree 
          key={i} 
          position={tree.position}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Ground */}
      <Ground />
      
      {/* Road */}
      <Road scrollSpeed={scrollSpeed} />
    </>
  );
};

const AviatorBackground3D = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 50, near: 0.1, far: 200 }}
        style={{ background: 'linear-gradient(180deg, #5BA3D9 0%, #87CEEB 40%, #B0E2FF 100%)' }}
        gl={{ antialias: true, alpha: false }}
      >
        <SceneContent isFlying={isFlying} multiplier={multiplier} />
      </Canvas>
    </div>
  );
};

export default AviatorBackground3D;
