import React, { useState, useEffect } from 'react';
import { alertService, AlertSettings } from '../../services/AlertService.js';
import { Button } from '../../components/Button.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { 
  Building2, 
  Volume2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  Check, 
  Terminal 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  // Restaurant Profile
  const [name, setName] = useState('Ritsu Food Corner');
  const [tagline, setTagline] = useState('Indo-Chinese ka asli maza – Ristsu ke saath!');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Main Road, Near Food Square, Hyderabad');
  const [gstin, setGstin] = useState('36ABCDE1234F1Z5');
  const [upiVpa, setUpiVpa] = useState('ritsu@upi');
  const [showVpa, setShowVpa] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Audio Alerts Settings
  const [soundSettings, setSoundSettings] = useState<AlertSettings>(alertService.getSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // 1. Fetch current restaurant settings
    fetch('/api/owner/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.name) setName(data.name);
          if (data.tagline) setTagline(data.tagline);
          if (data.phone) setPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.gstin) setGstin(data.gstin);
          if (data.upi_vpa) setUpiVpa(data.upi_vpa);
        }
      })
      .catch(() => {});

    // 2. Fetch voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => setVoices(alertService.getVoices());
      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);

    try {
      const res = await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          phone,
          address,
          gstin,
          upi_vpa: upiVpa,
        }),
      });

      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSoundSettingChange = (updates: Partial<AlertSettings>) => {
    const updated = { ...soundSettings, ...updates };
    setSoundSettings(updated);
    alertService.updateSettings(updates);
  };

  const handleTestAlert = async () => {
    await alertService.playAttentionTone();
    await alertService.speakText('New order. Table 3.');
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* 1. Header */}
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-[22px] sm:text-[24px] font-bold text-[var(--text)]">
          Restaurant settings
        </h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
          Configure profile details, UPI payments, audio announcements, theme, and security.
        </p>
      </div>

      {/* 2. Restaurant Profile & Billing Details Form */}
      <div className="warm-card p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-5 border-b border-[var(--border)] pb-3">
          <Building2 className="w-5 h-5 text-[var(--accent-ink)]" />
          <h2 className="text-[16px] font-bold text-[var(--text)]">
            Restaurant details and bill header
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--text)] mb-1.5 text-[12px]">
                Restaurant name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="touch-target w-full px-4 h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text)] mb-1.5 text-[12px]">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="touch-target w-full px-4 h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--text)] mb-1.5 text-[12px]">
                Contact phone (party orders link)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="touch-target w-full px-4 h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text)] mb-1.5 text-[12px]">
                GSTIN / Tax ID (Printed on receipts)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="touch-target w-full px-4 h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--text)] mb-1.5 text-[12px]">
              Restaurant address (Printed on receipts)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="touch-target w-full px-4 h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text)] mb-1.5 text-[12px]">
              UPI VPA for QR payments
            </label>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type={showVpa ? 'text' : 'password'}
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="touch-target flex-1 px-4 h-11 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text)] font-mono focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowVpa(!showVpa)}
                className="touch-target w-11 h-11 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                title={showVpa ? 'Mask VPA' : 'Show VPA'}
              >
                {showVpa ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingProfile}
              className="font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save profile</span>
            </Button>
            {profileSaved && (
              <span className="text-[var(--success)] font-semibold inline-flex items-center gap-1 text-[13px]">
                <Check className="w-4 h-4" />
                Saved successfully
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 3. Audio & Spoken Alerts Settings */}
      <div className="warm-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-[var(--accent-ink)]" />
            <h2 className="text-[16px] font-bold text-[var(--text)]">
              Kitchen spoken alert settings
            </h2>
          </div>
          <button
            onClick={handleTestAlert}
            className="touch-target px-4 h-10 text-[12px] font-medium border border-[var(--border)] rounded-full hover:border-[var(--accent)] hover:text-[var(--accent-ink)] transition-colors"
          >
            Test alert sound
          </button>
        </div>

        <div className="space-y-4 text-[13px]">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]/50">
            <div>
              <div className="font-semibold text-[var(--text)]">Mute alerts</div>
              <div className="text-[12px] text-[var(--text-muted)]">
                Silence speech and tone alerts when not on kitchen duty.
              </div>
            </div>
            <button
              onClick={() => handleSoundSettingChange({ muted: !soundSettings.muted })}
              className={`touch-target px-3.5 py-1.5 rounded-full font-semibold text-[12px] transition-all ${
                soundSettings.muted
                  ? 'bg-red-50 text-[var(--danger)] border border-red-200 dark:bg-red-950/40'
                  : 'bg-emerald-50 text-[var(--success)] border border-emerald-200 dark:bg-emerald-950/40'
              }`}
            >
              {soundSettings.muted ? 'Muted' : 'Audible'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]/50">
            <div>
              <div className="font-semibold text-[var(--text)]">Volume ({Math.round(soundSettings.volume * 100)}%)</div>
              <div className="text-[12px] text-[var(--text-muted)]">
                Output volume for speech synthesis and attention tone.
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundSettings.volume}
              onChange={(e) => handleSoundSettingChange({ volume: parseFloat(e.target.value) })}
              className="w-32 accent-[var(--accent)]"
            />
          </div>

          {voices.length > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-[var(--border)]/50">
              <div>
                <div className="font-semibold text-[var(--text)]">Voice accent</div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  Speech synthesis voice profile.
                </div>
              </div>
              <select
                value={soundSettings.voiceURI || ''}
                onChange={(e) => handleSoundSettingChange({ voiceURI: e.target.value || undefined })}
                className="touch-target text-[12px] bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-3 py-1.5 text-[var(--text)] max-w-xs focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">Browser default voice</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-[var(--text)]">Repeat unhandled orders</div>
              <div className="text-[12px] text-[var(--text-muted)]">
                Repeat reminder tone and speech every 30 seconds until the order is accepted.
              </div>
            </div>
            <button
              onClick={() =>
                handleSoundSettingChange({
                  repeatIntervalSeconds: soundSettings.repeatIntervalSeconds === 0 ? 30 : 0,
                })
              }
              className={`touch-target px-3.5 py-1.5 rounded-full font-semibold text-[12px] transition-all ${
                soundSettings.repeatIntervalSeconds > 0
                  ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}
            >
              {soundSettings.repeatIntervalSeconds > 0 ? 'Every 30s' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Security & Password Guide */}
      <div className="warm-card p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 border-b border-[var(--border)] pb-3">
          <ShieldCheck className="w-5 h-5 text-[var(--success)]" />
          <h2 className="text-[16px] font-bold text-[var(--text)]">
            Security & owner password
          </h2>
        </div>

        <p className="text-[13px] text-[var(--text-muted)] mb-4 leading-relaxed">
          The owner password is protected using salted bcrypt hash in your environment variable <code className="font-mono font-bold bg-[var(--surface-2)] px-1.5 py-0.5 rounded-full">OWNER_PASSWORD_HASH</code>.
          To update your master owner password at any time, run the bundled CLI script in your terminal:
        </p>

        <div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl font-mono text-[13px] flex items-center justify-between">
          <span>npm run hash-password -- "YourNewSecretPassword"</span>
          <Terminal className="w-4 h-4 text-[var(--accent-ink)]" />
        </div>
      </div>
    </div>
  );
};

