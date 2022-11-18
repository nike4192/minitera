import {Pin} from "@/core/types";

export class Register {
  from?: Pin;
  to?: Pin;
  length: number;

  constructor(params: any = {}) {
    this.from = params.from;
    this.to = params.to;
    this.length = params.length || 64;
  }

  toJSON() {
    let object: any = {};

    object.from = this.from;
    object.to = this.to;
    object.length = this.length;

    return object;
  }

  static fromJSON(json) {
    let { from, to, length } = json;
    return new Register({
      from, to, length
    });
  }
}
