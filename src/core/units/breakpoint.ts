
import { Variable } from "@/core/units/variable";
import { BitStream } from "@/core/elements";

export class Breakpoint {
  variable: Variable;
  stream: BitStream;

  constructor(variable, stream) {
    this.variable = variable;
    this.stream = stream;
  }
}
