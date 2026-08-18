# Web-Fruit-Ninja
play fruit ninja on your web browser with your hands acting as a knife,,, girls can use their tounge...

# Fruit Ninja - Hand Tracking Edition

A browser-based arcade game inspired by Fruit Ninja, powered by computer vision hand tracking via MediaPipe.

---

## Features

- **Real-Time Hand Tracking**: Uses your webcam and MediaPipe Hands to track your index finger tip as a cutting blade.
- **Synthesized Audio Effects**: Built-in sound effects via Web Audio API for slicing fruit and bomb explosions without external audio files.
- **Dynamic Particle System**: Slicing fruits or bombs generates colorful burst particles.
- **Instant Game Over**: Slicing a bomb ends the game immediately, while dropping uncut fruit costs lives.
- **Zero Build Tools**: Runs natively in any modern web browser using standard HTML, CSS, and vanilla JavaScript[cite: 1].

---

## Project Structure

```text
├── index.html   # Main markup, canvas, and video elements
├── style.css    # Layout, UI positioning, and overlay styling
├── script.js    # Game loop, hand detection, physics, and audio synthesis
└── README.md    # Documentation


Prerequisites
A modern web browser (Google Chrome, Microsoft Edge, Firefox, or Safari).

A working webcam.

A local web server (e.g., Live Server, Python HTTP server, or Node http-server) to enable webcam access permissions.

Getting Started
Clone or Download the project files into a single directory.

Start a local HTTP server in the project directory.

Using Python:

Bash
python3 -m http.server 8000
Using Node:

Bash
npx serve .
Or use the Live Server extension in VS Code.

Open the browser and navigate to http://localhost:8000.

Allow Webcam Access when prompted by the browser.
