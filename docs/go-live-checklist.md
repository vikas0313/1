# Ritsu Food Corner — Go-Live Checklist

Complete every item below before serving your first customer via QR ordering.

---

## 1. Security & Credentials

- [ ] **Generate a real owner password hash:**
  ```bash
  npm run hash-password -- "YourStrongPassword"
  ```
  Copy the output `$2a$10$...` into your `OWNER_PASSWORD_HASH` environment variable.

- [ ] **Set `DEMO_MODE=false`** in your production environment. This disables the `admin123` demo password.

- [ ] **Set a strong `SESSION_SECRET`** — at least 32 random characters.
  ```bash
  openssl rand -hex 32
  ```

---

## 2. Public URL & QR Codes

- [ ] **Set `BASE_URL`** to your real public HTTPS domain:
  - Render: `https://ritsu-food-corner.onrender.com`
  - Fly.io: `https://ritsu-food-corner.fly.dev`
  - Cloudflare Tunnel: `https://order.ritsufoodcorner.com`

- [ ] **Verify the localhost/IP warning is NOT shown** in the Owner Dashboard → Tables & QR page. If the banner appears, your `BASE_URL` is still pointing to a local address.

- [ ] **Generate and print QR cards** for tables T1–T8:
  1. Go to Owner Dashboard → Tables & QR.
  2. Click **"PRINT ALL QR CARDS"** to produce 80mm-width printable cards.
  3. Laminate and place on each table.

---

## 3. Restaurant Profile & Billing

- [ ] **Update restaurant details** in Owner Dashboard → Settings:
  - Restaurant name
  - Tagline
  - Contact phone number (shown on party order call link)
  - Physical address (printed on receipts)
  - GSTIN (printed on tax invoices)

- [ ] **Set your real UPI VPA** in Settings (e.g. `yourname@upi`). This is encoded into customer payment QR codes.

---

## 4. Menu Verification

- [ ] **Confirm all unverified prices** in Owner Dashboard → Menu Manager:
  - Look for amber "Unverified" badges on item variants.
  - Click **"Confirm"** on each after verifying the rate matches your physical menu card.

- [ ] **Confirm momo piece count** — verify whether your standard serving is 6 or 7 pieces.

- [ ] **Confirm biryani and soft drink size labels** — ensure "Single/Full" or "Regular/Large" match your portion sizes.

- [ ] **Toggle off any seasonal or unavailable items** using the availability switch.

---

## 5. Cross-Device Testing

- [ ] **Test an end-to-end order on mobile data:**
  1. Open `https://<BASE_URL>/?table=T1` on a phone using cellular data (not restaurant Wi-Fi).
  2. Enter a customer name and tap "START ORDERING".
  3. Add 2–3 items with different sizes to the cart.
  4. Place the order.
  5. Verify the order appears on the Owner Dashboard within 2 seconds.

- [ ] **Test owner status advancement:**
  1. On the Owner Dashboard, click "Start Cooking" on the new order.
  2. Verify the customer's phone updates from "Pending" to "Preparing" in real-time.
  3. Advance through Ready → Complete.

---

## 6. Kitchen Audio Alerts

- [ ] **Enable sound alerts on the owner device:**
  1. Open the Owner Dashboard on your kitchen tablet or laptop.
  2. Tap the gold **"Tap to enable sound alerts"** banner at the top.
  3. Verify you hear the attention tone and speech synthesis.

- [ ] **Test the spoken alert:**
  1. Click "Test Alert" in the alert settings bar.
  2. You should hear: *"New order. Table 3."*

- [ ] **Test with a real order:**
  1. Place an order from a second phone.
  2. Confirm the owner device speaks the table number automatically.

---

## 7. Receipt Printing

- [ ] **Verify bill prints correctly:**
  1. Complete and mark paid an order.
  2. Open the Bill page from customer tracking.
  3. Click "Print / Save PDF".
  4. Verify clean output on 80mm thermal receipt printer (black text on white, no cut-off margins).
  5. Verify clean output on A4 paper if using a standard printer.

---

## 8. Backup

- [ ] **Download your first database backup:**
  1. Go to Owner Dashboard → Sales.
  2. Click **"DOWNLOAD BACKUP (.DB)"**.
  3. Store the `.db` file safely.

- [ ] **Verify automated backups** are running:
  - In production, the server creates a gzipped backup daily at 02:00 IST.
  - Backups are stored in `DATABASE_PATH/../backups/` and the 14 most recent are retained.

---

## ✅ You're Live!

Once all items above are checked, your restaurant QR ordering system is operational. Customers can scan, browse, order, and track — and you'll hear every order announced the moment it's placed.
