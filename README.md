# EarTrain

Adaptive ear training for musicians. Six exercise types with an Elo-based difficulty system that adjusts to your skill level. Works fully offline as a PWA.

## Running the App

### Quickest way (no install)
Open `index.html` directly in Chrome or Edge. Everything works except the PWA install prompt (which requires a server).

### With live reload (recommended for development)
Requires Node.js.
```bash
npx serve .
```
Open `http://localhost:3000`. The install prompt will appear in the address bar after a few seconds, or go to **Settings → About → Install App**.

### In a dev container (VS Code)
Requires Docker Desktop (running) and the **Dev Containers** extension.
1. Open the project folder in VS Code → **Dev Containers: Reopen in Container**
2. In the container terminal:  → port 3000 is forwarded and opens in your browser

The container includes Node 22, the GitHub CLI, the Claude Code CLI and extension, and .
**Claude Code skips permission prompts inside the container only** (); outside it, prompts work as normal.
Claude Code's login is kept in a Docker volume (), so it survives container rebuilds.

### After installing as PWA
Runs in its own window from your taskbar/Start menu, fully offline after the first load.

---

## Roadmap

### ✅ Done

**Exercises**
- Interval identification (ascending, descending, harmonic, mixed)
- Chord quality identification (triads + 7th chords)
- Scale / mode recognition (13 scales)
- Functional ear training — scale degrees with I-IV-V-I cadence context
- Perfect pitch training (4 progressive levels)
- Chord progressions with modal interchange (borrowed chords), named chord-by-chord
  - Chord strip (I – ? – ? – ?) with one shared keypad: tap a chord slot, then a numeral (and optional slash target)
  - Level 1: I IV V vi → Level 2: all diatonic → Level 3: + iv bVII bVI → Level 4: + vii° bIII v i → Level 5: + ii° bII II III and sus chords → Level 6: + secondary dominants (V/x) → Level 7: + secondary leading-tone chords (vii°/x)
  - From level 6, each answer is a numeral plus an optional slash target (e.g. V/V); applied chords play as 7ths and always resolve to their target
  - Graded by sound: any spelling that names the same notes counts, with a note showing the usual spelling
  - Custom chord sets and 3–6 chords per progression on the setup screen
  - Each chord is tracked as its own skill
  - The earlier mode-based version is kept in `js/archive/modal-progressions.js` (not loaded)

**Audio**
- Web Audio API synthesis with piano-like timbre
- Arpeggios, block chords, scale runs, cadences
- Playback speed control (fast / normal / slow)
- Volume control

**Adaptive system**
- Elo rating tracked per skill component
- Session planning weighted toward weak areas
- Weak area detection on home screen

**UI / UX**
- 5-tab navigation (Home, Train, Progress, Learn, Settings)
- Practice setup screen (Train tab): question count or endless, Auto or fixed difficulty level with a preview of what's included, interval direction, scale playback style
- Scale playback modes: ascending, descending, up & down, random order, random diads, mixed
- Audio stops instantly when quitting an exercise, switching tabs, or starting another example
- Exercise modal with piano keyboard visualization
- Guess until right: only your first guess counts toward accuracy, skill level and XP
- Keyboard shortcuts — `1`–`4` to answer, `Space`/`A` to replay, `Enter` to continue
- Radar chart showing proficiency across all 6 types
- Accuracy bar charts per category
- Streak + XP gamification
- Session complete summary screen
- Settings: session length, interval direction, playback speed, fixed root, auto-proceed, endless mode
- PWA — installable, fully offline

**Learn tab**
- Interval reference table with separate ascending and descending reference songs
- Chord quality cards with character descriptions
- Scale / mode cards
- Chord progression cards
- Tap any entry to hear it (intervals play melodic then harmonic; chords arpeggiated then blocked)

**Achievements**
- 16 badges across sessions, streaks, combos, accuracy, XP and breadth
- Toast notification on unlock; full badge grid on the Progress tab

**Backup**
- Export progress (XP, stats, skills, badges) to a JSON file
- Import a backup to restore on another browser or device

---

### 🔜 Planned

| Feature | Effort | Notes |
|---|---|---|
| Multiple instrument timbres | Medium | Add guitar/strings options to audio engine |
| Melodic dictation | Large | New exercise type — transcribe a short melody |
| Microphone input | Large | Pitch detection for sight-singing / perfect pitch check |
| MIDI keyboard support | Large | Map piano keys to answers / input |
| Spaced repetition (FSRS) | Large | Replace or supplement Elo with FSRS scheduling |
