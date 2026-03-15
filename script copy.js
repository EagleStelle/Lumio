import { bindLeverEvents, getLeverStates, setLevers } from "./lever.js";
import { playSound } from "./sound.js";
import { setBulb, setStatus, setScore, setRound } from "./ui.js";

const gates = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"];
const MAX_ROUNDS = 10;

let mode = "easy";
let currentGate = "AND";
let currentGate1 = "AND";
let currentGate2 = "OR";
let round = 1;
let score = 0;
let locked = false;

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

function updateGateDisplay() {
  const singleGate = document.getElementById("gateName");
  const gate1 = document.getElementById("gateName1");
  const gate2 = document.getElementById("gateName2");

  if (mode === "normal") {
    if (gate1) gate1.textContent = currentGate1;
    if (gate2) gate2.textContent = currentGate2;
  } else {
    if (singleGate) singleGate.textContent = currentGate;
  }
}

function getOutput() {
  const { a, b, c, d } = getLeverStates();

  if (mode === "normal") {
    const output1 = evaluateGate(currentGate1, a, b);
    const output2 = evaluateGate(currentGate2, c, d);

    return output1 && output2;
  }

  return evaluateGate(currentGate, a, b);
}

function startRound() {
  if (mode === "normal") {
    currentGate1 = randomGate();
    currentGate2 = randomGate();
    setLevers({ a: false, b: false, c: false, d: false });
  } else {
    currentGate = randomGate();
    setLevers({ a: false, b: false });
  }

  updateGateDisplay();

  locked = false;
  setBulb(false);
  setStatus("Waiting for submission", "small text-secondary mt-1");
}

function finishGame() {
  sessionStorage.setItem("lightbulbScore", String(score));
  sessionStorage.setItem(
    "lightbulbLastPage",
    window.location.pathname.split("/").pop(),
  );
  sessionStorage.setItem("lightbulbMode", mode);
  window.location.href = "results.html";
}

function checkAnswer() {
  if (locked) return;

  locked = true;
  const output = getOutput();

  if (output) {
    score += 1;
    setScore(score);

    setBulb(true);
    playSound("correct");
    setStatus("Correct", "small text-warning mt-1");
  } else {
    setBulb(false);
    playSound("wrong");
    setStatus("Wrong", "small text-danger mt-1");
  }

  setTimeout(() => {
    if (round >= MAX_ROUNDS) {
      finishGame();
      return;
    }

    round += 1;
    setRound(round);
    startRound();
  }, 1100);
}

document.addEventListener("DOMContentLoaded", function () {
  const submitButton = document.getElementById("submitButton");
  const bodyMode = document.body.dataset.mode;
  const queryMode = new URLSearchParams(window.location.search).get("mode");

  mode = bodyMode || queryMode || "easy";

  bindLeverEvents({
    isLocked: function () {
      return locked;
    },
  });

  if (submitButton) {
    submitButton.addEventListener("click", checkAnswer);
  }

  document.addEventListener("keydown", function (e) {
    if (e.repeat) return;
    if (locked) return;

    if (e.key === "Enter") {
      e.preventDefault();
      checkAnswer();
    }
  });

  setRound(round);
  setScore(score);
  startRound();
});
