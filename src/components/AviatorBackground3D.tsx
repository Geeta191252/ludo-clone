import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface AviatorBackground3DProps {
  isFlying: boolean;
  multiplier: number;
}

// Realistic 3D Building with glass and concrete textures
const RealisticBuilding = ({ 
  position, 
  width, 
  height, 
  depth, 
  buildingType,
  scrollSpeed
}: { 
  position: [number, number, number]; 
  width: number; 
  height: number; 
  depth: number;
  buildingType: 'glass' | 'concrete' | 'modern' | 'residential';
  scrollSpeed: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = useRef(position[0]);
  
  useFrame((_, delta) => {
    if (groupRef.current && scrollSpeed > 0) {
      groupRef.current.position.x -= delta * scrollSpeed;
      if (groupRef.current.position.x < -80) {
        groupRef.current.position.x = 80;
      }
    }
  });

  const getColors = () => {
    switch (buildingType) {
      case 'glass':
        return { main: '#1a3a5c', window: '#4da6ff', accent: '#0d2a42' };
      case 'concrete':
        return { main: '#8b8b8b', window: '#87CEEB', accent: '#6b6b6b' };
      case 'modern':
        return { main: '#2c3e50', window: '#5dade2', accent: '#1a252f' };
      case 'residential':
        return { main: '#d4a574', window: '#ffe4b5', accent: '#a67c52' };
    }
  };

  const colors = getColors();
  
  // Generate realistic window grid
  const windows = useMemo(() => {
    const wins: { x: number; y: number; lit: boolean }[] = [];
    const floors = Math.floor(height / 0.8);
    const cols = Math.floor(width / 0.6);
    for (let floor = 1; floor < floors; floor++) {
      for (let col = 0; col < cols; col++) {
        wins.push({
          x: -width/2 + 0.3 + col * 0.6,
          y: -height/2 + 0.5 + floor * 0.8,
          lit: Math.random() > 0.4
        });
      }
    }
    return wins;
  }, [width, height]);

  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
      {/* Main building structure */}
      <mesh position={[0, height/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={colors.main} 
          metalness={buildingType === 'glass' ? 0.8 : 0.1}
          roughness={buildingType === 'glass' ? 0.2 : 0.8}
        />
      </mesh>
      
      {/* Building edge details */}
      <mesh position={[0, height/2, depth/2 + 0.02]} castShadow>
        <boxGeometry args={[width + 0.1, height, 0.05]} />
        <meshStandardMaterial color={colors.accent} metalness={0.5} roughness={0.3} />
      </mesh>
      
      {/* Roof structure */}
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
        <meshStandardMaterial color={colors.accent} />
      </mesh>
      
      {/* AC units on roof */}
      {Math.random() > 0.5 && (
        <mesh position={[0, height + 0.4, 0]}>
          <boxGeometry args={[0.8, 0.4, 0.6]} />
          <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.4} />
        </mesh>
      )}
      
      {/* Windows with glow effect */}
      {windows.map((win, i) => (
        <mesh key={i} position={[win.x, height/2 + win.y, depth/2 + 0.03]}>
          <planeGeometry args={[0.4, 0.5]} />
          <meshStandardMaterial 
            color={win.lit ? colors.window : '#2c3e50'} 
            emissive={win.lit ? colors.window : '#000000'}
            emissiveIntensity={win.lit ? 0.3 : 0}
          />
        </mesh>
      ))}
      
      {/* Ground floor entrance */}
      <mesh position={[0, 0.6, depth/2 + 0.03]}>
        <planeGeometry args={[width * 0.3, 1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

// Realistic Cloud with volumetric appearance
const RealisticCloud = ({ 
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
      groupRef.current.position.x -= delta * (scrollSpeed * 0.2 + 0.5);
      if (groupRef.current.position.x < -100) {
        groupRef.current.position.x = 100;
      }
    }
  });

  const cloudParts = useMemo(() => [
    { pos: [0, 0, 0] as [number, number, number], size: 3 },
    { pos: [-2, 0.3, 0.5] as [number, number, number], size: 2.2 },
    { pos: [2, 0.2, -0.3] as [number, number, number], size: 2.5 },
    { pos: [-1, 0.8, 0.2] as [number, number, number], size: 1.8 },
    { pos: [1.5, 0.6, 0.4] as [number, number, number], size: 2 },
    { pos: [0, 0.5, -0.8] as [number, number, number], size: 2.3 },
    { pos: [-2.5, -0.2, -0.5] as [number, number, number], size: 1.5 },
    { pos: [2.5, -0.1, 0.3] as [number, number, number], size: 1.7 },
  ], []);

  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]} scale={scale}>
      {cloudParts.map((part, i) => (
        <mesh key={i} position={part.pos}>
          <sphereGeometry args={[part.size, 24, 24]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent
            opacity={0.95}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
};

// Realistic Tree with detailed foliage
const RealisticTree = ({ 
  position,
  treeType,
  scrollSpeed
}: { 
  position: [number, number, number];
  treeType: 'oak' | 'pine' | 'palm';
  scrollSpeed: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = useRef(position[0]);
  
  useFrame((_, delta) => {
    if (groupRef.current && scrollSpeed > 0) {
      groupRef.current.position.x -= delta * scrollSpeed;
      if (groupRef.current.position.x < -80) {
        groupRef.current.position.x = 80;
      }
    }
  });

  if (treeType === 'palm') {
    return (
      <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
        {/* Palm trunk */}
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.15, 0.25, 4, 12]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
        {/* Palm fronds */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <mesh 
            key={i} 
            position={[
              Math.sin(angle * Math.PI / 180) * 1,
              3.8,
              Math.cos(angle * Math.PI / 180) * 1
            ]}
            rotation={[0.3, angle * Math.PI / 180, 0.5]}
          >
            <coneGeometry args={[0.3, 2.5, 4]} />
            <meshStandardMaterial color="#2e7d32" roughness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }

  if (treeType === 'pine') {
    return (
      <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.12, 0.18, 2, 8]} />
          <meshStandardMaterial color="#4e342e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[1.2, 2, 8]} />
          <meshStandardMaterial color="#1b5e20" roughness={0.8} />
        </mesh>
        <mesh position={[0, 3.8, 0]}>
          <coneGeometry args={[0.9, 1.5, 8]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4.8, 0]}>
          <coneGeometry args={[0.5, 1, 8]} />
          <meshStandardMaterial color="#388e3c" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  // Oak tree (default)
  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 2.4, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.85} />
      </mesh>
      <mesh position={[-0.8, 2.8, 0.4]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#388e3c" roughness={0.85} />
      </mesh>
      <mesh position={[0.9, 2.9, -0.3]}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial color="#1b5e20" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#4caf50" roughness={0.85} />
      </mesh>
    </group>
  );
};

// Realistic Road with proper markings and textures
const RealisticRoad = ({ scrollSpeed }: { scrollSpeed: number }) => {
  const stripesRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(0);

  useFrame((_, delta) => {
    if (scrollSpeed > 0) {
      offsetRef.current += delta * scrollSpeed * 3;
      if (stripesRef.current) {
        stripesRef.current.position.x = -(offsetRef.current % 6);
      }
    }
  });

  return (
    <group position={[0, 0.02, 12]}>
      {/* Asphalt road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 8]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.95} />
      </mesh>
      
      {/* Road edges (white lines) */}
      <mesh position={[0, 0.01, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 0.15]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.01, 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 0.15]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Center yellow dashed line */}
      <group ref={stripesRef}>
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh key={i} position={[-100 + i * 6, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 0.12]} />
            <meshBasicMaterial color="#ffc107" />
          </mesh>
        ))}
      </group>
      
      {/* Sidewalk left */}
      <mesh position={[0, 0.08, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 2]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
      </mesh>
      
      {/* Sidewalk right */}
      <mesh position={[0, 0.08, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 2]} />
        <meshStandardMaterial color="#9e9e9e" roughness={0.9} />
      </mesh>
      
      {/* Curb left */}
      <mesh position={[0, 0.1, -4.1]}>
        <boxGeometry args={[200, 0.15, 0.2]} />
        <meshStandardMaterial color="#757575" />
      </mesh>
      
      {/* Curb right */}
      <mesh position={[0, 0.1, 4.1]}>
        <boxGeometry args={[200, 0.15, 0.2]} />
        <meshStandardMaterial color="#757575" />
      </mesh>
    </group>
  );
};

// Realistic Ground with grass texture feel
const RealisticGround = () => {
  return (
    <group>
      {/* Main grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 150]} />
        <meshStandardMaterial color="#4caf50" roughness={0.95} />
      </mesh>
      
      {/* Grass patches for variation */}
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh 
          key={i}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[
            -80 + Math.random() * 160, 
            0.01, 
            -20 + Math.random() * 25
          ]}
        >
          <circleGeometry args={[1 + Math.random() * 2, 16]} />
          <meshStandardMaterial 
            color={`hsl(${100 + Math.random() * 20}, ${60 + Math.random() * 20}%, ${35 + Math.random() * 15}%)`}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
};

// Street Lamp
const StreetLamp = ({ 
  position, 
  scrollSpeed 
}: { 
  position: [number, number, number]; 
  scrollSpeed: number 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = useRef(position[0]);

  useFrame((_, delta) => {
    if (groupRef.current && scrollSpeed > 0) {
      groupRef.current.position.x -= delta * scrollSpeed;
      if (groupRef.current.position.x < -80) {
        groupRef.current.position.x = 80;
      }
    }
  });

  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 5, 8]} />
        <meshStandardMaterial color="#424242" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.4, 4.8, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Light */}
      <mesh position={[0.7, 4.7, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#fff9c4" 
          emissive="#fff9c4"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Light glow */}
      <pointLight position={[0.7, 4.7, 0]} color="#fff9c4" intensity={0.5} distance={8} />
    </group>
  );
};

