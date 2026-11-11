import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { config } from '../config.js';

export class BackupService {
  private static instance: BackupService;
  private intervalHandle: any = null;

  private constructor() {}

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  public startDailyScheduler(): void {
    if (this.intervalHandle) return;

    // Check once per hour if it's 02:00 AM IST (Asia/Kolkata)
    this.intervalHandle = setInterval(() => {
      this.checkAndRunScheduledBackup();
    }, 60 * 60 * 1000);

    // Initial check on startup
    setTimeout(() => {
      this.checkAndRunScheduledBackup();
    }, 10000);
  }

  public checkAndRunScheduledBackup(): void {
    try {
      const now = new Date();
      // Format current hour in Asia/Kolkata
      const istTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
      });

      const currentHour = parseInt(istTimeStr, 10);
      // Run if hour is 2 AM
      if (currentHour === 2) {
        this.createCompressedBackup();
      }
    } catch (e) {
      console.error('[BackupService] Scheduler check error:', e);
    }
  }

  public createCompressedBackup(): string | null {
    try {
      const dbPath = path.isAbsolute(config.DATABASE_PATH)
        ? config.DATABASE_PATH
        : path.resolve(process.cwd(), config.DATABASE_PATH);

      if (!fs.existsSync(dbPath)) {
        console.warn(`[BackupService] Database file not found at ${dbPath}`);
        return null;
      }

      const backupDir = path.resolve(path.dirname(dbPath), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const backupPath = path.join(backupDir, `ritsu-${dateStr}.db.gz`);

      // Read db file, gzip compress, and write to disk
      const dbBuffer = fs.readFileSync(dbPath);
      const gzipped = zlib.gzipSync(dbBuffer);
      fs.writeFileSync(backupPath, gzipped);

      console.log(`[BackupService] Successfully created backup at ${backupPath} (${Math.round(gzipped.length / 1024)} KB)`);

      // Prune old backups: keep last 14
      this.pruneOldBackups(backupDir, 14);

      return backupPath;
    } catch (err) {
      console.error('[BackupService] Backup creation failed:', err);
      return null;
    }
  }

  private pruneOldBackups(backupDir: string, maxKeep: number): void {
    try {
      const files = fs.readdirSync(backupDir)
        .filter((f) => f.startsWith('ritsu-') && f.endsWith('.db.gz'))
        .map((f) => ({
          name: f,
          path: path.join(backupDir, f),
          time: fs.statSync(path.join(backupDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > maxKeep) {
        const toDelete = files.slice(maxKeep);
        for (const file of toDelete) {
          fs.unlinkSync(file.path);
          console.log(`[BackupService] Pruned old backup: ${file.name}`);
        }
      }
    } catch (e) {
      console.warn('[BackupService] Prune error:', e);
    }
  }
}

export const backupService = BackupService.getInstance();

