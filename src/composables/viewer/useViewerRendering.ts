import {nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import { Snapshot } from "@/core/types";
import { blockSize } from "@/core/constants";

export default function useViewerRendering(canvas, macros, viewMatrix, blockDrawParams) {

  const snapshot = ref(null);
  const canvasRect = ref(null);

  const scaleFactor = 0.7;

  async function makeSnapshot() {
    snapshot.value = new Snapshot(
      await createImageBitmap(canvas.value, 0, 0, canvas.value.width, canvas.value.height),
      viewMatrix.value
    );
  }

  async function render(forceUpdate = false) {
    let ctx = canvas.value.getContext('2d');

    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    let needResize = canvasResize();
    let needRedraw = true || forceUpdate || !snapshot.value;

    if (needRedraw) {
      macros.value.render(
        ctx,
        viewMatrix.value,
        canvas.value.width,
        canvas.value.height,
        blockSize,
        blockDrawParams.value);
      await makeSnapshot();
      // this.needRedraw = false;
      // console.log('redraw');
    } else {
      snapshot.value.draw(ctx, viewMatrix.value);
    }
  }


  function centeredMacros() {
    let boundingRect = new DOMRect(0, 0, macros.value.x * blockSize, macros.value.y * blockSize);
    let sx = canvas.value.width / boundingRect.width * scaleFactor;
    let sy = canvas.value.height / boundingRect.height * scaleFactor;
    let s = Math.min(sx, sy);

    let tx = (canvas.value.width - boundingRect.width * s) / 2;
    let ty = (canvas.value.height - boundingRect.height * s) / 2;

    viewMatrix.value = new DOMMatrix()
      .translate(tx, ty)
      .scale(s);
  }

  function canvasResize() {
    let canvasElement = canvas.value;
    let needResize = canvasElement.offsetWidth !== canvasElement.width ||
                     canvasElement.offsetHeight !== canvasElement.height;

    if (needResize) {
      canvasElement.width = canvasElement.offsetWidth;
      canvasElement.height = canvasElement.offsetHeight;
      canvasRect.value = canvasElement.getBoundingClientRect();
    }

    return needResize;
  }

  function alignCenterViewMatrix(newRect, oldRect) {
    let m = viewMatrix.value;

    let dx = oldRect.width - newRect.width;
    let dy = oldRect.height - newRect.height;

    viewMatrix.value = m.translate(-dx / m.a / 2, -dy / m.a / 2);
  }


  onMounted(() => {
    window.addEventListener('resize', canvasResize);

    canvasRect.value = canvas.value.getBoundingClientRect();
    watch(canvasRect, alignCenterViewMatrix);
    watch(macros, () => nextTick(centeredMacros));
    watch(viewMatrix, async () => {await render();});
    watch(blockDrawParams, async () => {await render();});

    canvasResize();
    centeredMacros();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', canvasResize)
  });

  return {
    canvasRect,
    render
  }
}
