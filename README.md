# Singular/ty Command Hub

The Singular/ty Defense Solutions **Command Hub**: a dark-themed Next.js 15 operations workspace. It includes dashboards, SignalFrame, WhisperMesh, the music hub, Heimdall and AXIOS engine panels, Venice characters, theme switching, and more.

Maintained at **https://github.com/s3v3nlabs/command-hub**.


## Screenshots

![Home dashboard](docs/screenshots/home-desktop.png)

*Home dashboard with module tiles and live-looking status cards.*

![Command Hub fortress](docs/screenshots/command-hub-desktop.png)

*Command Hub fortress: module links, sidebar, and node status.*

![Music Hub](docs/screenshots/music-desktop.png)

*Music Hub with the harmonic EQ lane and official-OAuth streamer stubs.*

![Home on a phone](docs/screenshots/home-mobile.png)

*Home dashboard at a phone-sized width (412×915).*

![Command Hub on a phone](docs/screenshots/command-hub-mobile.png)

*Command Hub fortress at a phone-sized width.*

![Music Hub on a phone](docs/screenshots/music-mobile.png)

*Music Hub at a phone-sized width.*

## Quick start

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/s3v3nlabs/command-hub.git
cd command-hub
npm install
cp .env.example .env.local   # optional; fill only what you use
npm run dev                  # http://localhost:3000  (binds 0.0.0.0:3000)
```

Production build:

```bash
npm run build
npm start
```

## Configuration

All keys in `.env.example` are optional placeholders. Modules that need an API key (Venice, OpenAI, xAI, Groq, LMNT, Shodan, and others) show a stub or "not configured" state until you set it in `.env.local`.

Local-data features (Operator Twin, Evidence Explorer, reclaim packs) read from paths you choose:

| Variable | Default |
|---|---|
| `HUB_VAULT_BASE` | `./local-data` |
| `EVIDENCE_ROOT` | `./local-data/evidence` |
| `RECLAIM_PACKS_ROOT` | `./local-data/packs` |
| `TWIN_INDEX_DIR` | `./.local/twin-index` |

Some status and engine routes still have optional absolute default paths from the original build host. They fail soft when those paths are missing.

## Security

- Never commit `.env.local`, credentials, tokens, vaults, evidence, or databases. `.gitignore` blocks them.
- Keep secrets in a password manager (Bitwarden) and inject them locally.
- This public repo contains source code only, with no personal data or runtime state.

## Layout

- `app/`: Next.js App Router pages and API routes
- `components/`: UI (CommandHub, signalframe, venice, music, voice, and more)
- `lib/`: engines, mesh, privacy, AI router, and other libraries
- `docs/`: module docs (WhisperMesh, Music Hub, Voice Bus, SymTrain, and others)
