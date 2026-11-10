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
- Chord progression identification (6 common patterns)

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
- Exercise modal with piano keyboard visualization
- Keyboard shortcuts — `1`–`4` to answer, `Space`/`A` to replay, `Enter` to continue
- Radar chart showing proficiency across all 6 types
- Accuracy bar charts per category
- Streak + XP gamification
- Session complete summary screen
- Settings: session length, interval direction, playback speed, fixed root, auto-proceed, endless mode
- PWA — installable, fully offline

**Learn tab**
- Interval reference table with mnemonics
- Chord quality cards with character descriptions
- Scale / mode cards
- Chord progression cards

---

### 🔜 Planned

| Feature | Effort | Notes |
|---|---|---|
| Playback buttons in Learn tab | Small | Audio engine already exists, just needs wiring |
| Badges / achievements | Small | XP and streak data already tracked |
| Progress export / backup | Small | LocalStorage → JSON download |
| Multiple instrument timbres | Medium | Add guitar/strings options to audio engine |
| Melodic dictation | Large | New exercise type — transcribe a short melody |
| Microphone input | Large | Pitch detection for sight-singing / perfect pitch check |
| MIDI keyboard support | Large | Map piano keys to answers / input |
| Spaced repetition (FSRS) | Large | Replace or supplement Elo with FSRS scheduling |
