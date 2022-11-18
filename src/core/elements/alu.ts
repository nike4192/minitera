import {Mask, Op, Pin} from "@/core/types";

export class ALU {
  operation: Op = Op.NOP;
  mask: Mask = Mask.M;
  wordLength: number = 64;
  bitCounter: number = 0;

  inputs: (Pin | null)[]
  outputs: (Pin | null)[]

  constructor(params: any = {}) {
    this.operation = params.operation || Op.NOP;
    this.setMask(params.mask, params.wordLength);
    this.inputs = params.inputs || [];
    this.outputs = params.outputs || [];
  }

  setMask(mask: Mask = Mask.M, wordLength: number = 64) {
    this.mask = mask;
    if (mask === Mask.S) {
      this.wordLength = wordLength;
    }
  }

  clear() {
    if (this.mask === Mask.S) {
      this.bitCounter = 0;
    }
  }

  toJSON() {
    let object: any = {};

    object.operation = this.operation;
    object.mask = this.mask;
    if (this.mask === Mask.S) {
      object.wordLength = this.wordLength;
    }

    object.inputs = Array.from(this.inputs);
    object.outputs = Array.from(this.outputs);

    return object;
  }

  static fromJSON(json) {
    return new ALU({
      operation: json.operation,
      mask: json.mask,
      wordLength: json.wordLength,
      inputs: json.inputs,
      outputs: json.outputs
    });
  }
}
