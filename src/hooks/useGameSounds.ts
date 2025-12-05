import { useCallback, useRef } from 'react';

export const useGameSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Chip/coin sound - casino style
  const playChipSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.frequency.value = 2500;
      osc2.frequency.value = 3200;
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }, [getAudioContext]);

  // Card flip sound
  const playCardSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }
      
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      source.buffer = buffer;
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      source.start(ctx.currentTime);
    } catch (e) {}
  }, [getAudioContext]);

  // Tick sound
  const playTickSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 800;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }, [getAudioContext]);

  // Urgent tick - faster, higher pitch
  const playUrgentTickSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 1200;
      osc.type = 'square';
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [getAudioContext]);

  // Win celebration sound
  const playWinSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const notes = [523, 659, 784, 880, 1047];
      
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.frequency.value = freq;
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
        }, i * 80);
      });
    } catch (e) {}
  }, [getAudioContext]);

  // Tiger roar - growling aggressive sound
  const playTigerRoarSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.6);
      
      osc1.frequency.setValueAtTime(100, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.15);
      osc1.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.6);
      osc1.type = 'sawtooth';
      
      osc2.frequency.setValueAtTime(150, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.15);
      osc2.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.6);
      osc2.type = 'triangle';
      
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  }, [getAudioContext]);

  // Dragon roar - deeper, rumbling
  const playDragonRoarSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.8);
      
      osc1.frequency.setValueAtTime(60, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.2);
      osc1.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.8);
      osc1.type = 'sawtooth';
      
      osc2.frequency.setValueAtTime(90, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);
      osc2.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.8);
      osc2.type = 'square';
      
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {}
  }, [getAudioContext]);

  // Lose sound - sad descending
  const playLoseSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, [getAudioContext]);

  // Crash/explosion sound
  const playCrashSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Noise burst for explosion
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      source.start(ctx.currentTime);
      
      // Bass thump
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);
      osc.type = 'sine';
      
      oscGain.gain.setValueAtTime(0.4, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }, [getAudioContext]);

  // Engine/flying sound
  const playFlyingSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      filter.type = 'bandpass';
      filter.frequency.value = 200 + Math.random() * 100;
      filter.Q.value = 5;
      
      osc.frequency.value = 80 + Math.random() * 40;
      osc.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }, [getAudioContext]);

  // Takeoff whoosh
  const playTakeoffSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Whoosh noise
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.5;
      }
      
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.4);
      filter.Q.value = 2;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      
      source.start(ctx.currentTime);
      
      // Engine buildup
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
      osc.type = 'sawtooth';
      
      oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }, [getAudioContext]);

  // Countdown beep
  const playCountdownBeep = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 880;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }, [getAudioContext]);

  // Dealing sound
  const playDealingSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 600;
      osc.type = 'triangle';
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [getAudioContext]);

  // Continuous engine sound - returns stop function
  const engineNodesRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null>(null);
  
  const startEngineSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Stop any existing engine sound
      if (engineNodesRef.current) {
        try {
          engineNodesRef.current.gain.gain.setValueAtTime(0, ctx.currentTime);
          engineNodesRef.current.osc1.stop();
          engineNodesRef.current.osc2.stop();
        } catch (e) {}
      }
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      // Engine rumble
      osc1.frequency.value = 80;
      osc1.type = 'sawtooth';
      
      // Higher harmonic
      osc2.frequency.value = 160;
      osc2.type = 'triangle';
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      
      engineNodesRef.current = { osc1, osc2, gain };
      
      // Modulate engine sound for realism
      const modulateEngine = () => {
        if (engineNodesRef.current && ctx.state === 'running') {
          const variation = Math.random() * 20 - 10;
          osc1.frequency.setValueAtTime(80 + variation, ctx.currentTime);
          osc2.frequency.setValueAtTime(160 + variation * 2, ctx.currentTime);
        }
      };
      
      const modulationInterval = setInterval(modulateEngine, 100);
      
      return () => {
        clearInterval(modulationInterval);
      };
    } catch (e) {
      return () => {};
    }
  }, [getAudioContext]);
  
  const stopEngineSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (engineNodesRef.current) {
        engineNodesRef.current.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            engineNodesRef.current?.osc1.stop();
            engineNodesRef.current?.osc2.stop();
            engineNodesRef.current = null;
          } catch (e) {}
        }, 150);
      }
    } catch (e) {}
  }, [getAudioContext]);

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
    playTakeoffSound,
    playCountdownBeep,
    playDealingSound,
    startEngineSound,
    stopEngineSound
  };
};
