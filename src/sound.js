const LEVER_URI =
  "data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAAAAP//AAD/AP8A/wD/AP//AAD//wAA//8AAP8A/wAAAP//AAD/AP8A/wD/AP//AAD//wAA";

const DEFAULT_VOLUMES = {
  correct: 0.45,
  wrong: 0.45,
  lever: 0.35,
};

let audioContext;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(
  ctx,
  { type = "sine", frequency, start, duration, volume, endFrequency },
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);

  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFrequency),
      start + duration,
    );
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
}

function playCorrect(volume) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(ctx, {
    type: "sine",
    frequency: 880,
    start: now,
    duration: 0.12,
    volume: volume * 0.7,
  });

  playTone(ctx, {
    type: "sine",
    frequency: 1320,
    start: now + 0.12,
    duration: 0.18,
    volume,
  });
}

function playWrong(volume) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  playTone(ctx, {
    type: "triangle",
    frequency: 392,
    start: now,
    duration: 0.16,
    volume: volume * 0.8,
  });

  playTone(ctx, {
    type: "triangle",
    frequency: 294,
    start: now + 0.14,
    duration: 0.22,
    volume,
  });
}

function playLever(volume) {
  const audio = new Audio(LEVER_URI);
  audio.volume = volume;
  audio.play().catch(() => {});
}

export function playSound(type, volume) {
  const vol = volume ?? DEFAULT_VOLUMES[type] ?? 0.45;

  if (type === "correct") {
    playCorrect(vol);
    return;
  }

  if (type === "wrong") {
    playWrong(vol);
    return;
  }

  if (type === "lever") {
    playLever(vol);
  }
}
