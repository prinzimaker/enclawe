# EnclaWe Installation Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start with Docker](#quick-start-with-docker)
3. [Manual Installation](#manual-installation)
4. [Telegram Bot Setup](#telegram-bot-setup)
5. [Configuration](#configuration)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
  - OR **Node.js** (version 18+) for manual installation
- **Git** for cloning the repository

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 5 GB | 10 GB |

---

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/enclawe.git
cd enclawe
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Telegram (Optional for testing)

Edit `.env` and add your Telegram bot credentials:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

> **Note:** You can skip Telegram configuration for local testing. Messages will still work via WebSocket but won't be relayed through Telegram.

### 4. Start the Services

```bash
docker-compose up -d
```

### 5. Access EnclaWe

Open your browser and navigate to:
- **Web Client:** http://localhost:3000
- **Server Health:** http://localhost:3001/health

---

## Manual Installation

### 1. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Use Docker or WSL2 with the Linux instructions above.

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies (Optional)

The client is static HTML/CSS/JS and doesn't require npm installation. However, you can serve it with any web server.

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 5. Start the Server

```bash
cd server
npm start
```

### 6. Serve the Client

Using Python:
```bash
cd client
python -m http.server 3000
```

Using Node.js (http-server):
```bash
npm install -g http-server
cd client
http-server -p 3000
```

---

## Telegram Bot Setup

### 1. Create a Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Save the **Bot Token** you receive

### 2. Get Chat ID

#### Option A: Create a Group

1. Create a new Telegram group
2. Add your bot to the group
3. Make the bot an admin
4. Send a message in the group
5. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
6. Find the `chat.id` in the response (negative number for groups)

#### Option B: Use a Channel

1. Create a new Telegram channel
2. Add your bot as an admin
3. Post a message in the channel
4. Visit the getUpdates URL above
5. Find the channel's chat ID

### 3. Configure Webhook (Production)

For production, set up a webhook so Telegram can send messages to your server:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook/telegram",
    "secret_token": "your_webhook_secret"
  }'
```

### 4. Update Configuration

Add to your `.env`:
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram
TELEGRAM_WEBHOOK_SECRET=your_random_secret
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3001 | Server port |
| `HOST` | No | 0.0.0.0 | Server host |
| `REDIS_URL` | No | redis://localhost:6379 | Redis connection URL |
| `TELEGRAM_BOT_TOKEN` | Yes* | - | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Yes* | - | Telegram chat/group ID |
| `TELEGRAM_WEBHOOK_URL` | No | - | Public webhook URL |
| `TELEGRAM_WEBHOOK_SECRET` | No | - | Webhook verification secret |
| `TRANSLATE_URL` | No | http://localhost:5000 | LibreTranslate URL |
| `TRANSLATE_ENABLED` | No | true | Enable translation |
| `LOG_LEVEL` | No | info | Logging level |

*Required for production Telegram relay

### LibreTranslate Configuration

LibreTranslate is included in Docker Compose. On first run, it downloads language models which may take several minutes.

To limit languages (reduce memory):
```yaml
environment:
  - LT_LOAD_ONLY=en,es,fr,de,it
```

---

## Production Deployment

### Using Docker Compose

1. Create production environment file:
```bash
cp .env.example .env.production
# Edit .env.production with production values
```

2. Build and deploy:
```bash
docker-compose --env-file .env.production up -d --build
```

### Reverse Proxy Setup (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name enclawe.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    location /webhook/ {
        proxy_pass http://localhost:3001;
    }
}
```

### Kubernetes Deployment

Kubernetes manifests are provided in the `k8s/` directory:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment-server.yaml
kubectl apply -f k8s/deployment-client.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## Troubleshooting

### Common Issues

#### Redis Connection Failed
```
Error: Redis connection refused
```
**Solution:** Ensure Redis is running:
```bash
docker-compose ps redis
# or
systemctl status redis
```

#### WebSocket Connection Failed
```
WebSocket connection to 'ws://...' failed
```
**Solutions:**
- Check if server is running on correct port
- Verify nginx/proxy WebSocket configuration
- Check firewall settings

#### Telegram Messages Not Relaying
**Solutions:**
- Verify bot token is correct
- Ensure bot is admin in the chat/group
- Check webhook URL is publicly accessible
- Verify webhook secret matches configuration

#### LibreTranslate Not Starting
```
libretranslate: exit code 1
```
**Solutions:**
- Increase container memory limit
- Check if port 5000 is available
- Wait longer on first run (downloads models)

### Logs

View logs for debugging:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f redis
docker-compose logs -f libretranslate
```

### Health Checks

Server health endpoint:
```bash
curl http://localhost:3001/health
```

Redis health:
```bash
docker-compose exec redis redis-cli ping
```

---

## Support

For issues and feature requests, please visit:
- GitHub Issues: https://github.com/your-org/enclawe/issues

---

*EnclaWe 1.0 - December 2025*
