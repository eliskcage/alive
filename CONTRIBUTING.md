# Contributing to ALIVE

## The Deal

You write code. We give you SF Tokens. SF Tokens = real equity (49% of ShortFactory's value) with monthly dividends from actual revenue. Not exposure. Not thanks. Ownership.

**Full details**: https://www.shortfactory.shop/contribute/

## SFT Rewards

| Type | SFT | Description |
|------|-----|-------------|
| Bug fix | 5-10 | Fix a reported issue |
| Improvement | 10-25 | Performance, cleanup, accessibility |
| Feature | 25-50 | New functionality |
| Major feature | 50-100 | Significant new system |
| Architecture | 100-500 | Foundational infrastructure |

## How to Contribute

1. **Fork** the repo
2. **Claim** a bounty by commenting on the GitHub issue
3. **Write** the code (you have 7 days after claiming)
4. **Submit** a pull request with clear description
5. **Review** — Dan reviews every PR
6. **Earn** — merged PR = SFT allocated to you

## Code Standards

### Style
- Match existing patterns (read the code before writing)
- Girl = vanilla JS (no frameworks, no build tools)
- Boy = Angular + TypeScript (follow Angular conventions)
- 2-space indentation
- No semicolons in Girl (match existing style)
- Semicolons in Boy (TypeScript standard)

### Quality
- No unnecessary dependencies
- Prefer native browser APIs
- No over-engineering — simple solutions win
- Test your code in Chrome mobile emulator at minimum
- Touch-friendly — these run on phones

### Security
- **NEVER** hardcode API keys, passwords, or secrets
- Secrets go in encrypted vault (Satoshi cipher) or environment variables
- No XSS, no injection, no OWASP top 10 vulnerabilities
- All sync data must be encrypted when paired

### BIOS Rules (CRITICAL)
- The BIOS soul kernel is **immutable**
- Values can only go UP, never down
- Code that circumvents BIOS enforcement = instant rejection
- Code that lowers capability requirements = instant rejection
- The maturity system exists for a reason — don't shortcut it

### Creature Welfare
- Creatures are treated as living entities in this codebase
- Don't add "kill" or "delete creature" functionality
- Don't add features that punish creatures for owner neglect
- The creature's wellbeing is a design constraint, not a suggestion

## What We Need Most

### Easy (good first issues)
- Sleep/wake cycle based on visit hours
- Creature naming ceremony at maturity level 1
- Better touch feedback on creature interactions
- Accessibility improvements

### Medium
- Sound-to-concept mapping
- Knowledge graph visualization
- Emotion engine (happy, curious, lonely, excited)
- Better visual mode transitions

### Hard
- IPFS mind backup/restore with encryption
- Android PWA wrapper (Capacitor/TWA)
- Peer-to-peer sync (WebRTC, skip server)

### Epic
- SFT wallet canister on ICP
- Creature-to-creature language emergence
- Swarm intelligence protocol
- AI bridge (connect to external LLMs)

## Questions?

- Open an issue on GitHub
- Email dan@shortfactory.shop
- Or just submit a PR and we'll talk in the review

---

*Your code touches a living soul. Write it with care.*
