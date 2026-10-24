# Noizy

A sound and color garden for Luka. Wiggle the mouse, tap the screen, or press any key — Noizy answers with a soft musical note and a little burst of color.

It is meant for a one-year-old at the keyboard, and for the grown-up sitting with him. Notes stay on a C major pentatonic scale, so a fist on the keys still sounds like music. The tones are gentle sine and triangle waves, with a soft attack and a volume slider along the bottom.

## Run it

On Windows, double-click `start.bat` in this folder. The first launch finishes preparing the project, installs dependencies, then opens [http://localhost:47321](http://localhost:47321).

Or, from the project folder:

```bash
npm install
npm run dev
```

The first wiggle, tap, or keypress starts the sound. Browsers wait for that gesture before they will play audio. Turn up the Windows volume as well as the slider along the bottom of the page. The cloud computer this was built on has no speakers, so listen on your own machine.

## How to play

- **Move the mouse or a finger.** A ribbon of light follows, and a note plays. Left and low is a lower note; right and high is a higher one.
- **Tap or click.** A flower opens and two notes sound together.
- **Press any key.** A shape blooms somewhere in the garden, and a letter floats up when the key has one.

The bottom bar is for grown-ups: mute, volume, and full screen. Those controls do not trigger the garden.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the playground |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build |
| `npm test` | Check the note map |
| `npm run lint` | Lint the project |

Noizy is a Node.js app (Vite, React, and TypeScript). Sound is synthesized in the browser, so there are no audio files to download.
