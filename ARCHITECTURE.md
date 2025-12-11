# Enclawe - Technical Architecture Document

## Document Purpose

This document provides complete technical specifications for the Enclawe project. It is designed to be used by developers (human or AI) to implement the system from scratch. Every component, data flow, API endpoint, and integration is documented here.

---

## 1. Project Overview

### 1.1 What is Enclawe?

Enclawe is a secure, encrypted, multilingual chat platform that uses Telegram as its message relay infrastructure. The name combines "Enclave" (a protected space) with "We" (together), representing a safe space for private communication.

### 1.2 Core Principles

1. **Zero Knowledge**: The server never sees plaintext messages
2. **Ephemeral**: No message persistence - if you're not online, you don't receive
3. **Decentralized Relay**: Telegram handles message transport at scale
4. **Multilingual**: Real-time translation between participants
5. **Anonymous**: No accounts, no registration, no tracking

### 1.3 Why Telegram as Backend?

| Concern | Solution |
|---------|----------|
| Scalability | Telegram handles millions of concurrent users |
| Reliability | 99.9% uptime, globally distributed |
| Cost | Free API, no infrastructure costs for messaging |
| Blind Relay | Messages are encrypted before reaching Telegram |

---

## 2. System Architecture

### 2.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ENCLAWE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │  Alice   │     │   Bob    │     │  Cheng   │     │  Diana   │       │
│  │  (EN)    │     │   (DA)   │     │  (ZH)    │     │  (IT)    │       │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘       │
│       │                │                │                │              │
│       │ WebSocket      │ WebSocket      │ WebSocket      │ WebSocket   │
│       │                │                │                │              │
│  ┌────┴────────────────┴────────────────┴────────────────┴────┐        │
│  │                    LOAD BALANCER                            │        │
│  │                  (nginx / HAProxy)                          │        │
│  └────┬────────────────┬────────────────┬────────────────┬────┘        │
│       │                │                │                │              │
│  ┌────▼────┐     ┌────▼────┐     ┌────▼────┐     ┌────▼────┐          │
│  │ Node.js │     │ Node.js │     │ Node.js │     │ Node.js │          │
│  │ Server  │     │ Server  │     │ Server  │     │ Server  │          │
│  │   #1    │     │   #2    │     │   #3    │     │   #N    │          │
│  └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘          │
│       │                │                │                │              │
│       └────────────────┴───────┬────────┴────────────────┘              │
│                                │                                         │
│                         ┌──────▼──────┐                                 │
│                         │    REDIS    │                                 │
│                         │   Pub/Sub   │                                 │
│                         └──────┬──────┘                                 │
│                                │                                         │
│  ┌─────────────────────────────┴─────────────────────────────┐          │
│  │                                                            │          │
│  │  ┌─────────────┐              ┌─────────────────────┐     │          │
│  │  │  Telegram   │◄────────────►│   Webhook Handler   │     │          │
│  │  │  Bot API    │   webhook    │                     │     │          │
│  │  └─────────────┘              └─────────────────────┘     │          │
│  │                                                            │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                          │
│                         ┌──────────────┐                                │
│                         │ LibreTranslate│                                │
│                         │  (optional)   │                                │
│                         └──────────────┘                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Web Client** | UI, encryption/decryption, translation, WebSocket connection |
| **Load Balancer** | Distributes WebSocket connections across Node.js servers |
| **Node.js Servers** | WebSocket handling, Telegram API calls, Redis pub/sub |
| **Redis** | Room membership tracking, cross-server message routing |
| **Telegram Bot** | Message relay (sees only encrypted payloads) |
| **Webhook Handler** | Receives messages from Telegram, routes to Redis |
| **LibreTranslate** | Optional self-hosted translation service |

---

## 3. Data Flows

### 3.1 Room Creation Flow

