import { useRef, useMemo, useEffect, useState } from 'react';

interface AviatorBackground3DProps {
  isFlying: boolean;
  multiplier: number;
}

// Individual Building component
const Building = ({ 
  x, 
  width, 
  height, 
  color, 
  windowColor,
  scrollOffset,
  layer 
}: { 
  x: number; 
  width: number; 
  height: number; 
  color: string;
  windowColor: string;
  scrollOffset: number;
  layer: number;
}) => {
  const speed = layer === 0 ? 0.3 : layer === 1 ? 0.6 : 1;
  const adjustedX = ((x - scrollOffset * speed) % 1200) - 100;
  
  return (
    <g transform={`translate(${adjustedX}, ${300 - height})`}>
      {/* Building body */}
      <rect width={width} height={height} fill={color} />
      
      {/* Windows */}
      {Array.from({ length: Math.floor(height / 25) }).map((_, row) => (
        Array.from({ length: Math.floor(width / 20) }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={8 + col * 18}
            y={10 + row * 22}
            width={10}
            height={14}
            fill={Math.random() > 0.3 ? windowColor : '#1a1a2e'}
            opacity={0.9}
          />
        ))
      ))}
      
      {/* Roof details */}
      {height > 100 && (
        <rect x={width/2 - 5} y={-15} width={10} height={15} fill={color} />
      )}
    </g>
  );
};

// Cloud component
const Cloud = ({ 
  x, 
  y, 
  scale, 
  scrollOffset 
}: { 
  x: number; 
  y: number; 
  scale: number;
  scrollOffset: number;
}) => {
  const adjustedX = ((x - scrollOffset * 0.1) % 1100) - 50;
  
  return (
    <g transform={`translate(${adjustedX}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="50" ry="25" fill="white" opacity="0.95" />
      <ellipse cx="-35" cy="8" rx="35" ry="20" fill="white" opacity="0.95" />
      <ellipse cx="35" cy="8" rx="40" ry="22" fill="white" opacity="0.95" />
      <ellipse cx="0" cy="15" rx="45" ry="18" fill="white" opacity="0.95" />
    </g>
  );
};

// Tree component (round top tree like in reference)
const Tree = ({ 
  x, 
  scrollOffset 
}: { 
  x: number; 
  scrollOffset: number;
}) => {
  const adjustedX = ((x - scrollOffset) % 1200) - 50;
  
  return (
    <g transform={`translate(${adjustedX}, 255)`}>
      {/* Trunk */}
      <rect x="-5" y="20" width="10" height="25" fill="#5D4E37" />
      {/* Foliage (round bush style) */}
      <circle cx="0" cy="5" r="25" fill="#2D5A27" />
      <circle cx="-15" cy="12" r="20" fill="#3D7A35" />
      <circle cx="15" cy="12" r="20" fill="#3D7A35" />
      <circle cx="0" cy="-10" r="18" fill="#4A8B42" />
    </g>
  );
};

// Road component
const Road = ({ scrollOffset }: { scrollOffset: number }) => {
  return (
    <g>
      {/* Main road surface */}
      <rect x="0" y="300" width="100%" height="40" fill="#4A4A4A" />
      
      {/* Road stripes */}
      {Array.from({ length: 30 }).map((_, i) => {
        const stripeX = ((i * 60 - scrollOffset * 2) % 1500) - 60;
        return (
          <rect
            key={i}
            x={stripeX}
            y="318"
            width="40"
            height="5"
            fill="#FFD700"
          />
        );
      })}
      
      {/* Road edges */}
      <rect x="0" y="340" width="100%" height="60" fill="#C4A35A" />
      <rect x="0" y="338" width="100%" height="4" fill="#8B7355" />
    </g>
  );
};

const AviatorBackground3D = ({ isFlying, multiplier }: AviatorBackground3DProps) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Generate buildings for different layers
  const backgroundBuildings = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      x: i * 80 + Math.random() * 30,
      width: 50 + Math.random() * 40,
      height: 120 + Math.random() * 80,
      color: '#1a3a5c',
      windowColor: '#87CEEB',
      layer: 0
    }));
  }, []);

  const midBuildings = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      x: i * 100 + Math.random() * 40,
      width: 60 + Math.random() * 50,
      height: 80 + Math.random() * 100,
      color: '#' + ['E8976E', 'F5DEB3', 'C4A35A', 'E8B87A', 'D4A574'][Math.floor(Math.random() * 5)],
      windowColor: '#87CEEB',
      layer: 1
    }));
  }, []);

  const frontBuildings = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      x: i * 150 + Math.random() * 50,
      width: 80 + Math.random() * 60,
      height: 60 + Math.random() * 80,
      color: '#' + ['D4765C', 'F5E6D3', 'E8C97A', 'D98C5F'][Math.floor(Math.random() * 4)],
      windowColor: '#A8D8EA',
      layer: 2
    }));
  }, []);

  const clouds = useMemo(() => [
    { x: 200, y: 60, scale: 1.5 },
    { x: 500, y: 40, scale: 1 },
    { x: 800, y: 80, scale: 1.2 },
    { x: 1000, y: 50, scale: 0.9 },
    { x: 100, y: 100, scale: 0.8 },
    { x: 650, y: 30, scale: 1.3 },
  ], []);

  const trees = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      x: i * 120 + Math.random() * 60
    }));
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // Only scroll when flying
      if (isFlying) {
        const speed = Math.min(multiplier * 0.8, 8);
        setScrollOffset(prev => prev + speed * deltaTime * 0.05);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFlying, multiplier]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <svg 
        viewBox="0 0 1000 400" 
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="50%" stopColor="#B0E2FF" />
            <stop offset="100%" stopColor="#E0F4FF" />
          </linearGradient>
          
          {/* City silhouette gradient for background */}
          <linearGradient id="citySilhouette" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2C4A6B" />
            <stop offset="100%" stopColor="#1a3a5c" />
          </linearGradient>
        </defs>
        
        {/* Sky background */}
        <rect width="100%" height="100%" fill="url(#skyGradient)" />
        
        {/* Clouds */}
        {clouds.map((cloud, i) => (
          <Cloud 
            key={i} 
            x={cloud.x} 
            y={cloud.y} 
            scale={cloud.scale}
            scrollOffset={scrollOffset}
          />
        ))}
        
        {/* Background city silhouette (far) */}
        {backgroundBuildings.map((building, i) => (
          <Building
            key={`bg-${i}`}
            {...building}
            scrollOffset={scrollOffset}
          />
        ))}
        
        {/* Mid-ground buildings */}
        {midBuildings.map((building, i) => (
          <Building
            key={`mid-${i}`}
            {...building}
            scrollOffset={scrollOffset}
          />
        ))}
        
        {/* Trees */}
        {trees.map((tree, i) => (
          <Tree key={i} x={tree.x} scrollOffset={scrollOffset} />
        ))}
        
        {/* Front buildings */}
        {frontBuildings.map((building, i) => (
          <Building
            key={`front-${i}`}
            {...building}
            scrollOffset={scrollOffset}
          />
        ))}
        
        {/* Road */}
        <Road scrollOffset={scrollOffset} />
      </svg>
    </div>
  );
};

export default AviatorBackground3D;
