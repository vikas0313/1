import React, { useState, useEffect } from 'react';
import { alertService, AlertSettings } from '../services/AlertService.js';
import { Volume2, VolumeX, Bell } from 'lucide-react';

interface AlertBannerProps {
  onUnlock?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ onUnlock }) => {
  const [isUnlocked, setIsUnlocked] = useState(alertService.isUnlocked);
  const [settings, setSettings] = useState<AlertSettings>(alertService.getSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const handleVoiceChange = () => {
      setVoices(alertService.getVoices());
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = handleVoiceChange;
      handleVoiceChange();
    }
  }, []);

  const handleUnlockClick = async () => {
    const success = await alertService.unlock();
    if (success) {
      setIsUnlocked(true);
      // Ask for browser notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
      if (onUnlock) onUnlock();
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !settings.muted;
    const updated = { ...settings, muted: newMuted };
    setSettings(updated);
    alertService.updateSettings({ muted: newMuted });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const updated = { ...settings, volume: val };
    setSettings(updated);
    alertService.updateSettings({ volume: val });
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    const updated = { ...settings, voiceURI: uri || undefined };
    setSettings(updated);
    alertService.updateSettings({ voiceURI: uri || undefined });
  };

  const handleTestAlert = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await alertService.playAttentionTone();
    await alertService.speakText('New order. Table 3.');
  };

  if (!isUnlocked) {
    return (
      <div
        onClick={handleUnlockClick}
        className="w-full bg-[var(--gold-ink)] text-[var(--bg-canvas)] px-4 py-2.5 flex items-center justify-between cursor-pointer select-none transition-all duration-200 hover:brightness-105 shadow-md"
        role="button"
        tabIndex={0}
        aria-label="Tap to enable sound alerts for new orders"
      >
        <div className="flex items-center gap-2.5 font-medium text-xs sm:text-sm">
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Tap to enable sound alerts for new orders (browser audio requirement)</span>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider underline underline-offset-2">
          Enable Audio
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-[var(--text-secondary)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Sound Active
        </span>

        <button
          onClick={handleToggleMute}
          className="p-1 rounded hover:bg-[var(--bg-card)] text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
          title={settings.muted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {settings.muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[var(--gold-ink)]" />}
          <span>{settings.muted ? 'Muted' : 'Unmuted'}</span>
        </button>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-[11px] underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {showConfig ? 'Hide sound settings' : 'Audio settings'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleTestAlert}
          className="px-2.5 py-1 text-[11px] rounded border border-[var(--border-default)] hover:border-[var(--gold-ink)] hover:text-[var(--gold-ink)] transition-colors"
        >
          Test Alert
        </button>
      </div>

      {showConfig && (
        <div className="w-full pt-2 pb-1 flex flex-wrap items-center gap-4 border-t border-[var(--border-subtle)] mt-1">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-[var(--text-secondary)]">Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={handleVolumeChange}
              className="w-20 accent-[var(--gold-ink)]"
            />
            <span className="text-[10px] w-6 text-right">{Math.round(settings.volume * 100)}%</span>
          </div>

          {voices.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">Voice:</label>
              <select
                value={settings.voiceURI || ''}
                onChange={handleVoiceChange}
                className="text-[11px] bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-2 py-0.5 text-[var(--text-primary)]"
              >
                <option value="">Default voice</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
