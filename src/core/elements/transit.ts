import {Pin} from "@/core/types";

export class Transit {
  from?: Pin;
  to?: Pin;
  delay: number;

  constructor(params: any = {}) {
    this.from = params.from;
    this.to = params.to;
    this.delay = params.delay || 0;
  }

  toJSON() {
    let object: any = {};

    object.from = this.from;
    object.to = this.to;
    object.delay = this.delay;

    return object;
  }

  static fromJSON(json) {
    let { from, to, delay } = json;
    return new Transit({
      from, to, delay
    });
  }
}
