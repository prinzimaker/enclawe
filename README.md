# 🛡️ Enclawe

**Enclave + We = A safe space, together.**

Enclawe is a secure, encrypted, multilingual chat platform designed to protect private communication as a fundamental human right. Instead of implementing its own chat infrastructure, Enclawe uses Telegram as a blind message relay — ensuring massive scalability while keeping costs at zero. All messages are end-to-end encrypted before leaving your browser; not even Telegram can read them.
In a world where governments push for backdoors and mass surveillance threatens the foundations of free society, Enclawe stands as a tool for freedom of expression and democratic discourse. Privacy is not a privilege — it is the bedrock of democracy.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🚨 Why Enclawe Exists

### The EU Chat Control Threat

The European Union is pushing forward with legislation known as **"Chat Control"** (officially: CSAR - Child Sexual Abuse Regulation), which would mandate:

- 🔍 **Mass surveillance** of all private messages
- 🚫 **Backdoors** in encrypted messaging apps
- 👁️ **Client-side scanning** of your personal communications
- 📊 **AI-based content analysis** of every message you send

While framed as child protection, security experts, privacy advocates, and even the EU's own legal advisors have warned that this legislation would:

1. **Destroy end-to-end encryption** as we know it
2. **Create vulnerabilities** exploitable by hackers and hostile states
3. **Enable authoritarian surveillance** infrastructure
4. **Violate fundamental rights** to privacy and free expression
5. **Set a global precedent** for mass surveillance

> *"There is no such thing as a backdoor that only the good guys can use."*  
> — Security experts worldwide

### Our Response

**We refuse to comply.**

Enclawe is our answer to surveillance overreach. It's a communication tool designed with one principle: **your conversations belong to you, and only you.**

- ✅ **Zero knowledge**: Servers never see plaintext messages
- ✅ **No backdoors**: Encryption happens in YOUR browser
- ✅ **No accounts**: No registration, no tracking, no profiles
- ✅ **Ephemeral**: Messages exist only in the moment
- ✅ **Open source**: Trust through transparency

**Privacy is not a crime. Private communication is a human right.**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **End-to-End Encryption** | AES-256-GCM encryption in your browser |
| 🌍 **Multilingual Chat** | Write in your language, others read in theirs |
| 👻 **Ephemeral Messages** | No history, no logs, no persistence |
| 🎭 **Anonymous Identities** | Random names assigned (🔵 Blue Fox, 🟢 Green Wolf) |
| 📡 **Telegram as Relay** | Massive scalability, Telegram sees only encrypted noise |
| 🚀 **No Registration** | No accounts, no email, no phone number |
| 💻 **Web-Based** | Works in any modern browser |

---

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Alice     │         │   Telegram  │         │    Bob      │
│  (Browser)  │         │  (Blind     │         │  (Browser)  │
│             │         │   Relay)    │         │             │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  1. Encrypt locally   │                       │
       │  ─────────────────►   │                       │
       │                       │                       │
       │  2. Send encrypted    │                       │
       │  ══════════════════►  │                       │
       │                       │  3. Relay (can't read)│
       │                       │  ══════════════════►  │
       │                       │                       │
       │                       │         4. Decrypt    │
       │                       │         locally       │
       │                       │         ◄─────────────│
       │                       │                       │
       │                       │         5. Translate  │
       │                       │         & Display     │
```

**Key Points:**
- Encryption/decryption happens **only in the browser**
- Telegram acts as a **blind relay** (sees only encrypted data)
- Server **never** has access to encryption keys
- Messages are **deleted from Telegram** after delivery

For complete technical details, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/enclawe.git
cd enclawe

# Copy environment template
cp .env.example .env

# Edit .env with your Telegram bot token
# Get one from @BotFather on Telegram
nano .env

# Start all services
docker-compose up -d

# Open http://localhost:3000
```

### Manual Setup

See [docs/SETUP.md](docs/SETUP.md) for detailed instructions.

---

## 📖 How to Use

### Creating a Room

1. Open Enclawe in your browser
2. Click **"Create Room"**
3. You'll receive:
   - **Room ID**: `METEOR-7291` (share this)
   - **Encryption Key**: `a8Kx9mN2...` (share this too!)
4. Send both to your chat partner(s) via a secure channel

### Joining a Room

1. Open Enclawe
2. Enter the **Room ID** and **Key** you received
3. Choose your **language**
4. Click **"Join"**
5. Start chatting!

### Security Tips

- 🔑 Share the room key through a **different channel** than Telegram
- 📱 Use Signal, in-person meeting, or encrypted email to share keys
- 🔄 Create **new rooms** for new conversations
- 🚪 **Leave the room** when done — it helps trigger cleanup

---

## 🌍 Translation

Enclawe supports real-time translation between participants:

- Alice writes in **English** → Bob reads in **Danish**
- Bob writes in **Danish** → Alice reads in **English**
- Cheng writes in **Chinese** → Everyone reads in their own language

Translation is powered by [LibreTranslate](https://libretranslate.com/), a free and open-source translation engine.

Supported languages include: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Russian, Danish, Dutch, Polish, and more.

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `TELEGRAM_WEBHOOK_URL` | Public URL for Telegram webhooks | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `TRANSLATE_URL` | LibreTranslate instance URL | No |
| `PORT` | Server port (default: 3001) | No |

### Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token to your `.env`
4. Send `/setprivacy` → Select your bot → **Disable**
5. Create a Telegram group and add your bot
6. Make the bot an **administrator**

See [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Enclawe is a community project fighting for privacy rights.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests
- 🌍 Add translations
- 📣 Spread the word

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/enclawe.git
cd enclawe

# Install server dependencies
cd server && npm install

# Start in development mode
npm run dev
```

---

## 📜 License

Enclawe is licensed under the [Apache License 2.0](LICENSE).

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Use privately

---

## ⚠️ Disclaimer

Enclawe is a tool for **legitimate private communication**. It is designed to protect the fundamental human right to privacy.

We do not condone illegal activity. Users are responsible for their own actions.

**Privacy is not a crime.**

---

## 🔗 Links

- [Architecture Document](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [LibreTranslate](https://libretranslate.com/)
- [EU Chat Control - Wikipedia](https://en.wikipedia.org/wiki/Chat_control)
- [Patrick Breyer on Chat Control](https://www.patrick-breyer.de/en/posts/chat-control/)

---

## 💬 Support the Cause

If you believe in the right to private communication:

1. ⭐ **Star this repository**
2. 🔀 **Fork and contribute**
3. 📢 **Share with others**
4. ✍️ **Contact your EU representatives** about Chat Control
5. 💪 **Support digital rights organizations** like EFF, EDRi, and others

---

<p align="center">
  <strong>🛡️ Your conversations. Your privacy. Your right.</strong>
</p>

<p align="center">
  <em>Built with ❤️ by people who believe privacy is a human right.</em>
</p>
