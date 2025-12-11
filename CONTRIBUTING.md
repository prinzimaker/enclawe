# Contributing to Enclawe

First off, thank you for considering contributing to Enclawe! 🎉

This is a community-driven project fighting for privacy rights. Every contribution matters.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of:

- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Harassment, trolling, or insulting comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information without permission

---

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before reporting a bug:
1. Check if the issue already exists
2. Use the latest version
3. Collect information about your environment

When reporting:
- Use a clear, descriptive title
- Describe the exact steps to reproduce
- Describe the expected vs actual behavior
- Include screenshots if helpful
- Include your environment details (browser, OS, etc.)

### 💡 Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature was already suggested
- Explain the use case clearly
- Consider how it aligns with the project's privacy-first mission

### 🔧 Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### 📖 Documentation

Documentation improvements are highly valued:
- Fix typos or unclear explanations
- Add examples
- Translate documentation
- Improve code comments

### 🌍 Translations

Help make Enclawe accessible worldwide:
- Translate UI strings
- Translate documentation
- Review existing translations

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- A Telegram Bot Token (from @BotFather)

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/enclawe.git
cd enclawe

# Install dependencies
cd server && npm install
cd ../client && npm install

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up redis libretranslate -d

# Start server in dev mode
cd server && npm run dev

# In another terminal, serve client
cd client && npx serve .
```

### Running Tests

```bash
# Server tests
cd server && npm test

# With coverage
npm run test:coverage

# E2E tests (requires all services running)
npm run test:e2e
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated if needed
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] Commit messages are clear

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge
4. Your contribution will be in the next release! 🎉

---

## 📝 Style Guidelines

### JavaScript/TypeScript

- Use ES6+ features
- Use `const` by default, `let` when needed
- Use async/await over promises
- Use meaningful variable names
- Add JSDoc comments for functions

```javascript
/**
 * Encrypts a message using AES-256-GCM
 * @param {string} plaintext - The message to encrypt
 * @param {CryptoKey} key - The encryption key
 * @returns {Promise<string>} Base64-encoded ciphertext
 */
async function encrypt(plaintext, key) {
  // Implementation
}
```

### Commits

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues when relevant

**Good examples:**
```
Add message encryption using AES-256-GCM
Fix WebSocket reconnection on network change
Update README with Docker instructions
```

### CSS

- Use CSS variables for theming
- Mobile-first responsive design
- BEM naming convention when applicable

### Documentation

- Use Markdown
- Keep language simple and clear
- Include code examples
- Update table of contents when adding sections

---

## 🏷️ Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `docs` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `security` | Security-related issue |
| `performance` | Performance improvements |

---

## 🔒 Security Issues

**Do NOT open public issues for security vulnerabilities.**

Instead, please email: security@enclawe.example.com (or use GitHub's private vulnerability reporting if available)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work on a fix.

---

## 💬 Getting Help

- 📖 Check the [documentation](docs/)
- 💬 Open a [Discussion](https://github.com/YOUR_USERNAME/enclawe/discussions)
- 🐛 For bugs, open an [Issue](https://github.com/YOUR_USERNAME/enclawe/issues)

---

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eternally appreciated by privacy advocates worldwide

---

<p align="center">
  <strong>Thank you for helping protect private communication! 🛡️</strong>
</p>
