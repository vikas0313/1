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
        className="mx-3 my-2 bg-[var(--accent)] text-[var(--on-accent)] px-4 py-3 rounded-2xl flex items-center justify-between cursor-pointer select-none transition-all duration-150 hover:opacity-95 shadow-sm"
        role="button"
        tabIndex={0}
        aria-label="Tap to enable sound alerts for new orders"
      >
        <div className="flex items-center gap-2.5 font-medium text-[13px] sm:text-[14px]">
          <Bell className="w-4 h-4 shrink-0" />
          <span>Tap to enable order sound alerts</span>
        </div>
        <span className="text-[12px] font-bold bg-[var(--on-accent)] text-[var(--accent)] px-3 py-1 rounded-full shadow-xs">
          Enable
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2.5 text-[13px] flex flex-wrap items-center justify-between gap-3 text-[var(--text-muted)]">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-emerald-50 text-[var(--success)] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          Sound active
        </span>

        <button
          type="button"
          onClick={handleToggleMute}
          className="px-2.5 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors inline-flex items-center gap-1.5 text-[12px]"
          title={settings.muted ? 'Unmute audio' : 'Mute audio'}
        >
          {settings.muted ? <VolumeX className="w-3.5 h-3.5 text-[var(--danger)]" /> : <Volume2 className="w-3.5 h-3.5 text-[var(--accent-ink)]" />}
          <span>{settings.muted ? 'Muted' : 'Sound on'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-[12px] text-[var(--accent-ink)] hover:underline"
        >
          {showConfig ? 'Hide settings' : 'Settings'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleTestAlert}
          className="px-3 py-1 text-[12px] font-medium rounded-full bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors"
        >
          Test alert
        </button>
      </div>

      {showConfig && (
        <div className="w-full pt-2.5 pb-1 flex flex-wrap items-center gap-4 border-t border-[var(--border)] mt-1">
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-[var(--text)]">Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={handleVolumeChange}
              className="w-20 accent-[var(--accent)]"
            />
            <span className="text-[12px] tabular-nums w-8 text-right text-[var(--text)]">{Math.round(settings.volume * 100)}%</span>
          </div>

          {voices.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-[var(--text)]">Voice:</label>
              <select
                value={settings.voiceURI || ''}
                onChange={handleVoiceChange}
                className="text-[12px] bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-3 py-1 text-[var(--text)]"
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

