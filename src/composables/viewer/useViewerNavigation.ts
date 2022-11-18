import {inject, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch} from "vue";
import { Mode } from "@/core/types";
import { BlockDrawable } from "@/core/drawable";
import { blockSize } from "@/core/constants";
import {useEditorStore} from "@/stores/editor.store";
import {storeToRefs} from "pinia";
import {set} from "vue-demi";

export default function useViewerNavigation(canvas, macros, viewMatrix, render) {

  const editor = useEditorStore();
  const { mode, number } = storeToRefs(editor);

  const states = ref({
    pressed: {
      viewMatrix: null,
      block: null,
      pin: null
    },
    hover: {
      block: null,
      pin: null
    }
  });

  const mouse = ref({
    down: null,
    scrollFactor: 0.3,
    zoomFactor: 0.3,
    selection: true
  });

  const touchpad = ref({
    zoomFactor: 2
  })

  function onMouseDown(e) {
    const { pressed, hover } = states.value;

    mouse.value.down = e;

    pressed.viewMatrix = viewMatrix.value;
    pressed.block = hover.block;
    pressed.pin = hover.pin;
  }

  function onMouseUp(e) {
    const { pressed, hover } = states.value;

    mouse.value.down = null;

    if (hover.block && pressed.block === hover.block &&
        hover.pin && pressed.pin === hover.pin
    ) {
      if (hover.block.hoverPin) {
        clickPinHandler(e);
      } else {
        clickBlockHandler(e);
      }
    }
  }

  function clickPinHandler(e) {
    const { hover } = states.value;

    let block = hover.block;
    let pin = hover.pin;

    switch (mode.value) {
      case Mode.ALU:
      case Mode.Transit:
      case Mode.Register:
        if (e.button === 0) {
          block.setPin(pin, mode.value, <number>number.value - 1);
          render();
        } else if (e.button === 2) {
          block.resetPin(pin, mode.value);
          render();
        }
        break;
    }
  }

  function clickBlockHandler(e) {
    let { block } = states.value.hover;
    // if (e.button === 2) {
    //   this.showContextMenuByMouseEvent(e, block);
    // } else {
    //   this.contextmenu = null;
    // }
  }

  function onZoom(e: WheelEvent) {
    let m = viewMatrix.value;

    let delta = e.deltaX || e.deltaY;
    let scaleDelta = Math.abs(delta) < 50
      ? touchpad.value.zoomFactor
      : mouse.value.zoomFactor;
    let s = (blockSize - delta * scaleDelta) / blockSize;
    let x = e.offsetX / m.a - m.e / m.a;
    let y = e.offsetY / m.d - m.f / m.d;

    viewMatrix.value = m.scale(s, s, 1, x, y, 0);
  }

  function onScroll(e: WheelEvent) {
    let m = viewMatrix.value;

    let { deltaX, deltaY } = e;
    if (e.shiftKey) {
      [deltaX, deltaY] = [deltaY, deltaX];
    }

    let tx = - deltaX * mouse.value.scrollFactor;
    let ty = - deltaY * mouse.value.scrollFactor;

    viewMatrix.value = m.translate(tx, ty);
  }

  function onMove(e: MouseEvent) {
    let { pressed } = states.value;
    let { down } = mouse.value;

    let m = pressed.viewMatrix;
    let tx = e.clientX - down.clientX;
    let ty = e.clientY - down.clientY;

    viewMatrix.value = m.translate(tx / m.a, ty / m.a);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (e.ctrlKey) {
      onZoom(e);
    }
    if (!e.ctrlKey && !e.altKey) {
      onScroll(e);
    }
  }

  function onMouseMove(e) {
    let { down } = mouse.value;

    if (down && down.button === 1) {
      onMove(e);
    }

    let { hover } = states.value;
    if (e.target === canvas.value) {
      let block = getBlockByMouseEvent(e);
      if (!block) {
        hover.block = null;
        hover.pin = null;
      } else {
        hover.block = block;
        hover.pin = getPinByMouseEvent(e);
        // set(hover, 'pin', getPinByMouseEvent(e));
      }
    } else {
      hover.block = null;
    }
  }

  function getBlockByMouseEvent(e) {
    let { offsetX, offsetY } = e;
    let m = viewMatrix.value;
    let size = blockSize * m.a;

    let x = Math.floor((offsetX - m.e) / size);
    let y = Math.floor((offsetY - m.f) / size);

    if (0 <= x && x < macros.value.x &&
        0 <= y && y < macros.value.y
    ) {
      return macros.value.getBlock(x, y);
    } else {
      return null;
    }
  }

  function getPinByMouseEvent(e) {
    let { offsetX, offsetY } = e;
    let m = viewMatrix.value;
    let size = blockSize * m.a;

    let bx = ((offsetX - m.e) % size) / size;
    let by = ((offsetY - m.f) % size) / size;

    let {
      gridLines, gridLambda, getGridPin
    } = BlockDrawable;

    for (let i = 0; i <= gridLines.length; i++) {
      for (let j = 0; j <= gridLines.length; j++) {
        if (!gridLambda(i, j)) continue;
        let x1 = i ? gridLines[i - 1] : 0, x2 = gridLines[i] || 1;
        let y1 = j ? gridLines[j - 1] : 0, y2 = gridLines[j] || 1;
        if (x1 <= bx && bx <= x2 &&
            y1 <= by && by <= y2
        ) {
          return getGridPin(i, j);
        }
      }
    }

    return null;
  }

  function onContextMenu(e: MouseEvent) {
  }

  onMounted(() => {

    canvas.value.addEventListener('mousedown', onMouseDown);
    canvas.value.addEventListener('wheel', onWheel, { passive: false });
    // canvas.value.addEventListener('contextmenu', onContextMenu);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

  })

  onBeforeUnmount(() => {
    canvas.value.removeEventListener('mousedown', onMouseDown);
    canvas.value.removeEventListener('wheel', onWheel);
    // canvas.value.removeEventListener('contextmenu', onContextMenu);

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  })

  // watch(viewMatrix, () => {
  //   // render
  // })

  return {
    viewMatrix,
    states,
    mouse
  }
}