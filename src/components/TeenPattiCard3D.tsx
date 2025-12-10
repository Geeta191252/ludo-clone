import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Card3DProps {
  card: string;
  isFlipped: boolean;
  delay?: number;
  position?: [number, number, number];
}

const Card3DMesh: React.FC<Card3DProps> = ({ card, isFlipped, delay = 0, position = [0, 0, 0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [currentRotation, setCurrentRotation] = useState(Math.PI);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasStarted(true);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useFrame((state, delta) => {
    if (!meshRef.current || !hasStarted) return;
    
    const targetRotation = isFlipped ? 0 : Math.PI;
    const newRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, delta * 5);
    setCurrentRotation(newRotation);
    meshRef.current.rotation.y = newRotation;
    
    // Subtle floating animation
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.02;
  });

  const getCardContent = () => {
    if (card === 'back') return { value: '', suit: '', color: '#1a1a2e' };
    const [value, suit] = card.split('_');
    const suitSymbols: Record<string, string> = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    const suitColors: Record<string, string> = {
      hearts: '#ef4444',
      diamonds: '#ef4444',
      clubs: '#1f2937',
      spades: '#1f2937'
    };
    return { value, suit: suitSymbols[suit] || '', color: suitColors[suit] || '#000' };
  };

  const { value, suit, color } = getCardContent();

  return (
    <mesh ref={meshRef} position={position}>
      {/* Card body */}
      <RoundedBox args={[1, 1.4, 0.05]} radius={0.05} smoothness={4}>
        <meshStandardMaterial color="#ffffff" />
      </RoundedBox>
      
      {/* Front face content */}
      <group position={[0, 0, 0.03]}>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.35}
          color={color}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          {value}
        </Text>
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {suit}
        </Text>
      </group>

      {/* Back face pattern */}
      <group position={[0, 0, -0.03]} rotation={[0, Math.PI, 0]}>
        <RoundedBox args={[0.9, 1.3, 0.01]} radius={0.03} smoothness={4}>
          <meshStandardMaterial color="#6366f1" />
        </RoundedBox>
        {/* Diamond pattern */}
        {[-0.2, 0, 0.2].map((y, i) => (
          [-0.15, 0.15].map((x, j) => (
            <mesh key={`${i}-${j}`} position={[x, y, 0.01]} rotation={[0, 0, Math.PI / 4]}>
              <planeGeometry args={[0.1, 0.1]} />
              <meshStandardMaterial color="#818cf8" />
            </mesh>
          ))
        ))}
      </group>
    </mesh>
  );
};

interface TeenPattiCard3DProps {
  card: string;
  isFlipped: boolean;
  delay?: number;
  large?: boolean;
}

const TeenPattiCard3D: React.FC<TeenPattiCard3DProps> = ({ card, isFlipped, delay = 0, large = false }) => {
  return (
    <div className={`${large ? 'w-20 h-28' : 'w-8 h-12'}`}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <pointLight position={[-2, -2, 2]} intensity={0.3} />
        <Card3DMesh card={card} isFlipped={isFlipped} delay={delay} />
      </Canvas>
    </div>
  );
};

export default TeenPattiCard3D;
