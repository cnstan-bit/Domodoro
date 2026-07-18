# Domodoro

<p align="center">
  <img src="src/assets/breaklock-icon.png" width="144" alt="Domodoro app icon">
</p>

<p align="center">
  <strong>An enforced-break Pomodoro timer for Windows.</strong><br>
  Stop overfocus before it turns into exhaustion.
</p>

<p align="center">
  English · <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/cnstan-bit/Domodoro/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/cnstan-bit/Domodoro?style=flat-square"></a>
  <a href="https://github.com/cnstan-bit/Domodoro/actions/workflows/ci.yml"><img alt="CI status" src="https://img.shields.io/github/actions/workflow/status/cnstan-bit/Domodoro/ci.yml?branch=main&style=flat-square&label=CI"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/github/license/cnstan-bit/Domodoro?style=flat-square"></a>
  <img alt="Windows" src="https://img.shields.io/badge/platform-Windows-00a4ef?style=flat-square">
</p>

![Domodoro poster](docs/assets/domodoro-poster.png)

![Domodoro cyber command interface](docs/assets/domodoro-cyber-hud.png)

## Why Domodoro

Most focus timers ask you to notice a small notification and voluntarily stop. That is easy to ignore when you are hyperfocused.

Domodoro takes a stronger approach. It gives you a one-minute visual warning, then opens a full-screen, always-on-top recovery overlay when focus time ends. The timer remains simple; the break experience is expressive, configurable, and extensible through Overlay Packs.

Domodoro is designed for people who lose track of time while working, including ADHD-friendly workflows. It is a behavioral interruption tool, not medical software or a system-level lock.

## How It Works

1. Choose a 20, 40, or 60 minute focus preset.
2. Optionally record the task you intend to finish.
3. Receive a visible warning during the final minute.
4. When focus ends, Domodoro opens a full-screen recovery overlay on every display.
5. When the break ends, choose to continue, finish for the day, or recover for five more minutes.

Closing the application ends the active focus task. Reopening Domodoro starts from idle instead of silently resuming an old task. Active break enforcement remains protected against ordinary window closing.

## Features

### Focus and recovery

- Three focus presets: 20, 40, and 60 minutes.
- Configurable short breaks, long breaks, and long-break interval.
- One-minute pre-break warning with persona artwork.
- Full-screen, always-on-top recovery overlays across multiple displays.
- Post-break decision gate: continue, finish, or extend recovery.
- Daily limit for focus extensions and additional recovery time.
- Emergency bypass protected by a password and required reason.

### Overlay Engine

- Random selection from enabled Overlay Packs.
- Built-in animated CSS scenes.
- Static image and animated image backgrounds.
- Local video files and direct HTTPS media links.
- Automatic fallback when a media overlay fails.
- Custom accent color, warning lines, sound, and intensity.

### Progress and insights

- Local focus, break, pause, and bypass history.
- Seven-day and 30-day focus and recovery analytics.
- Balance scoring that rewards recovery instead of overwork.
- Persona archive progress and discipline ranks.
- Weekly share card generation.
- Optional privacy-first squads with daily summary leaderboards.

### Windows experience

- Tray-first Electron application.
- Chinese and English interface switch.
- State-aware tray actions.
- Optional launch at login, disabled by default.
- Installer and portable archive builds.
- Reduced-motion setting.

## Download

Download the latest Windows build from [GitHub Releases](https://github.com/cnstan-bit/Domodoro/releases/latest):

- `Domodoro Setup <version>.exe`: standard installer.
- `Domodoro-<version>-win.zip`: portable application archive.

Windows may show a SmartScreen warning because community builds are not currently signed with a commercial code-signing certificate. Review the source and release workflow before running the application if this concerns you.

## Run From Source

Requirements:

- Windows
- Node.js 22 or newer
- npm

```powershell
git clone https://github.com/cnstan-bit/Domodoro.git
cd Domodoro
npm install
npm start
```

## Build a Windows Package

```powershell
npm run dist
```

The installer, portable archive, and unpacked application are written to `release/`.

## Overlay Pack Development

Each pack lives in `src/overlays/<pack-id>/` and contains an `overlay-pack.json` manifest:

```json
{
  "id": "cyber-alert",
  "name": "Cyber Alert",
  "type": "css-scene",
  "assets": {},
  "defaultText": ["Stand up.", "Let your brain cool down."],
  "sound": "pulse",
  "allowRandom": true
}
```

Supported types:

| Type | Purpose |
| --- | --- |
| `css-scene` | Built-in HTML and CSS animation theme |
| `image` | Static image or animated image background |
| `video` | Local video or direct HTTPS media file |

Remote webpages, iframes, arbitrary third-party JavaScript, YouTube pages, and Bilibili pages are intentionally unsupported. Video sources must use `file://` or direct HTTPS `.mp4`, `.webm`, or `.mov` media URLs.

See the [Overlay Pack Guide](docs/OVERLAY_PACKS.md) for the full manifest and testing workflow.

## Data and Privacy

Domodoro works offline by default. On Windows, local application data is normally stored under `%APPDATA%\domodoro\`.

| File | Contents |
| --- | --- |
| `settings.json` | Timer, overlay, persona, and interface settings |
| `history.json` | Completed focus and recovery history, pauses, and bypass records |
| `session-state.json` | Temporary state used for active break enforcement |
| `social-session.dat` | Optional encrypted social sign-in session |

Detailed task labels, bypass reasons, exact timestamps, overlay choices, and persona choices stay local. When optional squads are enabled, only daily summary metrics are synced. See [Squad Backend](docs/SOCIAL.md) for the exact privacy boundary.

## Security Model and Limits

- Renderer windows use context isolation, sandboxing, and disabled Node integration.
- Domodoro does not load remote webpages inside overlays.
- Social authentication storage uses Electron `safeStorage` when Windows encryption is available.
- Emergency bypass is recorded locally.
- Domodoro is not a system-level lock and cannot prevent Task Manager, rebooting, or process termination.
- The application is not a substitute for medical advice, diagnosis, or treatment.

## Project Structure

```text
src/main/       Electron lifecycle, windows, tray, and IPC
src/core/       Timer, history, analytics, rewards, and overlay rules
src/renderer/   Main command-center interface
src/overlay/    Full-screen recovery overlay renderer
src/warning/    One-minute pre-break warning
src/overlays/   Built-in Overlay Packs
supabase/       Optional squad backend migration
test/           Node test suite
```

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Run Domodoro locally |
| `npm test` | Run the Node test suite |
| `npm run check` | Run project checks |
| `npm run build` | Build an unpacked application |
| `npm run dist` | Build Windows installer and portable archive |

## Contributing

Bug reports, accessibility reviews, translations, and new Overlay Packs are welcome.

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Open a [bug report](https://github.com/cnstan-bit/Domodoro/issues/new?template=bug_report.yml) or [feature request](https://github.com/cnstan-bit/Domodoro/issues/new?template=feature_request.yml).
3. Keep timer behavior in `src/core` and cover behavior changes with tests.
4. Add new break experiences through Overlay Packs instead of hard-coding one-off renderer logic.

## Documentation

- [Overlay Pack Guide](docs/OVERLAY_PACKS.md)
- [Squad Backend](docs/SOCIAL.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)

## License

Domodoro is available under the [MIT License](LICENSE).
