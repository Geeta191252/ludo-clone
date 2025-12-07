import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface PlaneModelProps {
  rotation: number;
  isCrashed: boolean;
}

const PlaneModel = ({ rotation, isCrashed }: PlaneModelProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const propellerRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Subtle bobbing animation
      if (!isCrashed) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.03;
      }
    }
    // Spin propeller
    if (propellerRef.current && !isCrashed) {
      propellerRef.current.rotation.z += delta * 25;
    }
  });

  const crashRotation = isCrashed ? Math.PI / 4 : 0;
  const baseRotation = (rotation * Math.PI) / 180;

  return (
    <group 
      ref={meshRef} 
      rotation={[0.2, Math.PI + 0.3, baseRotation + crashRotation]}
      scale={isCrashed ? 0.8 : 1}
    >
      {/* Fuselage (Body) */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
        <meshStandardMaterial 
          color="#e74c3c" 
          metalness={0.7} 
          roughness={0.3}
        />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.15, -0.3]}>
        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#3498db" 
          metalness={0.9} 
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Wings */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 2.2, 0.5]} />
        <meshStandardMaterial 
          color="#c0392b" 
          metalness={0.6} 
          roughness={0.4}
        />
      </mesh>

      {/* Wing tips - Left */}
      <mesh position={[-1.1, 0, 0.1]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#f39c12" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wing tips - Right */}
      <mesh position={[1.1, 0, 0.1]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#f39c12" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tail Fin (Vertical) */}
      <mesh position={[0, 0.25, 0.7]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.3]} />
        <meshStandardMaterial 
          color="#c0392b" 
          metalness={0.6} 
          roughness={0.4}
        />
      </mesh>

      {/* Tail Wings (Horizontal) */}
      <mesh position={[0, 0, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.05, 0.7, 0.2]} />
        <meshStandardMaterial 
          color="#c0392b" 
          metalness={0.6} 
          roughness={0.4}
        />
      </mesh>

      {/* Nose Cone */}
      <mesh position={[0, 0, -0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 0.3, 16]} />
        <meshStandardMaterial 
          color="#f1c40f" 
          metalness={0.8} 
          roughness={0.2}
        />
      </mesh>

      {/* Propeller Hub */}
      <mesh position={[0, 0, -0.92]}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Propeller Blades */}
      <group ref={propellerRef} position={[0, 0, -0.95]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.1, 0.02]} />
          <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.8, 0.1, 0.02]} />
          <meshStandardMaterial color="#34495e" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Engine exhausts */}
      <mesh position={[0.15, -0.15, 0.2]}>
        <cylinderGeometry args={[0.05, 0.04, 0.15, 8]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-0.15, -0.15, 0.2]}>
        <cylinderGeometry args={[0.05, 0.04, 0.15, 8]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Engine Fire/Thrust Effect */}
      {!isCrashed && (
        <>
          <mesh position={[0.15, -0.15, 0.35]}>
            <coneGeometry args={[0.04, 0.2, 8]} />
            <meshBasicMaterial color="#ff6b35" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-0.15, -0.15, 0.35]}>
            <coneGeometry args={[0.04, 0.2, 8]} />
            <meshBasicMaterial color="#ff6b35" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
};

interface Plane3DProps {
  rotation: number;
  isCrashed: boolean;
}

const Plane3D = ({ rotation, isCrashed }: Plane3DProps) => {
  return (
    <div className="w-32 h-24">
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.5} color="#ff9f43" />
        <pointLight position={[0, -2, 0]} intensity={0.3} color="#e74c3c" />
        
        <PlaneModel rotation={rotation} isCrashed={isCrashed} />
      </Canvas>
    </div>
  );
};

export default Plane3D;
