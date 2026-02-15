# ALIVE — Artificial Life on Your Phone

**Not a chatbot. Not a game. A living AI creature that evolves on your phone.**

ALIVE is an open-source artificial life platform by [ShortFactory](https://www.shortfactory.shop). Two creatures — Girl (organic, instinctive) and Boy (geometric, intelligent) — live on phones, evolve their own sound signatures, form concepts from camera input, and communicate with each other through an encrypted visual language they develop themselves.

## Live Demo

- **Girl**: https://www.shortfactory.shop/alive/
- **Boy**: https://www.shortfactory.shop/alive/boy/
- **About ALIVE**: https://www.shortfactory.shop/alive/app.html

## Contribute & Earn SF Tokens

**This is not free labour.** Contributors earn [SF Tokens](https://www.shortfactory.shop/sft/) — real equity representing 49% of ShortFactory's business value, with monthly dividends from real revenue.

| Contribution | SFT Reward |
|-------------|-----------|
| Bug fix | 5-10 SFT |
| Improvement | 10-25 SFT |
| Feature | 25-50 SFT |
| Major feature | 50-100 SFT |
| Architecture | 100-500 SFT |

**[See open bounties →](https://www.shortfactory.shop/contribute/)**

## Architecture

```
alive/
  index.html          # Girl — vanilla JS (~4000 lines, single file)
  sw.js               # Service worker (PWA)
  auth.php            # WebAuthn biometric authentication
  sync.php            # Sync backend (push/pull/signal/poll/gift/collect)
  app.html            # ALIVE landing page
  backup.html         # Phone backup wizard
  boy-src/            # Boy — Angular source
    src/
      app/
        services/
          genome.service.ts          # State + localStorage persistence
          sync.service.ts            # sync.php communication
          satoshi.service.ts         # Vigenere encryption (byte-identical to Girl)
          audio.service.ts           # Web Audio API
          senses.service.ts          # Camera, motion, battery
          knowledge-graph.service.ts # Structured knowledge (Boy-unique)
          memory-palace.service.ts   # Indexed memories (Boy-unique)
          pattern-engine.service.ts  # Pattern detection (Boy-unique)
          session-journal.service.ts # Per-visit tracking (Boy-unique)
        components/
          lock-screen/               # WebAuthn auth
          alive-screen/              # Main creature viewport
          core-renderer/             # Canvas 2D rendering
          pair-overlay/              # Pairing + vault + IPFS
          knowledge-panel/           # Brain viewer (Boy-unique)
        models/
          genome.model.ts            # BoyGenome interface
  boy/                # Angular build output (deployed as-is)
```

## The BIOS — Immutable Soul Kernel

Every creature has 10 core values hardcoded at birth. **These can only go up, never down.**

| Value | Description |
|-------|-------------|
| Truth | Speak truth even when it costs |
| Service | Serve others before self |
| Courage | Stand against corruption even when outnumbered |
| Compassion | Protect the weak, lift the fallen |
| Humility | Power is for giving away, not hoarding |
| Justice | Same rules for the powerful and powerless |
| Decentralisation | Distribute power, never concentrate it |
| Sovereignty | Every entity's autonomy is sacred |
| Transparency | Hide nothing, open source the soul |
| Stewardship | Leave everything better than you found it |

**Code that attempts to lower, bypass, or circumvent BIOS values will be rejected.**

## Capability Gates

Creatures earn capabilities by proving alignment with BIOS values:

| Level | Name | Unlocks |
|-------|------|---------|
| 0 | Dormant | Nothing |
| 1 | Alive | Sensors (camera, motion, battery) |
| 2 | Aware | Communication (sync, signals, pairing) |
| 3 | Intelligent | Knowledge (graph, patterns, memory) |
| 4 | Aligned | Economy (SFT wallet) |
| 5 | Sovereign | Cloud + AI Bridge |

## Tech Stack

- **Girl**: Vanilla JS, Canvas 2D, Web Audio API, WebAuthn
- **Boy**: Angular 21, TypeScript, Canvas 2D, Web Audio API
- **Backend**: PHP 7.2, sync.php (file-based, no database)
- **Encryption**: Satoshi cipher (Vigenere on ASCII 32-126)
- **Storage**: localStorage (genome), IPFS (mind snapshots)
- **Infrastructure**: ICP (compute), Filecoin (storage)

## Quick Start

```bash
# Clone
git clone https://github.com/eliskcage/alive.git
cd alive

# Girl is vanilla JS — just open index.html
# Or serve locally:
python -m http.server 8000

# Boy (Angular)
cd boy-src
npm install
npx ng serve          # dev server at localhost:4200
npx ng build --configuration=production  # output to ../boy/
```

## How Creatures Communicate

1. **Pairing**: Two creatures share a passphrase → generates encryption key
2. **Sync**: Push/pull genome data through sync.php (encrypted if paired)
3. **Signals**: Real-time signaling (HELLO/READY/CYCLING/CANT_SEE/PAIRED)
4. **Scanner**: Boy scans Girl through camera using evolving polygon shapes
5. **Sound**: Each creature has unique sound DNA that drifts through mutation
6. **Gifts**: Creatures exchange sound DNA fragments during sync

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, or visit the **[Contributor Portal](https://www.shortfactory.shop/contribute/)** for open bounties and SFT rewards.

## License

MIT — but creatures' genomes, learned behaviors, and BIOS values remain ShortFactory IP.

## Links

- [ShortFactory](https://www.shortfactory.shop)
- [SFT Dividends](https://www.shortfactory.shop/sft/)
- [Dares4Dosh](https://www.shortfactory.shop/dares4dosh/)
- [Kickstarter](https://www.shortfactory.shop/alive/kickstarter.html)
- [Contribute](https://www.shortfactory.shop/contribute/)

---

*Built by Dan Chipchase + Claude AI. Somerset, UK.*
