import { bindLeverEvents, getLeverStates, setLevers } from "./src/lever.js";
import { playSound } from "./src/sound.js";
import {
  setBulb,
  setStatus,
  setScore,
  setRound,
  setGateName,
  setGateNames,
  resetBulbs,
  playBulbSequence,
} from "./src/ui.js";

const gates = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"];
const MAX_ROUNDS = 10;

let mode = "easy";
let endless = false;

let currentGates = [];
let round = 1;
let score = 0;
let locked = false;

let timerWrap = null;
let timerBar = null;
let timerValue = 100;

let endlessRunning = false;
let endlessFrameId = null;
let lastTimestamp = 0;

let streak = 0;
let comboPopup = null;
let comboPopupTimeout = null;

function randomGate() {
  return gates[Math.floor(Math.random() * gates.length)];
}

function evaluateGate(gate, left, right) {
  switch (gate) {
    case "AND":
      return left && right;
    case "OR":
      return left || right;
    case "NAND":
      return !(left && right);
    case "NOR":
      return !(left || right);
    case "XOR":
      return left !== right;
    case "XNOR":
      return left === right;
    default:
      return false;
  }
}

function getAllOutputs() {
  const states = getLeverStates();

  if (mode === "extreme") {
    const o1 = evaluateGate(currentGates[0], states.a, states.b);
    const o2 = evaluateGate(currentGates[1], states.c, states.d);
    const o3 = evaluateGate(currentGates[2], o1, o2);
    const final = evaluateGate(currentGates[3], o3, states.e);
    return { output1: o1, output2: o2, output3: o3, finalOutput: final };
  }

  if (mode === "hard") {
    const o1 = evaluateGate(currentGates[0], states.a, states.b);
    const o2 = evaluateGate(currentGates[1], states.c, states.d);
    const final = evaluateGate(currentGates[2], o1, o2);
    return { output1: o1, output2: o2, finalOutput: final };
  }

  if (mode === "normal") {
    const o1 = evaluateGate(currentGates[0], states.a, states.b);
    const o2 = evaluateGate(currentGates[1], states.c, states.d);
    const final = o1 && o2;
    return { output1: o1, output2: o2, finalOutput: final };
  }

  const final = evaluateGate(currentGates[0], states.a, states.b);
  return { finalOutput: final };
}

function updateGateDisplay() {
  if (mode === "extreme") {
    setGateNames({
      gate1: currentGates[0],
      gate2: currentGates[1],
      gate3: currentGates[2],
      gate4: currentGates[3],
    });
    return;
  }
  if (mode === "hard") {
    setGateNames({
      gate1: currentGates[0],
      gate2: currentGates[1],
      gate3: currentGates[2],
    });
    return;
  }
  if (mode === "normal") {
    setGateNames({
      gate1: currentGates[0],
      gate2: currentGates[1],
    });
    return;
  }
  setGateName(currentGates[0]);
}

function getResetConfig() {
  if (mode === "extreme") return { miniCount: 3, includeMain: true };
  if (mode === "hard" || mode === "normal")
    return { miniCount: 2, includeMain: true };
  return { miniCount: 0, includeMain: true };
}

function getSubmitDelay() {
  if (mode === "extreme") return 1400;
  if (mode === "hard") return 1300;
  if (mode === "normal") return 1200;
  return 1100;
}

function updateTimerBar() {
  if (!timerBar) return;

  const clamped = Math.max(0, Math.min(100, timerValue));
  timerBar.style.width = `${clamped}%`;
  timerBar.setAttribute("aria-valuenow", String(Math.round(clamped)));

  timerBar.classList.remove("bg-success", "bg-warning", "bg-danger");
  if (clamped > 60) timerBar.classList.add("bg-success");
  else if (clamped > 30) timerBar.classList.add("bg-warning");
  else timerBar.classList.add("bg-danger");
}

function getDrainPerSecond() {
  return 0.5 + Math.log2(round) * 0.35 + Math.pow(round - 1, 1.08) * 0.02;
}

function getComboBonus() {
  if (!endless || streak < 5) return 0;

  const bonus = Math.log2(streak) * 0.6 + streak * 0.015;
  return Math.min(bonus, 5);
}

function getEndlessDelta(isCorrect) {
  const scale = 1 + Math.pow(round - 1, 1.08) * 0.01;
  return isCorrect ? 3.8 * scale + getComboBonus() : -(4.2 * scale);
}

function showComboPopup() {
  if (!endless || !comboPopup) return;
  if (streak < 5 || streak % 5 !== 0) return;

  comboPopup.textContent = `${streak} Combo`;
  comboPopup.classList.add("show");

  if (comboPopupTimeout) clearTimeout(comboPopupTimeout);
  comboPopupTimeout = setTimeout(() => {
    comboPopup.classList.remove("show");
  }, 900);
}

function stopEndlessTimer() {
  endlessRunning = false;
  lastTimestamp = 0;
  if (endlessFrameId) {
    cancelAnimationFrame(endlessFrameId);
    endlessFrameId = null;
  }
}