// Car
const Car = ({ 
  position, 
  color,
  scrollSpeed 
}: { 
  position: [number, number, number]; 
  color: string;
  scrollSpeed: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const initialX = useRef(position[0]);

  useFrame((_, delta) => {
    if (groupRef.current && scrollSpeed > 0) {
      groupRef.current.position.x -= delta * scrollSpeed * 1.2;
      if (groupRef.current.position.x < -80) {
        groupRef.current.position.x = 80;
      }
    }
  });

  return (
    <group ref={groupRef} position={[initialX.current, position[1], position[2]]}>
      {/* Car body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2, 0.5, 1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Car top */}
      <mesh position={[0.1, 0.75, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Windows */}
      <mesh position={[0.1, 0.75, 0.46]}>
        <planeGeometry args={[1.1, 0.35]} />
        <meshStandardMaterial color="#1a237e" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Wheels */}
      {[[-0.6, 0.2, 0.5], [-0.6, 0.2, -0.5], [0.6, 0.2, 0.5], [0.6, 0.2, -0.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
          <meshStandardMaterial color="#212121" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Mountains in far distance
const Mountains = () => {
  return (
    <group position={[0, 0, -80]}>
      {[-60, -30, 0, 30, 60].map((x, i) => (
        <mesh key={i} position={[x, 5 + i * 2, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[15 + i * 3, 15 + i * 4, 4]} />
          <meshStandardMaterial color={`hsl(210, 20%, ${30 + i * 5}%)`} roughness={0.9} />
        </mesh>
      ))}
      {/* Snow caps */}
      {[-60, -30, 0, 30, 60].map((x, i) => (
        <mesh key={`snow-${i}`} position={[x, 12 + i * 3, 0]}>
          <coneGeometry args={[5 + i, 4, 4]} />
          <meshStandardMaterial color="#fafafa" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// Birds flying
const FlyingBirds = ({ scrollSpeed }: { scrollSpeed: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current) {
      timeRef.current += delta;
      groupRef.current.position.x -= delta * (scrollSpeed * 0.1 + 2);
      groupRef.current.position.y = 25 + Math.sin(timeRef.current * 2) * 2;
      if (groupRef.current.position.x < -100) {
        groupRef.current.position.x = 100;
      }
    }
  });

  return (
    <group ref={groupRef} position={[50, 25, -30]}>
      {[0, 3, 6, 2, 5].map((offset, i) => (
        <mesh key={i} position={[offset, Math.sin(offset) * 0.5, i * 0.5]} rotation={[0, 0, Math.sin(timeRef.current * 5 + offset) * 0.3]}>
          <coneGeometry args={[0.1, 0.5, 3]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
};

const SceneContent = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  const scrollSpeed = isFlying ? Math.min(multiplier * 3, 20) : 0;

  // Generate varied buildings
  const buildings = useMemo(() => {
    const types: ('glass' | 'concrete' | 'modern' | 'residential')[] = ['glass', 'concrete', 'modern', 'residential'];
    return Array.from({ length: 20 }).map((_, i) => ({
      position: [-90 + i * 10, 0, -8 - Math.random() * 10] as [number, number, number],
      width: 3 + Math.random() * 4,
      height: 6 + Math.random() * 18,
      depth: 3 + Math.random() * 2,
      type: types[Math.floor(Math.random() * types.length)]
    }));
  }, []);

  const frontBuildings = useMemo(() => {
    const types: ('glass' | 'concrete' | 'modern' | 'residential')[] = ['residential', 'concrete', 'modern'];
    return Array.from({ length: 12 }).map((_, i) => ({
      position: [-70 + i * 12, 0, 0] as [number, number, number],
      width: 4 + Math.random() * 3,
      height: 4 + Math.random() * 8,
      depth: 3,
      type: types[Math.floor(Math.random() * types.length)]
    }));
  }, []);

  const clouds = useMemo(() => 
    Array.from({ length: 12 }).map((_, i) => ({
      position: [-100 + i * 20, 20 + Math.random() * 15, -40 - Math.random() * 30] as [number, number, number],
      scale: 0.8 + Math.random() * 0.8
    }))
  , []);

  const trees = useMemo(() => {
    const types: ('oak' | 'pine' | 'palm')[] = ['oak', 'pine', 'palm'];
    return Array.from({ length: 15 }).map((_, i) => ({
      position: [-70 + i * 10, 0, 6 + Math.random() * 2] as [number, number, number],
      type: types[Math.floor(Math.random() * types.length)]
    }));
  }, []);

  const streetLamps = useMemo(() => 
    Array.from({ length: 10 }).map((_, i) => ({
      position: [-80 + i * 18, 0, 6.5] as [number, number, number]
    }))
  , []);

  const cars = useMemo(() => {
    const colors = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#6d4c41', '#ffffff', '#212121'];
    return Array.from({ length: 6 }).map((_, i) => ({
      position: [-60 + i * 25, 0.15, 13 + (i % 2) * 2] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, []);

  return (
    <>
      {/* Realistic Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.5}
        azimuth={0.25}
      />
      
      {/* Environment lighting for realism */}
      <Environment preset="city" />
      
      {/* Main lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[50, 50, 25]} 
        intensity={1.2} 
        color="#fff8e1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={['#87ceeb', '#4caf50', 0.3]} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#a5d6f7', 60, 150]} />
      
      {/* Mountains in far background */}
      <Mountains />
      
      {/* Clouds */}
      {clouds.map((cloud, i) => (
        <RealisticCloud 
          key={i} 
          position={cloud.position} 
          scale={cloud.scale}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Flying birds */}
      <FlyingBirds scrollSpeed={scrollSpeed} />
      
      {/* Back row buildings */}
      {buildings.map((building, i) => (
        <RealisticBuilding
          key={`back-${i}`}
          position={building.position}
          width={building.width}
          height={building.height}
          depth={building.depth}
          buildingType={building.type}
          scrollSpeed={scrollSpeed * 0.5}
        />
      ))}
      
      {/* Front row buildings */}
      {frontBuildings.map((building, i) => (
        <RealisticBuilding
          key={`front-${i}`}
          position={building.position}
          width={building.width}
          height={building.height}
          depth={building.depth}
          buildingType={building.type}
          scrollSpeed={scrollSpeed * 0.8}
        />
      ))}
      
      {/* Trees */}
      {trees.map((tree, i) => (
        <RealisticTree 
          key={i} 
          position={tree.position}
          treeType={tree.type}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Street lamps */}
      {streetLamps.map((lamp, i) => (
        <StreetLamp
          key={i}
          position={lamp.position}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Cars on road */}
      {cars.map((car, i) => (
        <Car
          key={i}
          position={car.position}
          color={car.color}
          scrollSpeed={scrollSpeed}
        />
      ))}
      
      {/* Ground */}
      <RealisticGround />
      
      {/* Road */}
      <RealisticRoad scrollSpeed={scrollSpeed} />
    </>
  );
};

const AviatorBackground3D = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 12, 30], fov: 55, near: 0.1, far: 500 }}
        shadows
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <SceneContent isFlying={isFlying} multiplier={multiplier} />
      </Canvas>
    </div>
  );
};

export default AviatorBackground3D;
