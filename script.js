const videoElement = document.getElementById('webcam');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

let score = 0;
let lives = 3;
let gameOver = false;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function ensureAudioReady() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playFruitSliceSFX() {
  ensureAudioReady();
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

  oscGain.gain.setValueAtTime(0.35, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.1);

  const bufferSize = audioCtx.sampleRate * 0.08;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.Q.setValueAtTime(3, now);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
}

function playBombExplosionSFX() {
  ensureAudioReady();
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

  oscGain.gain.setValueAtTime(0.7, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.5);

  const bufferSize = audioCtx.sampleRate * 0.4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
}

let bladeTrail = [];
let particles = [];

function addParticles(x, y, color, isBomb = false) {
  const count = isBomb ? 35 : 16;
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * (isBomb ? 18 : 12),
      vy: (Math.random() - 0.5) * (isBomb ? 18 : 12),
      size: Math.random() * (isBomb ? 8 : 6) + 3,
      color: isBomb ? (Math.random() > 0.5 ? '#ff4757' : '#ffa502') : color,
      alpha: 1.0
    });
  }
}

const FRUIT_TYPES = [
  { emoji: '🍉', color: '#2ed573', radius: 36, isBomb: false },
  { emoji: '🍎', color: '#ff4757', radius: 32, isBomb: false },
  { emoji: '🍌', color: '#ffa502', radius: 30, isBomb: false },
  { emoji: '🍊', color: '#ff7f50', radius: 32, isBomb: false },
  { emoji: '🥥', color: '#f1f2f6', radius: 34, isBomb: false }
];

const BOMB_TYPE = { emoji: '💣', color: '#2f3542', radius: 36, isBomb: true };

let items = [];

function spawnItem(forceBomb = false) {
  if (gameOver) return;
  
  const isBomb = forceBomb || Math.random() < 0.25;
  const itemData = isBomb ? BOMB_TYPE : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

  const x = Math.random() * (canvas.width - 240) + 120;
  const y = canvas.height + 40;
  const vx = (canvas.width / 2 - x) * 0.015 + (Math.random() - 0.5) * 3;
  const vy = -(Math.random() * 4 + 13.5);

  items.push({ ...itemData, x, y, vx, vy, gravity: 0.28, sliced: false });
}

setInterval(() => {
  if (gameOver) return;
  const waveCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < waveCount; i++) {
    setTimeout(() => spawnItem(), i * 200);
  }
}, 1400);

function checkSlice(p1, p2, circle) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p1.x - circle.x, p1.y - circle.y) < circle.radius;
  const u = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / (len * len);
  const clampedU = Math.max(0, Math.min(1, u));
  const nearestX = p1.x + clampedU * dx;
  const nearestY = p1.y + clampedU * dy;
  return Math.hypot(circle.x - nearestX, circle.y - nearestY) < circle.radius;
}

let currentFingerTip = null;

function onResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const tip = landmarks[8];
    currentFingerTip = {
      x: (1.0 - tip.x) * canvas.width,
      y: tip.y * canvas.height
    };
  } else {
    currentFingerTip = null;
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentFingerTip && !gameOver) {
    bladeTrail.push({ ...currentFingerTip, time: Date.now() });
  }
  const now = Date.now();
  bladeTrail = bladeTrail.filter(pt => now - pt.time < 180);

  if (bladeTrail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(bladeTrail[0].x, bladeTrail[0].y);
    for (let i = 1; i < bladeTrail.length; i++) {
      ctx.lineTo(bladeTrail[i].x, bladeTrail[i].y);
    }
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#00ffff';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.x += item.vx;
    item.y += item.vy;
    item.vy += item.gravity;

    if (!item.sliced && !gameOver && bladeTrail.length >= 2) {
      const p1 = bladeTrail[bladeTrail.length - 2];
      const p2 = bladeTrail[bladeTrail.length - 1];

      if (checkSlice(p1, p2, item)) {
        item.sliced = true;
        addParticles(item.x, item.y, item.color, item.isBomb);

        if (item.isBomb) {
          playBombExplosionSFX();
          lives = 0;
          livesEl.textContent = '💀';
          gameOver = true;
        } else {
          playFruitSliceSFX();
          score += 10;
          scoreEl.textContent = score;
        }
      }
    }

    if (!item.sliced) {
      ctx.font = `${item.radius * 1.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, item.x, item.y);
    }

    if (item.y > canvas.height + 60) {
      if (!item.sliced && !item.isBomb && !gameOver) {
        lives--;
        livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
        if (lives <= 0) gameOver = true;
      }
      items.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.025;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText('Reload page to retry', canvas.width / 2, canvas.height / 2 + 65);
  }

  requestAnimationFrame(gameLoop);
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 960,
  height: 600
});

camera.start();
requestAnimationFrame(gameLoop);