
import { Pin } from './types';

export const inputPins: Pin[] = [
  Pin.FBO, Pin.C0, Pin.C1, Pin.ULI, Pin.UHI, Pin.LHI, Pin.LLI, Pin.RLI, Pin.RHI, Pin.DHI, Pin.DLI
];

export const outputPins: Pin[] = [
  Pin.FBI, Pin.ULO, Pin.UHO, Pin.LHO, Pin.LLO, Pin.RLO, Pin.RHO, Pin.DHO, Pin.DLO
];

export const blockSize = 100;  // In pixels for relative sizes of elements