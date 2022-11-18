import {ALU, BitStream, Constant0, Constant1, Register, Transit} from "@/core/elements";
import {Mode, Op, Pin, Streams} from "@/core/types";
import {inputPins, outputPins} from "@/core/constants";
import {EventDispatcher} from "@/core/event-dispatcher/EventDispatcher";

export class Block extends EventDispatcher {
  alu: ALU;
  register?: Register;
  transits: Array<Transit | null>;
  streams: Streams = {};

  hoverPin?: Pin = null;

  constructor(params: any = {}) {
    super();
    this.alu = params.alu || new ALU;
    this.register = params.register || new Register;
    this.transits = params.transits || [];

    this.streams.C0 = new Constant0;
    this.streams.C1 = new Constant1;
    this.streams.FBI = new BitStream();
    this.streams.FBO = new BitStream();
  }

  public static isInputPin(pin: Pin): boolean | undefined {
    return inputPins.includes(pin) ? true :
           outputPins.includes(pin) ? false :
           undefined;
  }

  setPin(pin, mode, index) {
    let isInput = Block.isInputPin(pin);
    console.log(isInput);
    if (isInput === undefined) {
      throw new Error(`Pin ${pin} is not implemented`);
    }

    switch(mode) {
      case Mode.ALU:
        if (isInput) this.alu.inputs[index] = pin;
        else         this.alu.outputs[index] = pin;
        break;
      case Mode.Transit:
        let transit = this.transits[index];
        if (!transit) {
          transit = new Transit();
          this.transits[index] = transit;
        }
        if (isInput) transit.from = pin;
        else         transit.to = pin;
        break;
      case Mode.Register:
        if (!this.register) {
          this.register = new Register();
          if (isInput) this.register.from = pin;
          else 	       this.register.to   = pin;
        }
        break;
    }

    if (!this.streams[pin]) {
      this.streams[pin] = new BitStream();
    }
  }

  resetPin(pin, mode) {
    let isInput = Block.isInputPin(pin);
    if (isInput === undefined) {
      throw new Error(`Pin ${pin} is not implemented`);
    }

    switch(mode) {
      case Mode.ALU:
        if (isInput) {
          let index = this.alu.inputs.indexOf(pin);
          if (index !== -1) this.alu.inputs[index] = null;
        } else {
          let index = this.alu.outputs.indexOf(pin);
          if (index !== -1) this.alu.outputs[index] = null;
        }
        break;

      case Mode.Transit:
        for (let transit of this.transits) {
          if (transit) {
            if (isInput) {
              if (transit.from === pin) {
                delete transit.from;
                break;
              }
            } else {
              if (transit.to === pin) {
                delete transit.to;
                break;
              }
            }
          }
        }
        break;

      case Mode.Register:
        let register = this.register;
        if (register) {
          if (register.from === pin) delete register.from;
          if (register.to === pin) delete register.to;
        }
        break;
    }
  }

  bind(side, block) {
    let tb = this.streams;
    let ob = block.streams;

    switch(side) {
      case 'L':
        let {RHO, RLO} = ob;
        let {LHI, LLI} = tb;

        if (RHO) tb.LHI = RHO;
        if (RLO) tb.LLI = RLO;
        if (LHI) ob.RHO = LHI;
        if (LLI) ob.RLO = LLI;

        break;
      case 'U':
        let {DHO, DLO} = ob;
        let {UHI, ULI} = tb;

        if (DHO) tb.UHI = DHO;
        if (DLO) tb.ULI = DLO;
        if (UHI) ob.DHO = UHI;
        if (ULI) ob.DLO = ULI;

        break;
    }
  }

  clear() {
    this.alu.clear();
  }

  getInputs() {
    return this.alu.inputs.map(i => this.streams[i]);
  }

  getOutputs() {
    return this.alu.outputs.map(i => this.streams[i]);
  }

  calculate(a: number, b: number) {
    switch(this.alu.operation) {
      case Op.And: return a & b;
      case Op.Xor: return a ^ b;
      case Op.NAnd: return !(a & b);
      case Op.Impl: return +!a | b;
      case Op.NImpl: return a | +!b;
    }
  }

  handleTransits(): void {
    for (let transit of this.transits) {
      if (transit && transit.from && transit.to) {
        let {from, to} = transit;
        let input = this.streams[from];
        let output = this.streams[to];
        if (input && output && output instanceof BitStream) {
          output.enqueue(transit.delay + 1, input.get(0));
        } else {
          throw new Error(`Handle Transits: for input ${from} and output ${to} should be set streams`);
        }
      }
    }
  }

  handleRegister(): void {
    let register = this.register;
    if (register && register.from && register.to) {
      let {from, to} = register;
      let input = this.streams[from];
      let output = this.streams[to];
      if (input && output && output instanceof BitStream) {
        output.enqueue(register.length + 1, input.get(0));
      } else {
        throw new Error(`Handle Register: for input ${from} and output ${to} should be set streams`);
      }
    }
  }

  handleALU(): void {
    if (this.alu.operation === Op.NOP) return;

    let [i1, i2, i3] = this.getInputs();
    let [o1, o2] = this.getOutputs();
    let alu = this.alu;

    if (! (i1 && i2)) return;

    switch (alu.mask) {
      case 'M':
        if (i3 && o1 && o1 instanceof BitStream) {
          let m = i3.get(0);
          if (m) {
            let a = i1.get(1);
            let b = i2.get(1);
            let c = this.calculate(a, b);
            o1.enqueue(2, c);
          } else {
            o1.enqueue(2, 0);  // Filled zeros
          }
        } else {
          throw new Error(`Handle ALU with External Mask: for input ${alu.inputs[2]} and output ${alu.outputs[0]} should be set streams`);
        }
        break;
      case 'S':
        let a = i1.get(0), b = i2.get(0);
        if (o1 && o1 instanceof BitStream &&
          o2 && o2 instanceof BitStream
        ) {
          if (alu.bitCounter > 0) {
            let c = this.calculate(a, b);
            alu.bitCounter--;
            o1.enqueue(1, c);
            o2.enqueue(1, 0);
          } else {
            if (a && b) {
              alu.bitCounter = alu.wordLength;
              o1.enqueue(1, 0);  // Filled zeros
              o2.enqueue(1, 1);
            }
          }
        } else {
          throw new Error(`Handle ALU with Start Bit Mask: for first output ${alu.outputs[0]} and second output ${alu.outputs[1]} should be set streams`);
        }
    }
  }

  handleFeedback() {
    let { FBI, FBO } = this.streams;
    (FBO as BitStream).enqueue(1, FBI.get(0));
  }

  iterate() {
    this.handleFeedback();
    this.handleTransits();
    this.handleRegister();
    this.handleALU();
  }

  toJSON() {
    let object: any = {};

    object.alu = this.alu.toJSON();
    object.register = this.register.toJSON();
    object.transits = this.transits.map(t => t.toJSON());

    return object;
  }

  static fromJSON(json) {
    let alu = ALU.fromJSON(json.alu);
    let register = Register.fromJSON(json.register);
    let transits = json.transits.map(t => Transit.fromJSON(t));

    return new Block({
      alu, register, transits
    });
  }
}
