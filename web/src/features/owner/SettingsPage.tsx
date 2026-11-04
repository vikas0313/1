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
      <div className="border-b border-[var(--border-default)] pb-4">
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
          Restaurant Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] font-serif italic">
          Configure profile details, UPI payments, audio announcements, and administrative credentials.
        </p>
      </div>

      {/* 2. Restaurant Profile & Billing Details Form */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-3">
          <Building2 className="w-4 h-4 text-[var(--gold-ink)]" />
          <h2 className="font-serif text-base font-bold text-[var(--text-primary)]">
            Restaurant Details & Bill Header
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">
                Restaurant Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)]"
                required
              />
            </div>

            <div>
              <label className="block uppercase font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">
                Contact Phone (Shown on party orders link)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)]"
                required
              />
            </div>

            <div>
              <label className="block uppercase font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">
                GSTIN / Tax ID (Printed on receipts)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)]"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">
              Restaurant Address (Printed on receipts)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-ink)]"
            />
          </div>

          <div>
            <label className="block uppercase font-semibold text-[var(--text-secondary)] mb-1 text-[11px]">
              UPI VPA for QR Payments
            </label>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type={showVpa ? 'text' : 'password'}
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--gold-ink)]"
                required
              />
              <button
                type="button"
                onClick={() => setShowVpa(!showVpa)}
                className="p-2 border border-[var(--border-default)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
              loading={savingProfile}
              className="py-2 px-4 text-xs font-semibold tracking-wider uppercase inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </Button>
            {profileSaved && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 3. Audio & Spoken Alerts Settings */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[var(--gold-ink)]" />
            <h2 className="font-serif text-base font-bold text-[var(--text-primary)]">
              Kitchen Spoken Alert Settings
            </h2>
          </div>
          <button
            onClick={handleTestAlert}
            className="px-2.5 py-1 text-xs border border-[var(--border-default)] rounded hover:border-[var(--gold-ink)] hover:text-[var(--gold-ink)] transition-colors"
          >
            Test Alert Sound
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Mute Alerts</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Silence speech and tone alerts when not on kitchen duty.
              </div>
            </div>
            <button
              onClick={() => handleSoundSettingChange({ muted: !soundSettings.muted })}
              className={`px-3 py-1 rounded font-semibold uppercase ${
                soundSettings.muted ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              {soundSettings.muted ? 'Muted' : 'Audible'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Volume ({Math.round(soundSettings.volume * 100)}%)</div>
              <div className="text-[11px] text-[var(--text-muted)]">
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
              className="w-32 accent-[var(--gold-ink)]"
            />
          </div>

          {voices.length > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">Voice Accent</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Preferred SpeechSynthesis voice profile.
                </div>
              </div>
              <select
                value={soundSettings.voiceURI || ''}
                onChange={(e) => handleSoundSettingChange({ voiceURI: e.target.value || undefined })}
                className="text-xs bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded px-2.5 py-1 text-[var(--text-primary)] max-w-xs"
              >
                <option value="">Browser Default Voice</option>
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
              <div className="font-semibold text-[var(--text-primary)]">Repeat Unhandled Orders</div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Repeat reminder tone and speech every 30 seconds until the order is accepted.
              </div>
            </div>
            <button
              onClick={() =>
                handleSoundSettingChange({
                  repeatIntervalSeconds: soundSettings.repeatIntervalSeconds === 0 ? 30 : 0,
                })
              }
              className={`px-3 py-1 rounded font-semibold uppercase ${
                soundSettings.repeatIntervalSeconds > 0
                  ? 'bg-[var(--gold-ink)] text-[var(--bg-canvas)]'
                  : 'bg-zinc-500/10 text-zinc-500'
              }`}
            >
              {soundSettings.repeatIntervalSeconds > 0 ? 'Every 30s' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Security & Password Guide */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3 border-b border-[var(--border-subtle)] pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h2 className="font-serif text-base font-bold text-[var(--text-primary)]">
            Security & Owner Password
          </h2>
        </div>

        <p className="text-xs text-[var(--text-secondary)] mb-4">
          The owner password is protected using salted bcrypt hash in your environment variable <code className="font-mono font-bold">OWNER_PASSWORD_HASH</code>.
          To update your master owner password at any time, run the bundled CLI script in your terminal:
        </p>

        <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded font-mono text-xs flex items-center justify-between">
          <span>npm run hash-password -- "YourNewSecretPassword"</span>
          <Terminal className="w-4 h-4 text-[var(--gold-ink)]" />
        </div>
      </div>
    </div>
  );
};
