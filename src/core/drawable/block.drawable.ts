
import {Op} from "@/core/types";
import {Block} from "@/core/modules";
import {DirtyInheritance} from "@/core/utils";

const arrowPath = new Path2D('M-3 0 3 0 0 7 Z');
const registerBlockPath = new Path2D('M-6 0 L6 0 L6 24 L-6 24 Z');
const inPinPath = new Path2D('M-5 0 L5 0 L4.2 4 L-4.2 4 Z');
const outPinPath = new Path2D('M-5 0 L5 0 L5.8 4 L-5.8 4 Z');

const blockDrawParamsDefault = {
  drawPinsGrid: false,
  withPinNames: false
};

@DirtyInheritance(Block)
export class BlockDrawable extends Block {
  public static gridLines = [0.15, 0.3, 0.45, 0.55, 0.7, 0.85];

  public static gridLambda(i: number, j: number) {
    return (
      (+!!(i - 6) ^ +!!j) ||
      (+!!i ^ +!!(j - 6)) ||
      (i === 6 || j === 6)
    ) && (
      (i !== 3 && j !== 3)
    )
  }

  public static getGridPin(i, j) {
    return (
      i === 0 && j === 0 ? 'FBO' :
        i === 6 && j === 6 ? 'FBI' :
          i === 0 && j === 6 ? 'C0' :
            i === 6 && j === 0 ? 'C1' :
              i === 0 ? 'L' + ['H', 'L'][Math.abs(j - 3) - 1] + ['I', 'O'][Number(j < 3)] :
                i === 6 ? 'R' + ['H', 'L'][Math.abs(j - 3) - 1] + ['I', 'O'][Number(j > 3)] :
                  j === 0 ? 'U' + ['H', 'L'][Math.abs(i - 3) - 1] + ['I', 'O'][Number(i > 3)] :
                    j === 6 ? 'D' + ['H', 'L'][Math.abs(i - 3) - 1] + ['I', 'O'][Number(i < 3)] :
                      null
    );
  }

  public static gridPinPositions = {
    FBO: [0, 0], C1:  [6, 0], C0:  [0, 6], FBI: [6, 6],
    ULI: [1, 0], UHI: [2, 0], UHO: [4, 0], ULO: [5, 0],
    LLO: [0, 1], LHO: [0, 2], LHI: [0, 4], LLI: [0, 5],
    RLI: [6, 1], RHI: [6, 2], RHO: [6, 4], RLO: [6, 5],
    DLO: [1, 6], DHO: [2, 6], DHI: [4, 6], DLI: [5, 6],
  }

  getGridPinPosition(pin) {
    let { gridPinPositions, gridLines } = BlockDrawable;
    let [ i, j ] = gridPinPositions[pin];
    let x1 = i ? gridLines[i - 1]: 0, x2 = gridLines[i] || 1;
    let y1 = j ? gridLines[j - 1]: 0, y2 = gridLines[j] || 1;
    let cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    return [cx, cy];
  }

  getGridPinNormal(pin) {
    return (
      pin === 'FBO' ? [ Math.SQRT1_2,  Math.SQRT1_2] :
        pin === 'C1'  ? [-Math.SQRT1_2,  Math.SQRT1_2] :
          pin === 'FBI' ? [-Math.SQRT1_2, -Math.SQRT1_2] :
            pin === 'C0'  ? [ Math.SQRT1_2, -Math.SQRT1_2] :
              pin[0] === 'L' ? [1, 0] :
                pin[0] === 'R' ? [-1, 0] :
                  pin[0] === 'U' ? [0, 1] :
                    pin[0] === 'D' ? [0, -1] :
                      null
    );
  }

  drawBackground(ctx, odd, size) {
    ctx.fillStyle = `hsl(120deg 40% ${!odd ? 70 : 90}%)`;
    ctx.fillRect(0, 0, size, size);
  }

