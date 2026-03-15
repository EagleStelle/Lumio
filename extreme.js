import { playBulbSequence, resetBulbs, setGateNames } from "./ui.js";

export function resetModeBulbs() {
  resetBulbs({ miniCount: 3, includeMain: true });
}

export function updateGateDisplay({ gate1, gate2, gate3, gate4 }) {
  setGateNames({ gate1, gate2, gate3, gate4 });
}

export async function playModeSequence({
  output1,
  output2,
  output3,
  finalOutput,
}) {
  return playBulbSequence({
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
}