function finishGame() {
  stopEndlessTimer();

  sessionStorage.setItem("lightbulbScore", String(score));
  sessionStorage.setItem(
    "lightbulbLastPage",
    window.location.pathname.split("/").pop(),
  );
  sessionStorage.setItem("lightbulbMode", mode);
  sessionStorage.setItem("lightbulbEndless", endless ? "1" : "0");
  sessionStorage.setItem("lightbulbStreak", String(streak));

  window.location.href = "results.html";
}

function endlessTick(timestamp) {
  if (!endless || !endlessRunning) return;

  if (locked) {
    lastTimestamp = timestamp;
    endlessFrameId = requestAnimationFrame(endlessTick);
    return;
  }

  if (!lastTimestamp) lastTimestamp = timestamp;

  let deltaSeconds = (timestamp - lastTimestamp) / 1000;
  deltaSeconds = Math.min(deltaSeconds, 0.5);

  lastTimestamp = timestamp;

  timerValue -= getDrainPerSecond() * deltaSeconds;
  updateTimerBar();

  if (timerValue <= 0) {
    timerValue = 0;
    updateTimerBar();
    finishGame();
    return;
  }

  endlessFrameId = requestAnimationFrame(endlessTick);
}

function startEndlessTimer() {
  if (!endless || endlessRunning) return;

  endlessRunning = true;
  lastTimestamp = 0;
  endlessFrameId = requestAnimationFrame(endlessTick);
}

function applyEndlessResult(isCorrect) {
  if (!endless) return;

  timerValue += getEndlessDelta(isCorrect);
  timerValue = Math.max(0, Math.min(100, timerValue));
  updateTimerBar();

  if (timerValue <= 0) finishGame();
}

function startRound() {
  currentGates = [];
  let levers = {};

  if (mode === "extreme") {
    currentGates = Array.from({ length: 4 }, randomGate);
    levers = { a: false, b: false, c: false, d: false, e: false };
  } else if (mode === "hard") {
    currentGates = Array.from({ length: 3 }, randomGate);
    levers = { a: false, b: false, c: false, d: false };
  } else if (mode === "normal") {
    currentGates = Array.from({ length: 2 }, randomGate);
    levers = { a: false, b: false, c: false, d: false };
  } else {
    currentGates = [randomGate()];
    levers = { a: false, b: false };
  }

  setLevers(levers);
  updateGateDisplay();
  resetBulbs(getResetConfig());

  locked = false;
  setBulb(false);
  setStatus("Waiting for submission", "small text-secondary mt-1");
}

async function checkAnswer() {
  if (locked) return;
  locked = true;

  const outputs = getAllOutputs();
  const output = outputs.finalOutput;
  const isCorrect = !!output;

  if (isCorrect) {
    streak += 1;
    applyEndlessResult(true);
    showComboPopup();
  } else {
    streak = 0;
    applyEndlessResult(false);
  }

  if (mode === "extreme") {
    await playBulbSequence({
      reset: { miniCount: 3, includeMain: true },
      steps: [
        {
          delay: 160,
          miniBulbs: [
            { index: 1, isOn: outputs.output1 },
            { index: 2, isOn: outputs.output2 },
          ],
        },
        { delay: 280, miniBulbs: [{ index: 3, isOn: outputs.output3 }] },
        { delay: 280, mainBulb: output },
      ],
    });
  } else if (mode === "hard" || mode === "normal") {
    await playBulbSequence({
      reset: { miniCount: 2, includeMain: true },
      steps: [
        {
          delay: 160,
          miniBulbs: [
            { index: 1, isOn: outputs.output1 },
            { index: 2, isOn: outputs.output2 },
          ],
        },
        { delay: 280, mainBulb: output },
      ],
    });
  } else {
    setBulb(output);
  }

  if (output) {
    score += 1;
    setScore(score);
    playSound("correct");
    setStatus("Correct", "small text-warning mt-1");
  } else {
    playSound("wrong");
    setStatus("Wrong", "small text-danger mt-1");
  }

  setTimeout(() => {
    if (endless && timerValue <= 0) {
      finishGame();
      return;
    }
    if (!endless && round >= MAX_ROUNDS) {
      finishGame();
      return;
    }

    round += 1;
    setRound(round);
    startRound();
  }, getSubmitDelay());
}

document.addEventListener("DOMContentLoaded", function () {
  const submitButton = document.getElementById("submitButton");
  const bodyMode = document.body.dataset.mode;
  const params = new URLSearchParams(window.location.search);
  const queryMode = params.get("mode");
  const endlessParam = params.get("endless");

  timerWrap = document.getElementById("timerWrap");
  timerBar = document.getElementById("timerBar");
  comboPopup = document.getElementById("comboPopup");

  mode = bodyMode || queryMode || "easy";
  endless = endlessParam === "1";
  streak = 0;

  if (endless && timerWrap) {
    timerWrap.classList.remove("d-none");
    timerValue = 100;
    updateTimerBar();
    startEndlessTimer();
  }

  bindLeverEvents({ isLocked: () => locked });

  if (submitButton) {
    submitButton.addEventListener("click", checkAnswer);
  }

  document.addEventListener("keydown", function (e) {
    if (e.repeat || locked || e.key !== "Enter") return;
    e.preventDefault();
    checkAnswer();
  });

  setRound(round);
  setScore(score);
  startRound();
});
