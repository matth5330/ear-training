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
- Chord progression identification in all 7 modes (Major, Minor, Dorian, Phrygian, Lydian, Mixolydian, Locrian) or mixed
  - Levels 1–3: a library of 64 named progressions, common → less common
  - Level 4: any 4-chord diatonic progression starting on the tonic (216 per mode)
  - Level 5: any 4-chord diatonic progression (1,512 per mode)
  - Tonic chord plays first to establish the key

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
