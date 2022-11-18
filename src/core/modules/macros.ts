import {BitStreamBase} from "@/core/types";
import {BitStream} from "@/core/elements";
import {Variable} from "@/core/units";
import {Block} from "./block";

export class Macros {
  x: number;
  y: number;
  map: Block[][] = [];
  variables: Variable[] = [];
  streams: BitStreamBase[] = [];

  createMap(x, y) {
    this.x = x;
    this.y = y;

    for (let c = 0; c < x; c++) {
      this.map[c] = [];
      for (let r = 0; r < y; r++) {
        this.map[c][r] = new Block();
      }
    }
  }

  addVariable(block, pin): Variable {
    for (let c = 0; c < this.x; c++) {
      for (let r = 0; r < this.y; r++) {
        if (block === this.getBlock(c, r)) {
          let isInput = Block.isInputPin(pin);
          let variable = new Variable(isInput, c, r, pin);
          let stream = block.streams[pin] || new BitStream();
          block.streams[pin] = stream;

          let index = this.streams.indexOf(stream);
          if (index === -1) {
            this.streams.push(stream);
          }

          if (c > 0) block.bind('L', this.getBlock(c - 1, r));
          if (r > 0) block.bind('U', this.getBlock(c, r - 1));
          if (c < this.x - 1) this.getBlock(c + 1, r).bind('L', block);
          if (r < this.y - 1) this.getBlock(c, r + 1).bind('U', block);

          this.variables.push(variable);

          return variable;
        }
      }
    }
  }

  updateStreams(): void {
    let streams = [];
    for (let c = 0; c < this.x; c++) {
      for (let r = 0; r < this.y; r++) {
        let block = this.getBlock(c, r);
        let bs = Object.values(block.streams);
        let ubs = bs.filter((v, i, a) =>
          streams.indexOf(v) === -1 &&
          a.indexOf(v) === i &&
          v instanceof BitStream
        );
        streams = streams.concat(ubs);
      }
    }
    this.streams = streams;
  }

  init(variables: Variable[] = []): void {
    for (let variable of variables) {
      let { row, column, pin } = variable;
      let block = this.getBlock(column, row);
      let stream = block.streams[pin] || new BitStream();
      if (variable.isInput && stream instanceof BitStream) {
        stream.bits = Array.from(variable.bits);
      }
      block.streams[pin] = stream;
    }
    this.variables = variables;
    console.log(variables);

    for (let c = 0; c < this.x; c++) {
      for (let r = 0; r < this.y; r++) {
        let block = this.getBlock(c, r);
        if (c > 0) block.bind('L', this.getBlock(c - 1, r));
        if (r > 0) block.bind('U', this.getBlock(c, r - 1));
      }
    }
    this.updateStreams();
  }

  getBlock(x: number, y: number): Block {
    return this.map[x][y];
  }

  setBlock(x: number, y: number, block: Block): void {
    this.map[x][y] = block;
  }

  reset(): void {
    this.updateStreams();

    for (let stream of this.streams) {
      if (stream instanceof BitStream) {
        stream.clear();
      }
    }

    for (let variable of this.variables) {
      let { row, column, pin } = variable;
      let block = this.getBlock(column, row);
      block.clear();
      let stream = block.streams[pin];
      if (variable.isInput && stream instanceof BitStream) {
        stream.bits = Array.from(variable.bits);
      }
    }
  }

  iterate(): void {
    for (let c = 0; c < this.x; c++) {
      for (let r = 0; r < this.y; r++) {
        let block = this.map[c][r];
        block.iterate();
      }
    }

    for (let stream of this.streams) {
      if (stream instanceof BitStream) {
        let bit = stream.dequeue();
        stream.stash.push(bit);
      }
    }
    // console.log('iterate\n' + this.streams.map(s => ['bits', 'buffer', 'stash'].map(v => v.slice(0, 3) + ': ' + s[v].join('')).join('\n')).join('\n-----------\n'));
  }

  get isEmptyStreams(): boolean {
    for (let stream of this.streams) {
      if (stream instanceof BitStream && !stream.isEmpty) {
        return false;
      }
    }
    return true;
  }

  play(cb: Function): void {
    let counter = 0;
    while(!this.isEmptyStreams) {
      this.iterate();
      cb(counter++);
    }
  }

  toJSON(): any {
    let object: any = {};

    object.x = this.x;
    object.y = this.y;

    object.map = [];
    for (let c = 0; c < this.x; c++) {
      object.map[c] = [];
      for (let r = 0; r < this.y; r++) {
        let block = this.map[c][r];
        object.map[c][r] = block.toJSON();
      }
    }

    object.variables = this.variables.map(v => v.toJSON());

    return object;
  }

  static fromJSON(json): Macros {
    let { x, y } = json;

    let instance = new Macros();
    instance.x = x;
    instance.y = y;
    for (let c = 0; c < x; c++) {
      instance.map[c] = [];
      for (let r = 0; r < y; r++) {
        instance.map[c][r] = Block.fromJSON(json.map[c][r]);
      }
    }

    console.log(instance);

    let variables = json.variables.map(v => Variable.fromJSON(v));
    instance.init(variables);

    return instance;
  }
}
