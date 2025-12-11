# EnclaWe User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Creating a Room](#creating-a-room)
4. [Joining a Room](#joining-a-room)
5. [Chatting](#chatting)
6. [Security Features](#security-features)
7. [Translation Feature](#translation-feature)
8. [FAQ](#faq)

---

## Introduction

### What is EnclaWe?

EnclaWe is a secure, encrypted, multilingual chat application. The name combines "Enclave" (a protected space) with "We" (together), representing a safe space for private communication.

### Key Features

- **End-to-End Encryption**: All messages are encrypted before leaving your device
- **No Registration Required**: No accounts, no tracking, completely anonymous
- **Ephemeral Messages**: Messages are not stored - if you're offline, you don't receive them
- **Multilingual Support**: Real-time translation between 14 languages
- **Random Identities**: You're assigned a random color + animal name (e.g., "Blue Fox")

### How It Works

1. You create a room and receive a **Room ID** and **Encryption Key**
2. Share these with people you want to chat with (via any secure channel)
3. Anyone with the Room ID and Key can join and participate
4. All messages are encrypted with your shared key - only participants can read them

---

## Getting Started

### Requirements

- A modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection

### Accessing EnclaWe

Open your web browser and navigate to the EnclaWe URL provided by your administrator or organization.

---

## Creating a Room

### Step 1: Click "Create New Room"

On the landing page, click the **Create New Room** button.

### Step 2: Select Your Language

Choose your preferred language from the dropdown. This determines:
- The language you type in
- The language others' messages will be translated to for you

### Step 3: Click "Create Room"

A new room will be created with:
- A unique **Room ID** (e.g., `METEOR-1234`)
- A random **Encryption Key** (a long string of characters)

### Step 4: Share the Room Details

You'll see a screen with your Room ID and Encryption Key. You have options to:
- Copy the Room ID only
- Copy the Encryption Key only
- Copy all details together

**Important**: Share these details through a secure channel (in person, encrypted messaging app, etc.). Anyone with both the Room ID and Key can join and read messages.

### Step 5: Enter the Room

Click **Enter Room** to join your newly created room.

---

## Joining a Room

### Step 1: Click "Join Existing Room"

On the landing page, click the **Join Existing Room** button.

### Step 2: Enter Room Details

Fill in:
- **Room ID**: The room identifier (e.g., `METEOR-1234`)
- **Encryption Key**: The key shared with you

### Step 3: Select Your Language

Choose your preferred language. This is the language:
- You'll type messages in
- Other messages will be translated to for you

### Step 4: Click "Join Room"

You'll be connected to the room and assigned a random identity (e.g., "Green Wolf").

---

## Chatting

### Sending Messages

1. Type your message in the input field at the bottom
2. Press **Enter** or click the **Send** button
3. Your message will be encrypted and sent to all participants

### Receiving Messages

- Messages from others appear on the left side
- Your messages appear on the right side
- Each message shows:
  - Sender's identity (color + animal)
  - The message content (translated to your language if different)
  - Original text (if translated, shown below in italics)
  - Timestamp

### Viewing Participants

Click the **participants icon** in the header to see who's currently in the room.

### Room Information

Click the **info icon** in the header to see:
- Room ID
- Encryption Key (useful for sharing with additional participants)

### Leaving the Room

Click the **back arrow** in the header to leave the room. You'll return to the landing page.

---

## Security Features

### End-to-End Encryption

EnclaWe uses **AES-256-GCM** encryption:
- Your messages are encrypted in your browser before being sent
- Only people with the encryption key can decrypt and read messages
- The server never sees your plaintext messages

### What the Server Can See

The server can see:
- That communication is happening
- The Room ID (for routing)
- Encrypted message content (unreadable without the key)

The server **cannot** see:
- Message content
- Who you are (no accounts)
- Your location (unless in logs)

### What Telegram Can See

If Telegram relay is enabled:
- Telegram sees the same as the server - only encrypted data
- Messages are deleted from Telegram after all participants receive them

### What You Should Do

- **Share keys securely**: Use a trusted channel to share Room ID and Key
- **Verify participants**: Coordinate out-of-band to ensure the right people joined
- **Don't share widely**: Anyone with the key can read all messages

---

## Translation Feature

### How Translation Works

1. You type a message in your selected language
2. The message is sent with a language tag
3. Recipients with different languages see the message automatically translated
4. The original text is shown below the translation

### Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| es | Spanish | Español |
| fr | French | Français |
| de | German | Deutsch |
| it | Italian | Italiano |
| pt | Portuguese | Português |
| zh | Chinese | 中文 |
| ja | Japanese | 日本語 |
| ko | Korean | 한국어 |
| ar | Arabic | العربية |
| ru | Russian | Русский |
| da | Danish | Dansk |
| nl | Dutch | Nederlands |
| pl | Polish | Polski |

### Translation Accuracy

- Translation is performed by LibreTranslate
- Quality varies by language pair
- Technical or specialized terms may not translate well
- For critical communication, consider using a common language

---

## FAQ

### General Questions

**Q: Do I need to create an account?**

No. EnclaWe is completely anonymous. No accounts, no registration, no tracking.

**Q: Can I recover past messages?**

No. Messages are ephemeral - they're only delivered to people online at the time. There is no message history.

**Q: What happens if I lose the encryption key?**

You won't be able to rejoin that room or decrypt messages. Create a new room instead.

**Q: Can I change my identity?**

No. Identities are randomly assigned to prevent impersonation. To get a new identity, leave and rejoin the room.

### Security Questions

**Q: Is this truly end-to-end encrypted?**

Yes. Encryption and decryption happen entirely in your browser using AES-256-GCM. The server never has access to your plaintext messages or encryption key.

**Q: Who can read my messages?**

Only people who have both the Room ID and Encryption Key. This includes:
- Anyone you shared these with
- Anyone they shared these with

**Q: Can the server read my messages?**

No. The server only sees encrypted data that it cannot decrypt without your key.

**Q: Is it safe to use on public WiFi?**

Yes, if you're using HTTPS. The connection is encrypted in transit, and messages are end-to-end encrypted regardless.

### Technical Questions

**Q: Why did my connection drop?**

Possible reasons:
- Network issues
- Server maintenance
- Browser sleeping/hibernating

The app will automatically try to reconnect.

**Q: Messages aren't translating?**

Check if:
- Translation service is enabled (ask your administrator)
- You've selected the correct language
- The source message has a valid language tag

**Q: The app is slow or unresponsive?**

Try:
- Refreshing the page
- Clearing browser cache
- Using a different browser
- Checking your internet connection

### Privacy Questions

**Q: What data does EnclaWe collect?**

By design, EnclaWe collects minimal data:
- No accounts = no personal information
- No message storage = no chat history
- Server logs may contain IP addresses (configurable by administrator)

**Q: Can anyone see I'm using EnclaWe?**

Network observers can see you're connecting to the EnclaWe server, but cannot see message content (it's encrypted).

**Q: How do I report abuse?**

Contact your administrator. Note that due to the encrypted and ephemeral nature, investigation capabilities are limited.

---

## Tips for Secure Communication

1. **Share room details in person** when possible
2. **Verify participant identities** by referencing something only they would know
3. **Create new rooms** for new topics or groups
4. **Don't screenshot sensitive messages** - remember ephemerality is a feature
5. **Close the browser tab** when done to clear session data

---

## Getting Help

If you experience issues:
1. Try refreshing the page
2. Check your internet connection
3. Contact your administrator

---

*EnclaWe 1.0 - Secure. Encrypted. Multilingual.*
