# Production Deployment Guide - CloudPanel VPS

## Overview
- **Main Domain:** www.chilloutfox.com (Dashboard + Blog)
- **Console Subdomain:** console.chilloutfox.com (Admin Panel)
- **Backend API:** Port 8001 (Internal, proxied through nginx)
- **Frontend:** Port 3001 (Docker exposed, reverse proxied to port 80)
- **Console:** Port 3002 (Docker exposed, reverse proxied to port 80)

---

## 1. SERVER SETUP (Before Docker)

### Step 1: SSH into your VPS
```bash
ssh root@your-vps-ip
```

### Step 2: Install Docker & Docker Compose
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose v1 (using Python)
apt-get install -y docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Create application directory
```bash
mkdir -p /opt/trade-analyzer
cd /opt/trade-analyzer
```

### Step 4: Clone/copy your code
```bash
# If using git
git clone <your-repo> .
git checkout stable-pnl-dashboard-v2

# Or copy files from local machine
scp -r /path/to/trade_analyzer/* root@your-vps-ip:/opt/trade-analyzer/
```

---

## 2. ENVIRONMENT VARIABLES (.env file)

Create `.env` file in `/opt/trade-analyzer/`:

```env
# Backend Configuration
JWT_SECRET=your-secret-key-here-minimum-32-characters
JWT_EXPIRY_HOURS=168
GOOGLE_CLIENT_ID=your-google-oauth-client-id
CORS_ORIGINS=https://www.chilloutfox.com,https://console.chilloutfox.com
ADMIN_EMAILS=your-email@example.com,admin@example.com

# Frontend Configuration
VITE_API_BASE_URL=/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Port Configuration
FRONTEND_PORT=3001
CONSOLE_PORT=3002
```

**Important Environment Variables:**
- `JWT_SECRET`: Generate with `openssl rand -hex 32`
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `CORS_ORIGINS`: Your production domains
- `ADMIN_EMAILS`: Comma-separated admin email addresses

---

## 3. CLOUDPANEL PORT CONFIGURATION

### In CloudPanel Admin Panel:

#### Step 1: Add Firewall Rules
```
Go to: Settings → Firewall → Incoming Rules

Add these ports:
- Port: 22 (SSH) - Already open
- Port: 80 (HTTP)
- Port: 443 (HTTPS)
- Port: 3001 (Frontend Docker)
- Port: 3002 (Console Docker)
- Port: 8001 (Backend Docker) - Internal only
```

#### Step 2: Create Vhosts (Virtual Hosts)

**For www.chilloutfox.com:**
```
Domain: www.chilloutfox.com
Root Directory: /opt/trade-analyzer/frontend/dist
Document Root: /opt/trade-analyzer/frontend/dist
Enable SSL: Yes (Let's Encrypt)
Proxy Settings:
  - Enable Proxy: Yes
  - Proxy Pass: http://localhost:3001
  - Proxy Pass Reverse: http://localhost:3001
```

**For console.chilloutfox.com:**
```
Domain: console.chilloutfox.com
Root Directory: /opt/trade-analyzer/console/dist
Document Root: /opt/trade-analyzer/console/dist
Enable SSL: Yes (Let's Encrypt)
Proxy Settings:
  - Enable Proxy: Yes
  - Proxy Pass: http://localhost:3002
  - Proxy Pass Reverse: http://localhost:3002
```

---

## 4. DNS CONFIGURATION

In your domain registrar (GoDaddy, Namecheap, etc.):

```
Type: A Record
Name: www
Value: your-vps-ip

Type: A Record
Name: console
Value: your-vps-ip

Type: A Record
Name: @ (root)
Value: your-vps-ip
```

Allow 24 hours for DNS propagation.

---

## 5. DEPLOYMENT COMMANDS

### SSH into VPS and run:

```bash
cd /opt/trade-analyzer

# 1. Create .env file (edit with your values)
nano .env

# 2. Build Docker images
docker-compose build --no-cache backend frontend console

# 3. Start services
docker-compose up -d

# 4. Verify services are running
docker-compose ps

# 5. Check logs
docker-compose logs -f
```

### Output should show:
```
NAME                      IMAGE                     STATUS
trade-analyzer-backend    trade_analyzer-backend    Up (healthy)
trade-analyzer-frontend   trade_analyzer-frontend   Up (healthy)
trade-analyzer-console    trade_analyzer-console    Up (healthy)
```

---

## 6. NGINX CONFIGURATION (Auto-handled by CloudPanel)

CloudPanel automatically generates nginx configs. However, you may need to adjust:

