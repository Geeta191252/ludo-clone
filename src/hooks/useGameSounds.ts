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

  const playLoseSound = useCallback(() => {
    playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.15), 200);
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
    playLoseSound,
    playDealingSound
  };
};
