import {BitStreamBase} from "@/core/types";

export class BitStream implements BitStreamBase {
  bits: number[] = [];
  buffer: number[] = [];
  stash: number[] = [];
  delay: number = 0;

  constructor(bits: number[] = [], delay: number = 0) {
    this.bits = Array.from(bits);
    this.delay = delay;
  }

  clear() {
    this.bits = [];
    this.buffer = [];
    this.stash = [];
  }

  get(index) {
    return this.bits[index] || this.buffer[index];
  }

  enqueue(tacts, value) {
    this.buffer[tacts + this.delay] ||= value;
  }

  dequeue() {
    return this.bits.shift() | this.buffer.shift() | 0;
  }

  get isEmpty(): boolean {
    return !this.bits.concat(this.buffer).filter(v => v).length;
  }

  get all() {
    return this.stash.concat(this.bits);
  }
}

export class Constant0 implements BitStreamBase {
  get = () => 0
}

export class Constant1 implements BitStreamBase {
  get = () => 1
}