```
1. Alice opens Enclawe web app
2. Client generates:
   - Room ID: random 8-character alphanumeric (e.g., "METEOR-7291")
   - Encryption Key: random 256-bit key, base64 encoded
   - User Identity: random color + animal name (e.g., "🔵 Blue Fox")
3. Client connects via WebSocket to server
4. Server creates Telegram group (or uses pre-created pool)
5. Server stores in Redis:
   - room:{ROOM_ID}:telegram_chat_id → {telegram_chat_id}
   - room:{ROOM_ID}:users → Set of {user_id: node_server_id}
6. Client displays: "Share this with others: METEOR-7291 | Key: abc123..."
```

### 3.2 Room Join Flow

```
1. Bob receives Room ID + Key from Alice (via any channel)
2. Bob opens Enclawe, enters Room ID and Key
3. Client generates Bob's identity: "🟢 Green Wolf"
4. Client connects via WebSocket
5. Server verifies room exists in Redis
6. Server adds Bob to room:{ROOM_ID}:users
7. Server broadcasts to room: "🟢 Green Wolf joined"
8. Bob sees existing participants (but NOT message history - ephemeral)
```

### 3.3 Message Send Flow

```
┌─────────┐                                                      ┌─────────┐
│  Alice  │                                                      │   Bob   │
│ Browser │                                                      │ Browser │
└────┬────┘                                                      └────┬────┘
     │                                                                │
     │ 1. User types "Hello everyone!"                                │
     │                                                                │
     │ 2. Client creates message object:                              │
     │    {                                                           │
     │      "sender": "🔵 Blue Fox",                                  │
     │      "lang": "en",                                             │
     │      "text": "Hello everyone!",                                │
     │      "timestamp": 1699999999999                                │
     │    }                                                           │
     │                                                                │
     │ 3. Client encrypts with room key (AES-256-GCM)                 │
     │    → "U2FsdGVkX1+8J3nK9x..."                                   │
     │                                                                │
     │ 4. Client sends via WebSocket:                                 │
     │    {                                                           │
     │      "type": "message",                                        │
     │      "room": "METEOR-7291",                                    │
     │      "payload": "U2FsdGVkX1+8J3nK9x..."                        │
     │    }                                                           │
     │                                                                │
     ▼                                                                │
┌─────────┐                                                           │
│ Node.js │                                                           │
│ Server  │                                                           │
└────┬────┘                                                           │
     │                                                                │
     │ 5. Server looks up Telegram chat_id from Redis                 │
     │                                                                │
     │ 6. Server sends to Telegram Bot API:                           │
     │    POST /sendMessage                                           │
     │    {                                                           │
     │      "chat_id": -1001234567890,                                │
     │      "text": "{\"r\":\"METEOR-7291\",\"p\":\"U2FsdGVk...\"}"   │
     │    }                                                           │
     │                                                                │
     ▼                                                                │
┌──────────┐                                                          │
│ Telegram │  ← Sees ONLY encrypted gibberish                         │
│   Bot    │                                                          │
└────┬─────┘                                                          │
     │                                                                │
     │ 7. Telegram calls webhook with message                         │
     │                                                                │
     ▼                                                                │
┌──────────┐                                                          │
│ Webhook  │                                                          │
│ Handler  │                                                          │
└────┬─────┘                                                          │
     │                                                                │
     │ 8. Handler extracts room ID, publishes to Redis:               │
     │    PUBLISH room:METEOR-7291 {payload, message_id}              │
     │                                                                │
     ▼                                                                │
┌─────────┐                                                           │
│  Redis  │                                                           │
│ Pub/Sub │                                                           │
└────┬────┘                                                           │
     │                                                                │
     │ 9. All Node.js servers subscribed to room:METEOR-7291          │
     │    receive the message                                         │
     │                                                                │
     │ 10. Each server pushes to connected clients in that room       │
     │                                                                │
     └────────────────────────────────────────────────────────────────►
                                                                      │
                                                             11. Bob's browser:
                                                                 - Receives encrypted payload
                                                                 - Decrypts with room key
                                                                 - Sees lang="en"
                                                                 - Translates en→da (Danish)
                                                                 - Displays: "🔵 Blue Fox: Hej alle!"
                                                                      │
                                                             12. Bob sends ACK via WebSocket
                                                                      │
                                                                      ▼
                                                             13. Server calls Telegram:
                                                                 DELETE /deleteMessage
                                                                 {message_id: 12345}
```

