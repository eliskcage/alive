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

## Capability Gates (Client-Side)

ALIVE uses a lightweight capability-gating system so the core experience stays free for everyone, while advanced Growth Skills can be unlocked with ShortFactory tokens.

### How it works

```
CAP = { craft: false, geneLab: false }   ← live flags
gate('craft', 'shape upgrades')          ← call before any premium action
refreshEntitlements()                    ← fetches flags from your server (with cache)
```

| Key | Feature group | What it unlocks |
|-----|--------------|-----------------|
| `craft` | **Craft Kit** | Shape upgrades (lv 1–5), harmony layers, voice training, rhythm timeline + combo, boss mode, journey map, XP/progression |
| `geneLab` | **Gene Lab** | Breeding, offspring, genome mixing |

The gate function shows a friendly, non-aggressive message in the UI if the capability is locked; the core experience (shapes, mic hum-to-note, trust bar, memory, emotion labels) is never gated.

### V2 features

#### 1. Voice Training (Craft Kit)
Train a specific shape to respond to your hum pitch. ALIVE listens for 3 s and locks in the median frequency.

```js
ALIVE.craft.trainShape(0); // train shape 1 (index 0)
```

#### 2. Shape Upgrades (Craft Kit)
Each of the 5 shapes grows from level 1 → 5. Higher levels add richer audio layers:

| Level | Extra layer |
|-------|------------|
| 1 | Base sine (free) |
| 2 | Vibrato |
| 3 | Harmony fifth |
| 4 | Octave warmth |
| 5 | Shimmer (noise texture) |

```js
ALIVE.craft.upgradeShape(0); // upgrade shape 1
```

#### 3. Emotional Weighting (free to collect)
Positive interactions reinforce emotion associations for each shape. Used by boss mode and rhythm challenges. Always collected, never gated.

#### 4. Rhythm Journey (Craft Kit)
BPM 90 timeline lane at the bottom of the screen. Notes scroll from right to left; tap the green side when a note reaches the target zone. Builds combo + awards XP at streak milestones.

```js
ALIVE.craft.rhythmTimeline(); // toggle rhythm mode
```

#### 5. Boss Journey (Craft Kit)
ALIVE plays a call pattern; tap shapes in the same order to echo it back. Rounds grow longer as you advance. Awards XP each round.

```js
ALIVE.journey.boss(); // toggle boss mode
```

#### 6. Journey Map (Craft Kit)
Small panel in the top-left showing level, XP bar, and shape status dots (grey=locked, gold=unlocked, green=trained). Automatically shown when `CAP.craft` is true.

#### 7. Saving System
- `emotionWeights` always persists to `localStorage` (free memory).
- `shapeLevels`, `trainedShapes`, `playerProgress`, `bossLevel`, `rhythmMaxCombo` persist only when Craft is entitled.
- Key: `alive_v2`. Autosaves every 2 minutes and after every meaningful action.

### Entitlements caching (V2)

Entitlements are cached in `localStorage` under `alive_ent_cache` with a **30-minute TTL**.

- On page load: cached values are applied immediately (so the UI is responsive with no server round-trip).
- In the background: `refreshEntitlements()` fetches fresh values from the server and overwrites the cache.
- On server failure / offline: cached values remain active; the core experience keeps running.

Cache object schema:
```json
{ "ts": 1713945600000, "data": { "craft": true, "geneLab": false } }
```

### Implementing the server endpoint

Create `GET /api/alive/entitlements` on your server. The request always includes cookies (`credentials: 'include'`), so you can verify the session and return the appropriate flags.

**Expected response** (HTTP 200, `Content-Type: application/json`):
```json
{ "craft": true, "geneLab": false }
```

- Return only the keys your server knows about; unknown keys are ignored.
- Any non-200 response is discarded silently — the core experience keeps running.
- Absent keys leave the existing flag unchanged (defaults to `false`).

**Example (PHP)**:
```php
<?php
header('Content-Type: application/json');
session_start();
$uid = $_SESSION['user_id'] ?? null;
$tokens = $uid ? db_get_sft_balance($uid) : 0; // replace with your DB query
echo json_encode([
    'craft'   => $tokens >= 10,
    'geneLab' => $tokens >= 50,
]);
```

**Example (Node/Express)**:
```js
app.get('/api/alive/entitlements', (req, res) => {
  const tokens = req.session?.sftBalance ?? 0;
  res.json({ craft: tokens >= 10, geneLab: tokens >= 50 });
});
```

> **Important**: Client-side gating is a UX courtesy, not a security boundary. Premium content delivered to the client can be accessed by a determined user. If premium content has real monetary value, enforce entitlements on the server before serving any premium assets or data.

### Developer console commands

```js
ALIVE.cap.status()              // → { craft: false, geneLab: false }
ALIVE.cap.refresh()             // re-fetches from /api/alive/entitlements
ALIVE.cap.unlock('craft')       // dev override — unlocks locally

// Craft Kit
ALIVE.craft.shapeUpgrade()      // upgrade the first non-max shape
ALIVE.craft.harmonyLayer()      // play a layered chord
ALIVE.craft.voiceTraining()     // start voice training for first untrained shape
ALIVE.craft.rhythmTimeline()    // toggle rhythm timeline
ALIVE.craft.upgradeShape(0)     // upgrade a specific shape (index 0-4)
ALIVE.craft.trainShape(0)       // train a specific shape with your voice
ALIVE.craft.bossMode()          // toggle Boss Journey

// Journey
ALIVE.journey.progress()        // → { level, xp, xpToNext, unlockedShapes, ... }
ALIVE.journey.shapeLevels()     // → [1, 1, 1, 1, 1]
ALIVE.journey.trainedShapes()   // → { 0: 440.00, ... }
ALIVE.journey.rhythm()          // toggle rhythm mode
ALIVE.journey.boss()            // toggle boss mode

// Gene Lab
ALIVE.geneLab.breed()
```



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
