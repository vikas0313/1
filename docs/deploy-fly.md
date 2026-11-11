# Deploying Ritsu Food Corner to Fly.io

Fly.io provides ultra-fast Docker hosting with global persistent volumes, perfect for running **Ritsu Food Corner** close to your restaurant location with real-time SQLite sync.

---

## 1. Prerequisites
- Install Fly CLI: `curl -L https://fly.io/install.sh | sh` (or `pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"` on Windows).
- Authenticate: `fly auth login`.

---

## 2. Create App & Persistent Volume
```bash
# 1. Initialize app
fly launch --no-deploy

# 2. Create persistent volume for SQLite (1 GB in Singapore region or chosen region)
fly volumes create ritsu_data --size 1 --region sin
```

---

## 3. Set Production Secrets
```bash
fly secrets set \
  OWNER_PASSWORD_HASH="<your_bcrypt_hash>" \
  BASE_URL="https://ritsu-food-corner.fly.dev" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  DEMO_MODE="false"
```

---

## 4. Deploy
```bash
fly deploy
```

Fly will build the container, attach the `ritsu_data` persistent volume at `/data`, and start the service with live health checks.