  drawPinsGrid(ctx, size) {
    let { gridLines, gridLambda } = BlockDrawable;

    ctx.save();

    for (let i = 0; i <= gridLines.length; i++) {
      for (let j = 0; j <= gridLines.length; j++) {
        if (!gridLambda(i, j)) continue;
        let x1 = i ? gridLines[i - 1]: 0, x2 = gridLines[i] || 1;
        let y1 = j ? gridLines[j - 1]: 0, y2 = gridLines[j] || 1;
        let x = x1 * size, y = y1 * size;
        let w = (x2 - x1) * size, h = (y2 - y1) * size;
        ctx.fillStyle = `hsl(${(x1 + y2) * 180}deg, 80%, 80%)`;
        ctx.fillRect(x, y, w, h);
      }
    }

    ctx.restore();
  }

  drawText(ctx, size) {
    if (this.alu.operation === Op.NOP) return;

    ctx.save();

    let titleGap = 0.1;

    let cx = size / 2;
    let cy = size / 2;

    ctx.fillStyle = 'black';

    ctx.font = `bold ${size * 0.2}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.alu.operation, cx, cy - size * titleGap);

    let s = '';
    if (this.alu.mask === 'M') {
      ctx.font = `italic ${size * 0.15}px monospace`;
      s = 'Mask';
    } else {
      ctx.font = `bold ${size * 0.15}px monospace`;
      ctx.textAlign = 'left';
      s = this.alu.wordLength.toString().padStart(2, '0');
    }
    ctx.fillText(s, cx, cy + size * titleGap);

    ctx.restore();
  }

  drawPin(ctx, pin, m, x, y, size, withPinNames) {
    let highlightStyle = '#29f';
    let skew = 1.88;

    ctx.setTransform(m.translate(x * size, y * size).scale(size / 100));

    let py = 0;

    if (['FBO', 'C1', 'C0', 'FBI'].includes(pin)) {
      ctx.strokeStyle = pin === this.hoverPin ? highlightStyle : '#A0A0A0';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      let isInput = pin[2] === 'I';
      let pinPath = isInput ? inPinPath : outPinPath;
      let isConnected = isInput
        ? this.alu.inputs.includes(pin)
        : this.alu.outputs.includes(pin);
      if (isConnected) ctx.scale(1, skew);
      ctx.fillStyle = pin === this.hoverPin ? highlightStyle : '#A0A0A0';
      ctx.fill(pinPath);
      if (isConnected) {
        ctx.scale(1, 1 / skew);
        py = 15;
      } else {
        py = 10;
      }
    }

    if (withPinNames) {
      ctx.fillStyle = '#000';
      ctx.fillText(pin, 0, py);
    }
  }

  drawPins(ctx, size, withPinNames) {
    let a = 0.3, b = 0.7, dis = 0.075, d = 0.075;

    let mc = ctx.getTransform();

    ctx.save();

    ctx.font = `italic 5px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#999';

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let angle = (-j || 1) * i * 90 - j * 90;
        let m = mc.translate(i * size, j * size).rotate(angle);
        for (let k = 0; k < 2; k++) {
          let at = k ? a : b;
          let pinPath = k ? inPinPath : outPinPath;

          let n = j << 1 | i;

          let p1 = ['FBO', 'C1', 'C0', 'FBI'][n];
          let p2 = ['U', 'R', 'L', 'D'][n] + ['H', 'L'][k] + ['O', 'I'][k];
          let p3 = ['U', 'R', 'L', 'D'][n] + ['L', 'H'][k] + ['O', 'I'][k];

          this.drawPin(ctx, p1, m, d, d, size, withPinNames);
          this.drawPin(ctx, p2, m, at - dis, 0, size, withPinNames);
          this.drawPin(ctx, p3, m, at + dis, 0, size, withPinNames);
        }
      }
    }
    ctx.setTransform(mc);
    ctx.restore();
  }

  skewPinPosition(pin, offset) {
    if (['FBO', 'C1', 'C0', 'FBI'].includes(pin)) {

    } else {

    }
  }

  drawConnection(ctx, input, output, size, type = 'alu', offset = 0) {
    let [inx, iny] = this.getGridPinNormal(input);
    let [icx, icy] = this.getGridPinPosition(input);
    let [ocx, ocy] = this.getGridPinPosition(output);
    let [onx, ony] = this.getGridPinNormal(output);

    let x1 = icx, y1 = icy;
    let x2 = ocx, y2 = ocy;

    let dist = Math.max(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2, 0.2);

    let cp1x = dist * inx + icx, cp1y = dist * iny + icy;
    let cp2x = dist * onx + ocx, cp2y = dist * ony + ocy;

    let angle;
    switch(type) {
      case 'transit':
        angle = Math.atan2( - ony, - onx ) - Math.PI / 2;
        ctx.save();
        ctx.translate(ocx * size, ocy * size);
        ctx.rotate(angle);
        ctx.fill(arrowPath);
        ctx.restore();
        break;
      case 'register':
        ctx.strokeStyle = 'red';
        angle = Math.atan2( - ony, - onx ) - Math.PI / 2;

        cp2x = dist * onx + ocx, cp2y = dist * ony + ocy;
        x2 = (ocx + onx * 0.15), y2 = (ocy + ony * 0.15);

        ctx.save();
        ctx.translate((ocx + onx * 0.15) * size, (ocy + ony * 0.15) * size);
        ctx.rotate(angle);
        ctx.fillStyle = 'white';
        ctx.fill(registerBlockPath);
        ctx.stroke(registerBlockPath);
        ctx.restore();
        break;
    }

    ctx.beginPath();
    ctx.moveTo(x1 * size, y1 * size);
    ctx.bezierCurveTo(cp1x * size, cp1y * size, cp2x * size, cp2y * size, x2 * size, y2 * size);
    ctx.stroke();
  }

  drawConnections(ctx, size) {
    let transitColors = [
      '#0F0',
      '#00F',
      '#F00'
    ];
    let ns = 0.035;
    ctx.save();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size * 0.04}px monospace`;
    ctx.fillStyle = 'black';

    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 3;

    for (let i = 0; i < this.alu.inputs.length; i++) {
      let input = this.alu.inputs[i];
      if (!input) continue;
      let [inx, iny] = this.getGridPinNormal(input);
      let [icx, icy] = this.getGridPinPosition(input);
      if (this.alu.outputs[0]) {
        let output = this.alu.outputs[0];
        this.drawConnection(ctx, input, output, size);
      }
      ctx.fillStyle = '#444';
      ctx.fillText('I' + (i + 1), (- inx * ns + icx) * size, (- iny * ns + icy) * size);
    }

    for (let i = 0; i < this.alu.outputs.length; i++) {
      let output = this.alu.outputs[i];
      if (!output) continue;
      let [ocx, ocy] = this.getGridPinPosition(output);
      let [onx, ony] = this.getGridPinNormal(output);
      ctx.fillStyle = '#444';
      ctx.fillText('O' + (i + 1), (- onx * ns + ocx) * size, (- ony * ns + ocy) * size);
    }

    for (let i = 0; i < this.transits.length; i++) {
      let transit = this.transits[i];
      if (transit && transit.from && transit.to) {
        ctx.strokeStyle = ctx.fillStyle = transitColors[i];
        this.drawConnection(ctx, transit.from, transit.to, size, 'transit');
      }
    }

    let register = this.register;
    if (register && register.from && register.to) {
      this.drawConnection(ctx, register.from, register.to, size, 'register');
    }

    ctx.restore();
  }

  draw(ctx, m, r, c, size, params = blockDrawParamsDefault) {
    let x = r * size;
    let y = c * size;

    m = m.translate(x, y);

    ctx.setTransform(m);

    let odd = (r + c) % 2;
    this.drawBackground(ctx, odd, size);
    if (params.drawPinsGrid) this.drawPinsGrid(ctx, size);
    this.drawText(ctx, size);
    this.drawPins(ctx, size, params.withPinNames);
    this.drawConnections(ctx, size);
  }
}
