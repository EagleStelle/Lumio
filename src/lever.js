import { playSound } from "./sound.js";

const leverKeys = ["A", "B", "C", "D", "E"];

function getSwitch(key) {
  return document.getElementById(`switch${key}`);
}

function getLever(key) {
  return document.getElementById(`lever${key}`);
}

function getLabel(key) {
  return document.getElementById(`switch${key}Label`);
}

function toggleLeverByKey(key) {
  const switchEl = getSwitch(key);
  if (!switchEl) return false;

  switchEl.checked = !switchEl.checked;
  updateLeverGraphics();
  updateLeverLabels();
  playSound("lever");
  return true;
}

export function updateLeverLabels() {
  leverKeys.forEach((key) => {
    const switchEl = getSwitch(key);
    const labelEl = getLabel(key);

    if (!switchEl || !labelEl) return;

    labelEl.textContent = switchEl.checked ? "ON" : "OFF";
    labelEl.className = switchEl.checked ? "text-warning" : "text-secondary";
  });
}

export function updateLeverGraphics() {
  leverKeys.forEach((key) => {
    const switchEl = getSwitch(key);
    const leverEl = getLever(key);

    if (!switchEl || !leverEl) return;

    leverEl.setAttribute(
      "transform",
      `rotate(${switchEl.checked ? 35 : -35} 50 80)`,
    );
  });
}

export function getLeverStates() {
  const states = {};

  leverKeys.forEach((key) => {
    states[key.toLowerCase()] = getSwitch(key)?.checked || false;
  });

  return states;
}

export function setLevers(states = {}) {
  leverKeys.forEach((key) => {
    const switchEl = getSwitch(key);
    if (!switchEl) return;

    switchEl.checked = states[key.toLowerCase()] ?? false;
  });

  updateLeverGraphics();
  updateLeverLabels();
}

export function bindLeverEvents({ isLocked } = {}) {
  function lockedNow() {
    return isLocked && isLocked();
  }

  function handleChange(e) {
    if (lockedNow()) {
      e.target.checked = !e.target.checked;
      return;
    }

    updateLeverGraphics();
    updateLeverLabels();
    playSound("lever");
  }

  function handleKeydown(e) {
    if (e.repeat) return;
    if (lockedNow()) return;

    const activeTag = document.activeElement?.tagName;
    if (
      activeTag === "INPUT" ||
      activeTag === "TEXTAREA" ||
      document.activeElement?.isContentEditable
    ) {
      return;
    }

    const keyMap = {
      1: "A",
      2: "B",
      3: "C",
      4: "D",
      5: "E",
    };

    const leverKey = keyMap[e.key];
    if (!leverKey) return;

    const changed = toggleLeverByKey(leverKey);
    if (changed) {
      e.preventDefault();
    }
  }

  leverKeys.forEach((key) => {
    const switchEl = getSwitch(key);
    if (switchEl) {
      switchEl.addEventListener("change", handleChange);
    }
  });

  document.addEventListener("keydown", handleKeydown);

  updateLeverGraphics();
  updateLeverLabels();
}
