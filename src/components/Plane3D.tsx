import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlaneModelProps {
  rotation: number;
  isCrashed: boolean;
}

const PlaneModel = ({ rotation, isCrashed }: PlaneModelProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const propellerRef = useRef<THREE.Group>(null);
  const exhaustFlameRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth bobbing animation when flying
      if (!isCrashed) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.08;
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      }
    }
    // Spin propeller fast
    if (propellerRef.current && !isCrashed) {
      propellerRef.current.rotation.z += delta * 35;
    }
    // Animate exhaust flames
    if (exhaustFlameRef.current && !isCrashed) {
      exhaustFlameRef.current.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 20) * 0.2);
    }
  });

  const crashRotation = isCrashed ? Math.PI / 3 : 0;
  const baseRotation = (rotation * Math.PI) / 180;

  return (
    <group 
      ref={meshRef} 
      rotation={[0.15, -0.2, baseRotation + crashRotation]}
      scale={isCrashed ? 0.7 : 1}
      position={[0, 0, 0]}
    >
      {/* Main Fuselage (Body) - Sleek aerodynamic shape */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.18, 1.4, 12, 24]} />
        <meshStandardMaterial 
          color="#dc2626" 
          metalness={0.85} 
          roughness={0.15}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Fuselage Accent Stripe */}
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.04, 1.35, 8, 16]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          metalness={0.9} 
          roughness={0.1}
        />
      </mesh>

      {/* Cockpit Glass - Bubble canopy */}
      <mesh position={[0.45, 0.12, 0]}>
        <sphereGeometry args={[0.16, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <meshPhysicalMaterial 
          color="#60a5fa" 
          metalness={0.1} 
          roughness={0.05}
          transparent
          opacity={0.85}
          transmission={0.4}
          thickness={0.1}
        />
      </mesh>

      {/* Cockpit Frame */}
      <mesh position={[0.45, 0.08, 0]}>
        <torusGeometry args={[0.14, 0.015, 8, 24]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Main Wings - Swept back design */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.45, 0.04, 2.4]} />
        <meshStandardMaterial 
          color="#b91c1c" 
          metalness={0.7} 
          roughness={0.25}
        />
      </mesh>

      {/* Wing Leading Edge - Left */}
      <mesh position={[0.12, -0.02, -0.9]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.035, 0.6]} />
        <meshStandardMaterial color="#991b1b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wing Leading Edge - Right */}
      <mesh position={[0.12, -0.02, 0.9]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.15, 0.035, 0.6]} />
        <meshStandardMaterial color="#991b1b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wing Tips with Lights - Left */}
      <mesh position={[0, -0.02, -1.25]}>
        <boxGeometry args={[0.12, 0.025, 0.15]} />
        <meshStandardMaterial color="#22c55e" metalness={0.9} roughness={0.1} emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>

      {/* Wing Tips with Lights - Right */}
      <mesh position={[0, -0.02, 1.25]}>
        <boxGeometry args={[0.12, 0.025, 0.15]} />
        <meshStandardMaterial color="#ef4444" metalness={0.9} roughness={0.1} emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>

      {/* Vertical Tail Fin */}
      <mesh position={[-0.75, 0.22, 0]}>
        <boxGeometry args={[0.35, 0.45, 0.03]} />
        <meshStandardMaterial 
          color="#b91c1c" 
          metalness={0.7} 
          roughness={0.25}
        />
      </mesh>

      {/* Tail Fin Accent */}
      <mesh position={[-0.68, 0.32, 0]}>
        <boxGeometry args={[0.18, 0.15, 0.035]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Horizontal Tail Wings */}
      <mesh position={[-0.72, 0.02, 0]}>
        <boxGeometry args={[0.25, 0.025, 0.9]} />
        <meshStandardMaterial 
          color="#b91c1c" 
          metalness={0.7} 
          roughness={0.25}
        />
      </mesh>

      {/* Nose Cone - Aerodynamic */}
      <mesh position={[0.88, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.35, 24]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          metalness={0.9} 
          roughness={0.1}
        />
      </mesh>

      {/* Spinner/Propeller Hub */}
      <mesh position={[1.08, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.12, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Propeller Assembly */}
      <group ref={propellerRef} position={[1.02, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* 3-Blade Propeller */}
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.9, 0.015]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 3]}>
          <boxGeometry args={[0.08, 0.9, 0.015]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 3]}>
          <boxGeometry args={[0.08, 0.9, 0.015]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Engine Cowling */}
      <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.18, 0.3, 24]} />
        <meshStandardMaterial color="#4b5563" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Engine Air Intakes */}
      <mesh position={[0.5, -0.12, 0.08]}>
        <boxGeometry args={[0.15, 0.06, 0.08]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.5, -0.12, -0.08]}>
        <boxGeometry args={[0.15, 0.06, 0.08]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Exhaust Pipes */}
      <mesh position={[-0.35, -0.12, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.04, 0.18, 12]} />
        <meshStandardMaterial color="#374151" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[-0.35, -0.12, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.04, 0.18, 12]} />
        <meshStandardMaterial color="#374151" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Exhaust Flames Effect */}
      {!isCrashed && (
        <group ref={exhaustFlameRef}>
          <mesh position={[-0.48, -0.12, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.03, 0.25, 8]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.48, -0.12, -0.1]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.03, 0.25, 8]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.9} />
          </mesh>
          {/* Inner flame */}
          <mesh position={[-0.45, -0.12, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.015, 0.15, 8]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.95} />
          </mesh>
          <mesh position={[-0.45, -0.12, -0.1]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.015, 0.15, 8]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.95} />
          </mesh>
        </group>
      )}

      {/* Landing Gear - Retracted style bumps */}
      <mesh position={[0.2, -0.18, 0.25]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.2, -0.18, -0.25]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.1, 0.22, 0]}>
        <cylinderGeometry args={[0.008, 0.005, 0.12, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

interface Plane3DProps {
  rotation: number;
  isCrashed: boolean;
}

const Plane3D = ({ rotation, isCrashed }: Plane3DProps) => {
  return (
    <div className="w-40 h-32">
      <Canvas
        camera={{ position: [2.5, 1, 2], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#fef3c7" />
        <pointLight position={[2, -1, 0]} intensity={0.6} color="#f97316" />
        <spotLight position={[0, 5, 0]} intensity={0.3} angle={0.5} />
        
        <PlaneModel rotation={rotation} isCrashed={isCrashed} />
      </Canvas>
    </div>
  );
};

export default Plane3D;
