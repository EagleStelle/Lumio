import { bindLeverEvents, getLeverStates, setLevers } from "/src/lever.js";
import { playSound } from "/src/sound.js";
import {
  setBulb,
  setStatus,
  setScore,
  setRound,
  setGateName,
  setGateNames,
  resetBulbs,
  playBulbSequence,
} from "/src/ui.js";

const gates = ["AND", "OR", "NAND", "NOR", "XOR", "XNOR"];
const MAX_ROUNDS = 10;

let mode = "easy";
let currentGate = "AND";
let currentGate1 = "AND";
let currentGate2 = "OR";
let currentGate3 = "XOR";
let currentGate4 = "NOR";

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

function getNormalOutputs() {
  const { a, b, c, d } = getLeverStates();

  const output1 = evaluateGate(currentGate1, a, b);
  const output2 = evaluateGate(currentGate2, c, d);
  const finalOutput = output1 && output2;

  return {
    output1,
    output2,
    finalOutput,
  };
}

function getHardOutputs() {
  const { a, b, c, d } = getLeverStates();

  const output1 = evaluateGate(currentGate1, a, b);
  const output2 = evaluateGate(currentGate2, c, d);
  const finalOutput = evaluateGate(currentGate3, output1, output2);

  return {
    output1,
    output2,
    finalOutput,
  };
}

function getExtremeOutputs() {
  const { a, b, c, d, e } = getLeverStates();

  const output1 = evaluateGate(currentGate1, a, b);
  const output2 = evaluateGate(currentGate2, c, d);
  const output3 = evaluateGate(currentGate3, output1, output2);
  const finalOutput = evaluateGate(currentGate4, output3, e);

  return {
    output1,
    output2,
    output3,
    finalOutput,
  };
}

function updateGateDisplay() {
  if (mode === "extreme") {
    setGateNames({
      gate1: currentGate1,
      gate2: currentGate2,
      gate3: currentGate3,
      gate4: currentGate4,
    });
    return;
  }

  if (mode === "hard") {
    setGateNames({
      gate1: currentGate1,
      gate2: currentGate2,
      gate3: currentGate3,
    });
    return;
  }

  if (mode === "normal") {
    setGateNames({
      gate1: currentGate1,
      gate2: currentGate2,
    });
    return;
  }

  setGateName(currentGate);
}

function getOutput() {
  const { a, b } = getLeverStates();

  if (mode === "extreme") {
    return getExtremeOutputs().finalOutput;
  }

  if (mode === "hard") {
    return getHardOutputs().finalOutput;
  }

  if (mode === "normal") {
    return getNormalOutputs().finalOutput;
  }

  return evaluateGate(currentGate, a, b);
}

function getResetConfig() {
  if (mode === "extreme") {
    return { miniCount: 3, includeMain: true };
  }

  if (mode === "hard") {
    return { miniCount: 2, includeMain: true };
  }

  if (mode === "normal") {
    return { miniCount: 2, includeMain: true };
  }

  return { miniCount: 0, includeMain: true };
}

function getSubmitDelay() {
  if (mode === "extreme") return 1400;
  if (mode === "hard") return 1300;
  if (mode === "normal") return 1200;
  return 1100;
}

function startRound() {
  if (mode === "extreme") {
    currentGate1 = randomGate();
    currentGate2 = randomGate();
    currentGate3 = randomGate();
    currentGate4 = randomGate();

    setLevers({ a: false, b: false, c: false, d: false, e: false });
  } else if (mode === "hard") {
    currentGate1 = randomGate();
    currentGate2 = randomGate();
    currentGate3 = randomGate();

    setLevers({ a: false, b: false, c: false, d: false });
  } else if (mode === "normal") {
    currentGate1 = randomGate();
    currentGate2 = randomGate();

    setLevers({ a: false, b: false, c: false, d: false });
  } else {
    currentGate = randomGate();

    setLevers({ a: false, b: false });
  }

  updateGateDisplay();
  resetBulbs(getResetConfig());

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

async function checkAnswer() {
  if (locked) return;

  locked = true;

  let output = false;

  if (mode === "extreme") {
    const { output1, output2, output3, finalOutput } = getExtremeOutputs();

    output = await playBulbSequence({
      reset: { miniCount: 3, includeMain: true },
      steps: [
        {
          delay: 160,
          miniBulbs: [
            { index: 1, isOn: output1 },
            { index: 2, isOn: output2 },
          ],
        },
        {
          delay: 280,
          miniBulbs: [{ index: 3, isOn: output3 }],
        },
        {
          delay: 280,
          mainBulb: finalOutput,
        },
      ],
    });
  } else if (mode === "hard") {
    const { output1, output2, finalOutput } = getHardOutputs();

    output = await playBulbSequence({
      reset: { miniCount: 2, includeMain: true },
      steps: [
        {
          delay: 160,
          miniBulbs: [
            { index: 1, isOn: output1 },
            { index: 2, isOn: output2 },
          ],
        },
        {
          delay: 280,
          mainBulb: finalOutput,
        },
      ],
    });
  } else if (mode === "normal") {
    const { output1, output2, finalOutput } = getNormalOutputs();

    output = await playBulbSequence({
      reset: { miniCount: 2, includeMain: true },
      steps: [
        {
          delay: 160,
          miniBulbs: [
            { index: 1, isOn: output1 },
            { index: 2, isOn: output2 },
          ],
        },
        {
          delay: 280,
          mainBulb: finalOutput,
        },
      ],
    });
  } else {
    output = getOutput();
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
    if (round >= MAX_ROUNDS) {
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
