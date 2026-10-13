import { useState, useCallback, useEffect } from 'react';

const AUDIO_MUTE_STORAGE_KEY = 'ritsu_owner_sound_muted';

export function useAudioAlert() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUDIO_MUTE_STORAGE_KEY) === 'true';
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(AUDIO_MUTE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const playChime = useCallback(() => {
    if (isMuted || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();

      // Play pleasant high chime: 587.33 Hz (D5) -> 880 Hz (A5)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);

      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 700);
    } catch (e) {
      console.warn('Audio alert unavailable', e);
    }
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem(AUDIO_MUTE_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  return { isMuted, toggleMute, playChime };
}
