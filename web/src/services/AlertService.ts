// Web Audio & Speech Synthesis Alert Service for Ritsu Food Corner

export interface AlertOrder {
  id: string;
  table_label: string;
}

export interface AlertSettings {
  muted: boolean;
  volume: number; // 0 to 1
  voiceURI?: string;
  repeatIntervalSeconds: number; // 0 = off, 30 = repeat every 30s
}

const STORAGE_KEY = 'ritsu-alert-settings';

export class AlertService {
  private static instance: AlertService;
  private audioContext: AudioContext | null = null;
  private queue: AlertOrder[] = [];
  private isProcessing = false;
  private seenOrderIds = new Set<string>();
  private activePendingOrders = new Map<string, AlertOrder>();
  private repeatTimer: any = null;
  private wakeLock: any = null;

  public isUnlocked = false;

  private settings: AlertSettings = {
    muted: false,
    volume: 0.9,
    repeatIntervalSeconds: 0,
  };

  private constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.wakeLock !== null) {
          this.requestWakeLock();
        }
      });

      // Auto-unlock audio engine on the first user interaction anywhere
      const autoUnlock = () => {
        if (!this.isUnlocked) {
          this.unlock().catch(() => {});
        }
      };
      window.addEventListener('click', autoUnlock, { passive: true });
      window.addEventListener('touchstart', autoUnlock, { passive: true });
      window.addEventListener('pointerdown', autoUnlock, { passive: true });
      window.addEventListener('keydown', autoUnlock, { passive: true });
    }
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private loadSettings(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.settings = { ...this.settings, ...JSON.parse(raw) };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  public saveSettings(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      // ignore
    }
  }

  public getSettings(): AlertSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<AlertSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.restartRepeatTimer();
  }

  public async ensureAudioContext(): Promise<AudioContext | null> {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  public async unlock(ctx?: AudioContext): Promise<boolean> {
    try {
      const audioCtx = ctx || (await this.ensureAudioContext());
      if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
      }

      // Unlock speechSynthesis with a silent utterance
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }

      this.isUnlocked = true;
      await this.requestWakeLock();
      return true;
    } catch (e) {
      console.warn('AudioContext unlock failed:', e);
      return false;
    }
  }

  private async requestWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch (e) {
      // Screen wake lock not permitted or supported
    }
  }

  public enqueue(order: AlertOrder): boolean {
    if (!order || !order.id) return false;

    // Deduplication check: if order was already announced, skip
    if (this.seenOrderIds.has(order.id)) {
      return false;
    }

    this.seenOrderIds.add(order.id);
    this.activePendingOrders.set(order.id, order);
    this.queue.push(order);

    this.processQueue();
    this.restartRepeatTimer();
    return true;
  }

  public markOrderAdvanced(orderId: string): void {
    this.activePendingOrders.delete(orderId);
    if (this.activePendingOrders.size === 0 && this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
  }

  public clearQueue(): void {
    this.queue = [];
    this.isProcessing = false;
  }

  public resetSeen(): void {
    this.seenOrderIds.clear();
    this.activePendingOrders.clear();
    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }
  }

  private restartRepeatTimer(): void {
    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }

    if (this.settings.repeatIntervalSeconds > 0 && this.activePendingOrders.size > 0) {
      this.repeatTimer = setInterval(() => {
        // Re-enqueue active pending orders for repeated reminder
        for (const order of this.activePendingOrders.values()) {
          this.playAttentionTone();
          this.speakText(`Reminder. Unhandled order, ${this.formatTableSpeech(order.table_label)}`);
        }
      }, this.settings.repeatIntervalSeconds * 1000);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const order = this.queue.shift();
      if (order) {
        await this.announceOrder(order);
      }
    }

    this.isProcessing = false;
  }

  public formatTableSpeech(tableLabel: string): string {
    const cleaned = (tableLabel || '').trim();
    if (!cleaned) return 'Table';
    if (/^table\b/i.test(cleaned)) {
      return cleaned;
    }
    const match = cleaned.match(/^(?:T\s*[-_]?\s*)?(\d+)$/i);
    if (match) {
      return `Table ${match[1]}`;
    }
    return `Table ${cleaned}`;
  }

  public async announceOrder(order: AlertOrder): Promise<void> {
    if (this.settings.muted) return;

    // 1. Attention Tone
    await this.playAttentionTone();

    // 2. Speech announcement: "New order. Table {n}."
    const tableText = this.formatTableSpeech(order.table_label);
    const speechMessage = `New order. ${tableText}.`;

    const speechSuccess = await this.speakText(speechMessage);
    if (!speechSuccess) {
      // Fallback: 3 beeps pattern
      await this.playFallbackBeeps();
    }
  }

  public async playAttentionTone(): Promise<void> {
    if (this.settings.muted) return;
    try {
      const ctx = await this.ensureAudioContext();
      if (!ctx || ctx.state !== 'running') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      const targetVol = Math.max(0.18, this.settings.volume * 0.45);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      await new Promise((resolve) => setTimeout(resolve, 320));
    } catch (e) {
      // ignore
    }
  }

  public async playFallbackBeeps(): Promise<void> {
    if (this.settings.muted) return;
    try {
      const ctx = await this.ensureAudioContext();
      if (!ctx || ctx.state !== 'running') return;

      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);

        const targetVol = Math.max(0.15, this.settings.volume * 0.3);
        gain.gain.setValueAtTime(targetVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (e) {
      // ignore
    }
  }

  public speakText(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return resolve(false);
      }

      try {
        // Cancel pending utterances to prevent Chrome audio hang
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = Math.max(0.5, this.settings.volume);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        if (this.settings.voiceURI) {
          const voice = voices.find((v) => v.voiceURI === this.settings.voiceURI);
          if (voice) {
            utterance.voice = voice;
          }
        } else if (voices.length > 0) {
          // Prefer a clear English voice
          const enVoice =
            voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Samantha'))) ||
            voices.find((v) => v.lang.startsWith('en'));
          if (enVoice) {
            utterance.voice = enVoice;
          }
        }

        let finished = false;
        utterance.onend = () => {
          if (!finished) {
            finished = true;
            resolve(true);
          }
        };

        utterance.onerror = (e) => {
          console.warn('speechSynthesis error', e);
          if (!finished) {
            finished = true;
            resolve(false);
          }
        };

        window.speechSynthesis.speak(utterance);

        // Resume if suspended (common Chrome issue)
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Safety timeout in case speechSynthesis hangs
        setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve(true);
          }
        }, 4000);
      } catch (e) {
        resolve(false);
      }
    });
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }
}

export const alertService = AlertService.getInstance();

