
export enum Pin {
  FBO = 'FBO', C1  = 'C1',  C0  = 'C0',  FBI = 'FBI',
  ULI = 'ULI', UHI = 'UHI', UHO = 'UHO', ULO = 'ULO',
  LLO = 'LLO', LHO = 'LHO', LHI = 'LHI', LLI = 'LLI',
  RLI = 'RLI', RHI = 'RHI', RHO = 'RHO', RLO = 'RLO',
  DLO = 'DLO', DHO = 'DHO', DHI = 'DHI', DLI = 'DLI',
}

export enum Op {
  NOP = 'NOP',
  And = 'And',
  Xor = 'Xor',
  NAnd = 'NAnd',
  Impl = 'Impl',
  NImpl = 'NImpl'
}

export enum Mask {
  M = 'M',
  S = 'S'
}

export enum Mode {
  ALU = 'ALU',
  Transit = 'Transit',
  Register = 'Register'
}

export enum Side {
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left'
}

export enum Direction {
  Horizontal = 'horizontal',
  Vertical = 'vertical'
}

export enum ContextMenuEnum {
  HorizontalRule = 'hr'
}

export abstract class BitStreamBase {
  abstract get(index: number): number;
}

export type Streams = {
  [key in Pin]?: BitStreamBase | null
}

export class Snapshot {
  imageBitmap: ImageBitmap;
  viewMatrix: DOMMatrix2DInit;

  constructor(imageBitmap, viewMatrix) {
    this.imageBitmap = imageBitmap;
    this.viewMatrix = viewMatrix;
  }

  draw(ctx: CanvasRenderingContext2D, m: DOMMatrix2DInit) {
    let imageBitmap = this.imageBitmap;
    let sWidth = imageBitmap.width;
    let sHeight = imageBitmap.height;
    
    let _m = this.viewMatrix;
    let sx = m.a / _m.a, sy = m.d / _m.d;
    let tx = (m.e - _m.e * sx), ty = (m.f - _m.f * sy);
    let dWidth = sx * sWidth;
    let dHeight = sy * sHeight;

    ctx.drawImage(imageBitmap,
      0, 0, sWidth, sHeight,
      tx, ty, dWidth, dHeight);
  }
}