### 3.4 ACK and Message Deletion Flow

The system tracks message delivery to ensure messages are deleted from Telegram once all online participants have received them.

```
Message Lifecycle:
1. Alice sends message → stored temporarily on Telegram
2. Server tracks: message_id, expected_recipients (users currently online)
3. Each recipient sends ACK when message displayed
4. When all ACKs received → Server deletes message from Telegram
5. Timeout (30 seconds): delete anyway to prevent accumulation

Redis tracking structure:
  msg:{message_id}:pending → Set of user_ids who haven't ACKed
  msg:{message_id}:telegram_id → Telegram message ID for deletion
  msg:{message_id}:chat_id → Telegram chat ID
```

---

## 4. Technical Specifications

### 4.1 Encryption

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- Authenticated encryption (integrity + confidentiality)
- Native browser support via Web Crypto API
- No external libraries required

**Key Derivation**:
```javascript
// Room key is generated once and shared out-of-band
const roomKey = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
const roomKeyBase64 = btoa(String.fromCharCode(...roomKey));

// For encryption, derive key from base64 string
async function importKey(keyBase64) {
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}
```

**Encryption Function**:
```javascript
async function encrypt(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoded
  );
  
  // Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + ciphertext.byteLength);
  result.set(iv);
  result.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...result));
}
```

**Decryption Function**:
```javascript
async function decrypt(ciphertextBase64, key) {
  const data = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decrypted);
}
```

### 4.2 Message Format

**Plaintext Message (before encryption)**:
```json
{
  "sender": "🔵 Blue Fox",
  "lang": "en",
  "text": "Hello everyone!",
  "ts": 1699999999999
}
```

**Encrypted Payload (sent to Telegram)**:
```json
{
  "r": "METEOR-7291",
  "p": "U2FsdGVkX1+8J3nK9xM2..."
}
```

- `r`: Room ID (plaintext, needed for routing)
- `p`: Encrypted payload (base64)

### 4.3 Translation

**Service**: LibreTranslate (self-hosted)

**API Endpoint**: `POST /translate`

**Request**:
```json
{
  "q": "Hello everyone!",
  "source": "en",
  "target": "da"
}
```

**Response**:
```json
{
  "translatedText": "Hej alle sammen!"
}
```

**Supported Languages** (minimum set):
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic
- `ru` - Russian
- `da` - Danish
- `nl` - Dutch
- `pl` - Polish

**Translation Flow** (client-side):
```javascript
async function translateMessage(text, sourceLang, targetLang) {
  if (sourceLang === targetLang) return text;
  
  const response = await fetch(`${TRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang
    })
  });
  
  const result = await response.json();
  return result.translatedText;
}
```

### 4.4 User Identity Generation

Users are assigned random identities upon joining a room. This ensures:
- No impersonation (system assigns identity)
- Visual distinction between participants
- Anonymity (no real names)

**Identity Components**:
- Color emoji: 🔵 🟢 🟣 🟠 🔴 🟡 ⚪ 🟤
- Color name: Blue, Green, Purple, Orange, Red, Yellow, White, Brown
- Animal name: Fox, Wolf, Bear, Eagle, Owl, Hawk, Deer, Lion, Tiger, Panther

**Generation Algorithm**:
```javascript
const COLORS = [
  { emoji: '🔵', name: 'Blue' },
  { emoji: '🟢', name: 'Green' },
  { emoji: '🟣', name: 'Purple' },
  { emoji: '🟠', name: 'Orange' },
  { emoji: '🔴', name: 'Red' },
  { emoji: '🟡', name: 'Yellow' },
  { emoji: '⚪', name: 'White' },
  { emoji: '🟤', name: 'Brown' }
];

const ANIMALS = [
  'Fox', 'Wolf', 'Bear', 'Eagle', 'Owl', 
  'Hawk', 'Deer', 'Lion', 'Tiger', 'Panther'
];

