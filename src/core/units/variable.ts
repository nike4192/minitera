import {Pin} from "@/core/types";

export class Variable {
  isInput: boolean;
  column: number;
  row: number;
  pin: Pin;
  bits: number[];

  constructor(isInput, column, row, pin, bits: any = []) {
    this.isInput = isInput;
    this.column = column;
    this.row = row;
    this.pin = pin;
    this.bits = bits;
  }

  toJSON() {
    let object: any = {};

    object.isInput = this.isInput;
    object.column = this.column;
    object.row = this.row;
    object.pin = this.pin;
    object.bits = Array.from(this.bits);

    return object;
  }

  static fromJSON(json) {
    let { isInput, column, row, pin, bits } = json;
    return new Variable(
      isInput, column, row, pin, Array.from(bits)
    );
  }
}
