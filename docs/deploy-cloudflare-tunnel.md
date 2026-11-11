# Local Hosting via Cloudflare Tunnel (Free Public HTTPS)

If you prefer to host the entire SQLite database directly on a local restaurant computer (PC, Mac Mini, or Raspberry Pi) without paying for cloud servers, you can expose your local port `3001` to a secure public HTTPS domain using **Cloudflare Tunnel (cloudflared)** for free.

> [!WARNING]
> **Host Dependency Alert:** If the restaurant computer is powered down, goes to sleep, or loses Wi-Fi connection, customer QR codes will stop loading and orders cannot be placed. Keep the host computer plugged in, wake-locked, and running with an auto-restarting background service.

---

## 1. Install `cloudflared`
- **Windows:** Download from [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases) or via winget:
  ```powershell
  winget install --id Cloudflare.cloudflared
  ```
- **Linux / Raspberry Pi:**
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```

---

## 2. Authenticate & Create Tunnel
```bash
# 1. Login to Cloudflare account
cloudflared tunnel login

# 2. Create named tunnel
cloudflared tunnel create ritsu-tunnel

# 3. Route your custom domain (or subdomain)
cloudflared tunnel route dns ritsu-tunnel order.ritsufoodcorner.com
```

---

## 3. Configuration YAML
Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /Users/username/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: order.ritsufoodcorner.com
    service: http://localhost:3001
  - service: http_status:404
```

---

## 4. Run as an Always-On System Service

### On Windows (via NSSM or cloudflared service):
```powershell
cloudflared service install
net start cloudflared
```

### On Linux (systemd):
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 5. Update Local `.env`
Set your public tunnel URL in `.env`:
```env
BASE_URL="https://order.ritsufoodcorner.com"
PORT=3001
```

Now, any QR code generated in the Owner Dashboard will encode your public HTTPS URL, and any customer scanning from mobile data will connect directly to your restaurant server with full real-time SSE syncing!