function generateIdentity(existingIdentities = []) {
  let identity;
  let attempts = 0;
  
  do {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    identity = `${color.emoji} ${color.name} ${animal}`;
    attempts++;
  } while (existingIdentities.includes(identity) && attempts < 100);
  
  return identity;
}
```

### 4.5 Room ID Generation

**Format**: `WORD-NNNN` where WORD is a memorable noun and NNNN is 4 random digits.

```javascript
const WORDS = [
  'METEOR', 'AURORA', 'NEBULA', 'COSMOS', 'PHOENIX',
  'THUNDER', 'CRYSTAL', 'SHADOW', 'SILVER', 'GOLDEN',
  'MYSTIC', 'ARCTIC', 'BLAZING', 'COSMIC', 'DIGITAL',
  'ECHO', 'FALCON', 'GLACIER', 'HARBOR', 'INFINITY'
];

function generateRoomId() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const number = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${word}-${number}`;
}
```

---

## 5. API Specifications

### 5.1 WebSocket Protocol

**Connection**: `wss://enclawe.example.com/ws`

**Client → Server Messages**:

```typescript
// Join room
{
  "type": "join",
  "room": "METEOR-7291",
  "identity": "🔵 Blue Fox",
  "lang": "en"
}

// Send message
{
  "type": "message",
  "room": "METEOR-7291",
  "payload": "U2FsdGVkX1+8J3nK9x..."  // encrypted
}

// Acknowledge receipt
{
  "type": "ack",
  "room": "METEOR-7291",
  "messageId": "msg_abc123"
}

// Leave room
{
  "type": "leave",
  "room": "METEOR-7291"
}

// Ping (keepalive)
{
  "type": "ping"
}
```

**Server → Client Messages**:

```typescript
// Join confirmation
{
  "type": "joined",
  "room": "METEOR-7291",
  "identity": "🔵 Blue Fox",
  "participants": ["🟢 Green Wolf", "🟣 Purple Bear"]
}

// New message
{
  "type": "message",
  "room": "METEOR-7291",
  "messageId": "msg_abc123",
  "payload": "U2FsdGVkX1+8J3nK9x..."  // encrypted
}

// User joined notification
{
  "type": "user_joined",
  "room": "METEOR-7291",
  "identity": "🟠 Orange Eagle"
}

// User left notification
{
  "type": "user_left",
  "room": "METEOR-7291",
  "identity": "🟢 Green Wolf"
}

// Error
{
  "type": "error",
  "code": "ROOM_NOT_FOUND",
  "message": "The room does not exist"
}

// Pong (keepalive response)
{
  "type": "pong"
}
```

### 5.2 Telegram Bot Integration

**Required Bot Settings**:
- Privacy mode: **Disabled** (or bot must be admin)
- Inline mode: Not required
- Group privacy: Bot must see all messages

**Bot API Endpoints Used**:

```typescript
// Send message to group
POST https://api.telegram.org/bot{TOKEN}/sendMessage
{
  "chat_id": -1001234567890,
  "text": "{\"r\":\"METEOR-7291\",\"p\":\"encrypted...\"}"
}

// Delete message after ACK
POST https://api.telegram.org/bot{TOKEN}/deleteMessage
{
  "chat_id": -1001234567890,
  "message_id": 12345
}

// Create new group (for room creation - optional)
POST https://api.telegram.org/bot{TOKEN}/createChat
// Note: Bots cannot create groups directly. 
// Alternative: Use a pool of pre-created groups
```

**Webhook Setup**:
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://enclawe.example.com/webhook/telegram"}'
```

**Webhook Payload** (incoming message):
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 12345,
    "from": {
      "id": 987654321,
      "is_bot": true,
      "first_name": "EnclaweBot"
    },
    "chat": {
      "id": -1001234567890,
      "title": "Enclawe Room",
      "type": "supergroup"
    },
    "date": 1699999999,
    "text": "{\"r\":\"METEOR-7291\",\"p\":\"U2FsdGVkX1+8J3nK9x...\"}"
  }
}
```

### 5.3 Redis Data Structures

