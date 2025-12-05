import { useCallback, useRef } from 'react';

export const useGameSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playChipSound = useCallback(() => {
    playTone(800, 0.1, 'square', 0.2);
    setTimeout(() => playTone(1000, 0.08, 'square', 0.15), 50);
  }, [playTone]);

  const playCardSound = useCallback(() => {
    playTone(300, 0.15, 'triangle', 0.3);
    setTimeout(() => playTone(400, 0.1, 'triangle', 0.2), 80);
  }, [playTone]);

  const playTickSound = useCallback(() => {
    playTone(600, 0.05, 'square', 0.1);
  }, [playTone]);

  const playUrgentTickSound = useCallback(() => {
    playTone(900, 0.08, 'square', 0.2);
  }, [playTone]);

  const playWinSound = useCallback(() => {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.3), i * 100);
    });
  }, [playTone]);

  const playTigerRoarSound = useCallback(() => {
    // Tiger roar - low growling sound building up
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const oscillator2 = ctx.createOscillator();
      
      oscillator.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Main roar frequency sweep
      oscillator.frequency.setValueAtTime(80, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
      oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5);
      oscillator.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.8);
      oscillator.type = 'sawtooth';
      
      // Harmonic for growl texture
      oscillator2.frequency.setValueAtTime(160, ctx.currentTime);
      oscillator2.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.2);
      oscillator2.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);
      oscillator2.type = 'triangle';
      
      // Volume envelope - builds up then fades
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      oscillator.start(ctx.currentTime);
      oscillator2.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
      oscillator2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playDragonRoarSound = useCallback(() => {
    // Dragon roar - deeper, more rumbling
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const oscillator2 = ctx.createOscillator();
      
      oscillator.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Deep rumbling frequency
      oscillator.frequency.setValueAtTime(50, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.3);
      oscillator.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.6);
      oscillator.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1.0);
      oscillator.type = 'sawtooth';
      
      // Fire crackle overlay
      oscillator2.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator2.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
      oscillator2.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.8);
      oscillator2.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.6);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      
      oscillator.start(ctx.currentTime);
      oscillator2.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.0);
      oscillator2.stop(ctx.currentTime + 1.0);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playLoseSound = useCallback(() => {
    playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.15), 200);
  }, [playTone]);

  const playCrashSound = useCallback(() => {
    // Explosion/crash sound
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playFlyingSound = useCallback(() => {
    playTone(800, 0.05, 'sine', 0.1);
  }, [playTone]);

  const playDealingSound = useCallback(() => {
    playTone(500, 0.1, 'triangle', 0.2);
  }, [playTone]);

  return {
    playChipSound,
    playCardSound,
    playTickSound,
    playUrgentTickSound,
    playWinSound,
    playTigerRoarSound,
    playDragonRoarSound,
    playLoseSound,
    playCrashSound,
    playFlyingSound,
    playDealingSound
  };
};
