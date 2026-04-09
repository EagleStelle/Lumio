function getById(id) {
  return document.getElementById(id);
}

function setGlowState(glowElement, isOn) {
  if (!glowElement) return;

  glowElement.setAttribute("fill", isOn ? "#ffd54a" : "#343a40");
  glowElement.setAttribute("stroke", isOn ? "#ffec99" : "#6c757d");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hasMainBulb() {
  return Boolean(getById("bulbGlow"));
}

export function setBulb(isOn) {
  const bulbGlow = getById("bulbGlow");
  const bulbStatus = getById("bulbStatus");

  if (!bulbGlow || !bulbStatus) return;

  setGlowState(bulbGlow, isOn);

  bulbStatus.textContent = isOn ? "Bulb is ON" : "Bulb is OFF";
  bulbStatus.className = isOn
    ? "small text-warning mt-1"
    : "small text-secondary mt-1";
}

export function setMainBulb(isOn) {
  if (!hasMainBulb()) return;
  setBulb(isOn);
}

export function setMiniBulb(index, isOn) {
  const glow = getById(`miniBulbGlow${index}`);
  setGlowState(glow, isOn);
}

export function setMiniBulbs(states = []) {
  states.forEach(({ index, isOn }) => {
    setMiniBulb(index, isOn);
  });
}

export function resetMiniBulbs(count = 0) {
  for (let index = 1; index <= count; index += 1) {
    setMiniBulb(index, false);
  }
}

export function resetBulbs({ miniCount = 0, includeMain = true } = {}) {
  resetMiniBulbs(miniCount);

  if (includeMain) {
    setMainBulb(false);
  }
}

export function setGateName(gateName) {
  const element = getById("gateName");
  if (!element) return;
  element.textContent = gateName;
}

export function setGateNames(gates = {}) {
  Object.entries(gates).forEach(([key, value]) => {
    const match = key.match(/^gate(\d+)$/i);
    if (!match) return;

    const gateNumber = match[1];
    const element = getById(`gateName${gateNumber}`);

    if (element && value != null) {
      element.textContent = value;
    }
  });
}

export function setStatus(text, className = "small text-secondary mt-1") {
  const status = getById("bulbStatus");
  if (!status) return;

  status.textContent = text;
  status.className = className;
}

export function setScore(score) {
  const element = getById("score");
  if (!element) return;

  element.textContent = score;
}

export function setRound(round) {
  const element = getById("roundNumber");
  if (!element) return;

  element.textContent = round;
}

export async function playBulbSequence({ reset = null, steps = [] } = {}) {
  if (reset) {
    resetBulbs(reset);
  }

  for (const step of steps) {
    const { delay = 0, miniBulbs = [], mainBulb } = step;

    if (delay > 0) {
      await wait(delay);
    }

    if (miniBulbs.length > 0) {
      setMiniBulbs(miniBulbs);
    }

    if (typeof mainBulb === "boolean") {
      setMainBulb(mainBulb);
    }
  }

  const lastStep = steps[steps.length - 1];
  return typeof lastStep?.mainBulb === "boolean" ? lastStep.mainBulb : null;
}