```
# Room to Telegram chat mapping
room:{ROOM_ID}:telegram_chat_id    STRING    "-1001234567890"

# Room participants (with their server assignment)
room:{ROOM_ID}:users               HASH      {
                                               "🔵 Blue Fox": "server1:conn123",
                                               "🟢 Green Wolf": "server2:conn456"
                                             }

# Message pending ACKs
msg:{MESSAGE_ID}:pending           SET       ["🔵 Blue Fox", "🟢 Green Wolf"]
msg:{MESSAGE_ID}:telegram_id       STRING    "12345"
msg:{MESSAGE_ID}:chat_id           STRING    "-1001234567890"
msg:{MESSAGE_ID}:expires           STRING    "1699999999"  # Unix timestamp

# Room expiration (cleanup after all leave)
room:{ROOM_ID}:expires             STRING    "1699999999"

# Pub/Sub channels
room:{ROOM_ID}                     CHANNEL   (for message distribution)
```

**TTL Policy**:
- `msg:*` keys: 60 seconds TTL
- `room:*:expires`: Set when last user leaves, 5 minutes TTL
- Cleanup job removes expired rooms

---

## 6. Deployment Architecture

### 6.1 Docker Compose (Development)

```yaml
version: '3.8'

services:
  # Web client (static files)
  client:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - server

  # Node.js WebSocket server
  server:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_WEBHOOK_SECRET=${TELEGRAM_WEBHOOK_SECRET}
      - TRANSLATE_URL=http://libretranslate:5000
    depends_on:
      - redis
      - libretranslate

  # Redis for pub/sub and state
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # LibreTranslate for translations
  libretranslate:
    image: libretranslate/libretranslate:latest
    ports:
      - "5000:5000"
    environment:
      - LT_LOAD_ONLY=en,es,fr,de,it,pt,zh,ja,ko,ar,ru,da,nl,pl

volumes:
  redis_data:
```

### 6.2 Production Architecture (Kubernetes)

```
                         ┌─────────────────────────┐
                         │     Cloudflare CDN      │
                         │   (DDoS protection)     │
                         └───────────┬─────────────┘
                                     │
                         ┌───────────▼─────────────┐
                         │    Ingress Controller   │
                         │   (nginx / traefik)     │
                         └───────────┬─────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
     ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐
     │   Static Files  │   │  WebSocket LB   │   │  Webhook Handler│
     │   (nginx pods)  │   │ (sticky sessions)│   │     (pods)      │
     └─────────────────┘   └────────┬────────┘   └────────┬────────┘
                                    │                      │
                           ┌────────▼────────┐            │
                           │  Node.js Pods   │◄───────────┘
                           │  (HPA: 3-100)   │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │  Redis Cluster  │
                           │   (3 masters)   │
                           └─────────────────┘
```

**Horizontal Pod Autoscaler**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: enclawe-server
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: enclawe-server
  minReplicas: 3
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: websocket_connections
      target:
        type: AverageValue
        averageValue: 1000
