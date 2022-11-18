import {Macros} from "@/core/modules";
import {BlockDrawable} from "@/core/drawable/block.drawable";
import {DirtyInheritance} from "@/core/utils";

@DirtyInheritance(Macros)
export class MacrosDrawable extends Macros {

  render(
    ctx: CanvasRenderingContext2D,
    m: DOMMatrix2DInit,
    width: number,
    height: number,
    blockSize: number,
    params
  ): void {
    ctx.setTransform(m);

    for (let c = 0; c < this.x; c++) {
      let x1 = (c * blockSize) * m.a + m.e;
      let x2 = ((c + 1) * blockSize) * m.a + m.e;

      if (x1 < 0 && x2 < 0) continue;
      if (x1 > width && x2 > width) break;

      for (let r = 0; r < this.y; r++) {
        let block = this.getBlock(c, r) as BlockDrawable;
        let y1 = (r * blockSize) * m.a + m.f;
        let y2 = ((r + 1) * blockSize) * m.a + m.f;

        if (y1 < 0 && y2 < 0) continue;
        if (y1 > height && y2 > height) break;

        block.draw(ctx, m, c, r, blockSize, params);
      }
    }
    ctx.resetTransform();
  }
}