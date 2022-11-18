import {inject, nextTick, onBeforeUnmount, onMounted, onUnmounted, Ref} from "vue";
import {Mask, Mode, Op} from "@/core/types";
import {useEditorStore} from "@/stores/editor.store";
import {storeToRefs} from "pinia";


export default function useViewerContextMenu(canvas, macros, navigationStates, render) {

  const editor = useEditorStore();
  const { mode } = storeToRefs(editor);

  const contextmenu: Ref = inject('contextmenu');

  function blockContextMenu(block, e) {
    return [
      {
        label: 'Operation',
        subItems: Object.keys(Op).map(op => {
          return {
            label: op,
            value: Op[op],
            checked: block.alu.operation === Op[op],
            handler: (v) => {
              block.alu.operation = v;
              showBlockContextMenu(block, e);
              render();
            }
          }
        })
      },
      {
        label: 'Mask',
        subItems: [
          {
            label: 'External',
            checked: block.alu.mask === Mask.M,
            value: Mask.M,
            handler: (v) => {
              block.alu.mask = v;
              showBlockContextMenu(block, e);
              render();
              return true;
            }
          },
          {
            label: 'Start Bit',
            checked: block.alu.mask === Mask.S,
            value: Mask.S,
            handler: (v) => {
              let wordLength = prompt('Word Length', '64');
              if (wordLength) {
                block.alu.mask = v;
                block.alu.wordLength = parseInt(wordLength);
                render();
                return true;
              }
            }
          }
        ]
      }
    ];
  }

  function pinContextMenu(block, pin) {
    return [
      {
        label: 'Add variable',
        handler: async () => {
          macros.value.addVariable(block, pin);
          await nextTick(render);
          return true;
        }
      }
    ]
  }

  function showBlockContextMenu(block, e) {
    contextmenu.value.show(blockContextMenu(block, e), e);
  }

  function showPinContextMenu(block, pin, e) {
    contextmenu.value.show(pinContextMenu(block, pin), e);
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault();

    let { hover } = navigationStates.value;
    if (hover.block) {
      if (hover.pin) {
        if (!mode.value) {
          showPinContextMenu(hover.block, hover.pin, e);
        }
      } else {
        showBlockContextMenu(hover.block, e);
      }
    }
  }

  onMounted(() => {
    canvas.value.addEventListener('contextmenu', onContextMenu);
  });

  onBeforeUnmount(() => {
    canvas.value.removeEventListener('contextmenu', onContextMenu);
  });
}