```

---

## 7. Security Considerations

### 7.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| Telegram reads messages | End-to-end encryption; Telegram sees only ciphertext |
| Server compromise | Server never has encryption keys; cannot decrypt |
| Man-in-the-middle | TLS for all connections; key shared out-of-band |
| Room enumeration | Long random room IDs; rate limiting on join attempts |
| Replay attacks | Timestamp in encrypted payload; nonce in AES-GCM |
| User impersonation | Server assigns identities; cannot be chosen |

### 7.2 What We Don't Protect Against

- Key sharing interception (if Alice sends key via compromised channel)
- Malicious participants (anyone with the key can read messages)
- Client-side compromise (malware on user's device)
- Traffic analysis (observer can see that communication is happening)

### 7.3 Rate Limiting

```javascript
// Per-IP limits
const rateLimits = {
  joinRoom: { window: 60, max: 10 },      // 10 joins per minute
  sendMessage: { window: 1, max: 5 },      // 5 messages per second
  createRoom: { window: 3600, max: 5 }     // 5 rooms per hour
};
```

---

## 8. File Structure

```
enclawe/
├── README.md
├── LICENSE                          # Apache 2.0
├── CONTRIBUTING.md
├── ARCHITECTURE.md                  # This document
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
│
├── client/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js                   # Main application logic
│       ├── crypto.js                # AES-256-GCM encryption
│       ├── identity.js              # Identity generation
│       ├── translate.js             # LibreTranslate integration
│       ├── websocket.js             # WebSocket client
│       └── ui.js                    # UI manipulation
│
├── server/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── websocket.js             # WebSocket server
│   │   ├── telegram.js              # Telegram Bot API
│   │   ├── webhook.js               # Webhook handler
│   │   ├── redis.js                 # Redis client & pub/sub
│   │   ├── room.js                  # Room management
│   │   └── config.js                # Configuration
│   └── tests/
│       ├── websocket.test.js
│       ├── telegram.test.js
│       └── integration.test.js
│
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment-server.yaml
│   ├── deployment-client.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
│
└── docs/
    ├── SETUP.md                     # Setup instructions
    ├── API.md                       # API documentation
    ├── TELEGRAM_SETUP.md            # Telegram bot setup guide
    └── TRANSLATION_SETUP.md         # LibreTranslate setup
```

---

## 9. Environment Variables

```bash
# .env.example

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Redis
REDIS_URL=redis://localhost:6379

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_URL=https://enclawe.example.com/webhook/telegram
TELEGRAM_WEBHOOK_SECRET=random_secret_string

# Translation (optional - can use client-side)
TRANSLATE_URL=http://localhost:5000
TRANSLATE_ENABLED=true

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## 10. Implementation Notes for Developers

### 10.1 Critical Implementation Details

1. **WebSocket Sticky Sessions**: When using multiple server instances, ensure the load balancer uses sticky sessions (e.g., based on IP or cookie) so that a client always connects to the same server.

2. **Redis Pub/Sub for Cross-Server**: When server A receives a message for a room, it must publish to Redis. Server B (where other room participants are connected) subscribes and forwards to its clients.

3. **Message Ordering**: Messages should include timestamps. Clients should sort by timestamp for display, not arrival order.

4. **Reconnection Handling**: Clients should automatically reconnect on disconnect. Upon reconnection, they rejoin the room with the same identity (stored in sessionStorage).

5. **Telegram Group Management**: 
   - Option A: Create groups on-demand (complex, requires user interaction)
   - Option B: Pre-create a pool of groups (recommended)
   - Option C: Use a single group with room ID as message prefix (simplest)

### 10.2 Recommended Option C Architecture

For simplicity, use a **single Telegram group** for all rooms:

```json
// Message in Telegram group
{
  "r": "METEOR-7291",
  "p": "encrypted_payload..."
}
```

The webhook handler routes based on `r` (room ID). This avoids the complexity of group management entirely.

### 10.3 Testing Strategy

1. **Unit Tests**: Crypto functions, identity generation, room ID generation
2. **Integration Tests**: WebSocket protocol, Redis pub/sub
3. **E2E Tests**: Full flow from client A → Telegram → client B
4. **Load Tests**: Simulate 10,000+ concurrent connections

### 10.4 Monitoring

Key metrics to track:
- WebSocket connections per server
- Messages per second
- Redis pub/sub latency
- Telegram API response times
- Error rates by type

---

## 11. Future Enhancements

1. **File Sharing**: Encrypt and share files (base64 in message, or separate storage)
2. **Voice Messages**: Encrypted audio clips
3. **Read Receipts**: Show who has read (optional, privacy implications)
4. **Persistent Rooms**: Option to keep room alive for returning users
5. **Room Passwords**: Additional layer (password → key derivation)
6. **Mobile Apps**: React Native / Flutter clients
7. **Desktop Apps**: Electron wrapper
8. **Tor Support**: .onion address for maximum anonymity

---

## Document Version

- **Version**: 1.0
- **Last Updated**: December 2025
- **Authors**: Enclawe Contributors

---

*This document is part of the Enclawe project, licensed under Apache 2.0.*
