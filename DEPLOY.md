# Putting Bryans Arabella online

This guide uses one small Ubuntu server (a VPS), a domain name, and free HTTPS. Shared hosting
that only runs PHP will not work, because the API is Node.js. You need a server where you can
install Node and MySQL.

Below, replace `yourdomain.com` with your real domain.

## 1. Before you start
- A VPS running Ubuntu 22.04 or 24.04 (any provider), with SSH access.
- Your domain's A record pointing at the server's IP address.
- Your real MTN, Telecel and AirtelTigo merchant numbers and account names.

## 2. Install the tools (on the server)
```bash
sudo apt update && sudo apt install -y nginx mysql-server git unzip
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
sudo mysql_secure_installation
```

## 3. Create a database user (do not run the site as MySQL root)
```bash
sudo mysql
```
```sql
CREATE USER 'arabella'@'localhost' IDENTIFIED BY 'choose-a-long-password';
GRANT ALL PRIVILEGES ON bryans_arabella.* TO 'arabella'@'localhost';
GRANT CREATE ON *.* TO 'arabella'@'localhost';
FLUSH PRIVILEGES;
```
(The extra CREATE grant lets `npm run db:setup` create the database once. You can revoke it afterwards.)

## 4. Upload the project and start the API
Copy the project to `/var/www/arabella` (for example with `scp` or `git`), then:
```bash
cd /var/www/arabella/backend
cp .env.example .env
nano .env
```
Set these in `.env`:
```
PORT=4000
PUBLIC_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
DB_USER=arabella
DB_PASSWORD=the-password-from-step-3
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD=a-strong-password-only-you-know
SHIPPING_FEE=30
ORDER_HOLD_HOURS=24
MTN_NUMBER=...        MTN_ACCOUNT_NAME=...
TELECEL_NUMBER=...    TELECEL_ACCOUNT_NAME=...
AIRTELTIGO_NUMBER=... AIRTELTIGO_ACCOUNT_NAME=...
```
Then:
```bash
npm install --omit=dev
npm run db:setup          # creates tables, your admin login and starter categories
pm2 start src/server.js --name arabella-api
pm2 save && pm2 startup   # follow the one command it prints, so the API restarts after a reboot
```

## 4b. Turn on email (recommended)
Email powers password reset, "confirm your email", and order updates. Gmail works for a small shop:
1. In your Google account, turn on **2-Step Verification**.
2. Search "App passwords" in your Google account settings and create one. Copy the 16 letters.
3. In `backend/.env` set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=you@gmail.com
   SMTP_PASS=the-16-letter-app-password
   MAIL_FROM="Bryans Arabella <you@gmail.com>"
   ```
4. `pm2 restart arabella-api`, then register a test customer with an address you can read.
5. Once that email arrives, set `REQUIRE_EMAIL_VERIFICATION=true` if you want customers to confirm their email before ordering, then restart.

A personal Gmail has a daily sending limit and some emails land in spam. If the shop grows, a dedicated email service works with the same settings (use its SMTP details).
Without these settings, no emails are sent and customers cannot reset a forgotten password by email.

## 5. Build the website
Do this on your own computer (or on the server if you prefer):
```bash
cd frontend
echo "VITE_API_URL=https://yourdomain.com" > .env
npm install
npm run build
```
Copy the new `dist/` folder to the server as `/var/www/arabella/frontend/dist`.

## 6. nginx: one domain serves both the site and the API
Create `/etc/nginx/sites-available/arabella`:
```nginx
server {
  server_name yourdomain.com www.yourdomain.com;
  client_max_body_size 25m;                      # product photos and payment screenshots

  root /var/www/arabella/frontend/dist;
  index index.html;

  location /api/ { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host;
                   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                   proxy_set_header X-Forwarded-Proto $scheme; }
  location /uploads/ { proxy_pass http://127.0.0.1:4000; }

  location / { try_files $uri /index.html; }     # lets page refreshes and shared links work
}
```
```bash
sudo ln -s /etc/nginx/sites-available/arabella /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com     # free HTTPS
```

## 7. First-day checklist
1. Open https://yourdomain.com/login and sign in with the admin email and password from `.env`.
2. Add your first bags in Admin, Products.
3. Place a test order with a real customer account and a test screenshot. Approve it in Admin, Orders, then check the customer's inbox received the message.
4. Check the three mobile money numbers shown at checkout are correct.
5. Cancel the test order so the stock goes back.

## 8. Keep it safe
- **Back up** the database and the uploads folder daily:
  ```bash
  mysqldump -u arabella -p bryans_arabella > backup-$(date +%F).sql
  tar czf uploads-$(date +%F).tar.gz /var/www/arabella/backend/uploads
  ```
  Copy those files off the server (to your computer or cloud storage). Payment screenshots are your proof of sales.
- Keep `.env` private. Never put it in a public repository.
- Change the admin password if it was ever shared or sent over chat.
- Update the server now and then: `sudo apt update && sudo apt upgrade`.

## 9. Settings you may want to change later
| What | Where |
|---|---|
| Delivery fee | `SHIPPING_FEE` in `backend/.env`, then `pm2 restart arabella-api` |
| Mobile money numbers | the six `*_NUMBER` / `*_ACCOUNT_NAME` lines, then restart |
| How long unpaid orders are held | `ORDER_HOLD_HOURS` (the Help page text says 24 hours, so update it if you change this) |
| Brand colours | the colour variables at the top of `frontend/src/index.css`, then rebuild |

## Updating the site later
- Backend change: upload the files, run `npm install --omit=dev`, then `pm2 restart arabella-api`.
- Website change: run `npm run build` again and replace the `dist/` folder.

---

# Option B: website on Vercel, backend somewhere else

Vercel hosts the **website** (the `frontend` folder) very well, but it cannot run the **backend**:
the backend needs MySQL and a disk for product photos and payment screenshots. So you need both parts:

1. **The backend online with HTTPS first**, for example on a VPS using steps 1 to 4 of this guide,
   with its own address such as `https://api.yourdomain.com`. A browser will not let an https website
   talk to a plain `http` backend.
   (Just testing? A tunnel tool such as Cloudflare Tunnel or ngrok can give your laptop's backend a
   temporary https address. It stops working when your laptop or the tunnel stops.)
2. In `backend/.env` set, then restart the backend:
   ```
   CLIENT_URL=https://your-project.vercel.app
   PUBLIC_URL=https://api.yourdomain.com
   ```
   `CLIENT_URL` is the website address. It also builds the links in password reset and confirm emails.
   You can list more than one, separated by commas, for example your own domain as well.
3. On your computer, in `frontend/`, create a file named `.env` containing:
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```
4. Build the website: `npm install`, then `npm run build`. This makes a `dist` folder.
5. Drag the **`dist` folder** (not the whole project) into Vercel Drop. It already contains the
   `vercel.json` file that makes page refreshes and shared links work.

Do steps 3 to 5 again whenever you change the website. The address in step 3 is baked in when you build.
