import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Production Bundle Security Check', () => {
  it('does not contain demo password "admin123" in production build assets when VITE_DATA_BACKEND=supabase', () => {
    // Build project with VITE_DATA_BACKEND=supabase and empty demo password
    execSync('cmd /c "set PATH=C:\\Program Files\\nodejs;%PATH% && set VITE_DATA_BACKEND=supabase && set VITE_DEMO_OWNER_PASSWORD= && npx vite build"', {
      cwd: path.resolve('.'),
    });

    const distDir = path.resolve('dist/assets');
    const files = fs.readdirSync(distDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));

    expect(jsFiles.length).toBeGreaterThan(0);

    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(distDir, file), 'utf-8');
      // Verify admin123 is completely stripped out
      expect(content.includes('admin123')).toBe(false);
    }
  });
});