**Location:** `/etc/nginx/sites-available/www.chilloutfox.com`

Key settings:
```nginx
# Proxy to Docker container
location / {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}

# API proxy to backend
location /api/ {
    proxy_pass http://localhost:8001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}
```

---

## 7. SSL/HTTPS SETUP (CloudPanel)

### Automatic Setup:
1. In CloudPanel: Go to your vhost
2. Click "SSL" → "Let's Encrypt"
3. Add domains: `www.chilloutfox.com`, `console.chilloutfox.com`
4. Auto-renewal is enabled

### Verify SSL:
```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/www.chilloutfox.com/cert.pem -noout -dates

# Test SSL (should return A+)
curl -I https://www.chilloutfox.com
```

---

## 8. DATA PERSISTENCE

Database and uploaded files are stored in Docker volumes:

```bash
# View volumes
docker volume ls

# Backup data
docker run --rm -v auth_data:/data -v /backup:/backup \
  alpine tar czf /backup/auth_data_backup.tar.gz -C /data .

# View database
docker exec trade-analyzer-backend ls -lh /app/data/
```

---

## 9. MONITORING & LOGS

### View Docker logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail 100 backend
```

### Health checks:
```bash
# Backend health
curl http://localhost:8001/health

# Frontend health
curl http://localhost:3001/

# Console health
curl http://localhost:3002/
```

---

## 10. COMMON TASKS

### Restart services:
```bash
docker-compose restart
```

### Update code (git):
```bash
cd /opt/trade-analyzer
git pull origin stable-pnl-dashboard-v2
docker-compose build --no-cache backend frontend console
docker-compose up -d
```

### Rebuild specific service:
```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### View running containers:
```bash
docker-compose ps
docker ps -a
```

### Stop services:
```bash
docker-compose down
```

### Rebuild and restart everything:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 11. PRODUCTION CHECKLIST

- [ ] VPS with minimum 2GB RAM, 20GB SSD
- [ ] Docker and Docker Compose installed
- [ ] `.env` file created with secure values
- [ ] Firewall rules configured (ports 22, 80, 443)
- [ ] DNS records pointing to VPS IP
- [ ] CloudPanel vhosts created for both domains
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] Docker images built
- [ ] Services running and healthy
- [ ] Test login: https://www.chilloutfox.com
- [ ] Test admin: https://console.chilloutfox.com
- [ ] Test blog: https://www.chilloutfox.com/blog
- [ ] Check backend health: curl https://www.chilloutfox.com/api/health
- [ ] Verify sample data loads on sign-in
- [ ] Monitor logs for errors

---

## 12. TROUBLESHOOTING

### Services not starting:
```bash
docker-compose logs -f
# Check for missing environment variables
```

### Backend import error:
```bash
# Make sure backend/blog.py exists locally before deployment
docker-compose build --no-cache backend
```

### Port already in use:
```bash
# Check what's using the port
netstat -tulpn | grep :3001

# Change port in docker-compose.yml or .env
FRONTEND_PORT=3003
```

### SSL certificate issues:
```bash
# Renew certificate manually
certbot renew --force-renewal

# Check certificate
certbot certificates
```

### Database issues:
```bash
# Reset database (WARNING: loses data)
docker volume rm auth_data
docker-compose restart backend
```

---

## 13. QUICK START SCRIPT

Save as `deploy.sh`:

```bash
#!/bin/bash
set -e

cd /opt/trade-analyzer

echo "📦 Building images..."
docker-compose build --no-cache backend frontend console

echo "🚀 Starting services..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "✅ Checking status..."
docker-compose ps

echo "🔍 Testing health endpoints..."
curl -s http://localhost:8001/health || echo "⚠️  Backend not ready yet"
curl -s http://localhost:3001/ > /dev/null && echo "✅ Frontend healthy"
curl -s http://localhost:3002/ > /dev/null && echo "✅ Console healthy"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Access your application:"
echo "  Dashboard:  https://www.chilloutfox.com"
echo "  Console:    https://console.chilloutfox.com"
echo "  Blog:       https://www.chilloutfox.com/blog"
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## PORT SUMMARY

| Service | Internal Port | Docker Port | External (CloudPanel) | Domain |
|---------|---|---|---|---|
| Backend | 8001 | 8001 | Proxied via nginx | /api |
| Frontend | 80 | 3001 | 80/443 | www.chilloutfox.com |
| Console | 80 | 3002 | 80/443 | console.chilloutfox.com |
| Nginx | 80, 443 | Host | 80, 443 | Host ports |

