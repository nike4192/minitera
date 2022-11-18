
<script setup lang="ts">

import {onMounted, onUnmounted, provide, ref} from "vue";

import {bta} from "./core/utils";
import {Block, Macros} from "@/core/modules";
import {ALU} from "@/core/elements";
import {Mode, Op} from "@/core/types";
import {Variable} from "@/core/units";

import {useEditorStore} from "@/stores/editor.store";

import Panel from "./components/Panel.vue";
import MacrosViewer from "./components/MacrosViewer.vue";
import DebuggerSession from "./components/DebuggerSession.vue";
import MacrosDialog from "./components/dialogs/MacrosDialog.vue";
import ContextMenu from "@/components/helpers/ContextMenu.vue";

const editor = useEditorStore();
const contextmenu = ref(null);
const macrosViewer = ref(null);
const debuggerSession = ref(null);

provide('viewer', macrosViewer);
provide('contextmenu', contextmenu);

// TODO: Remove after
{
  let macros = new Macros();
  macros.createMap(2, 1);

  macros.setBlock(0, 0, new Block({
    alu: new ALU({
      operation: Op.And,
      inputs: ['LHI', 'LLI', 'UHI'],
      outputs: ['RLO'],
      mask: 'M'
    })
  }));

  macros.setBlock(1, 0, new Block({
    alu: new ALU({
      operation: Op.And,
      inputs: ['LLI', 'UHI', 'ULI'],
      outputs: ['DHO'],
      mask: 'M'
    })
  }));

  let variables = [
    new Variable(true, 0, 0, 'LHI', [
      1, ...bta(0b10101), 1, ...bta(0b1000001)
    ]),
    new Variable(true, 0, 0, 'LLI', [
      1, ...bta(0b10101), 1, ...bta(0b1000001)
    ]),
    new Variable(true, 0, 0, 'UHI',
        bta(0b1111111111111)
    ),
    new Variable(false, 0, 0, 'RLO'),
    new Variable(true, 1, 0, 'UHI', [
      1, 1, ...bta(0b10101), 1, ...bta(0b1000001)
    ]),
    new Variable(true, 1, 0, 'ULI', [
      0, ...bta(0b1111111111111)
    ]),
    new Variable(false, 1, 0, 'DHO')
  ];

  macros.init(variables);

  editor.macros = macros;
}

async function onKeyDown(e: KeyboardEvent) {

  if (e.ctrlKey) {
    switch (e.code) {
      case 'KeyE':
        e.preventDefault();
        editor.exportMacros();
        break;
      case 'KeyI':
        e.preventDefault();
        await editor.importMacros();
        break;
      case 'KeyN':
        e.preventDefault();
        editor.createMacros();
        break;
    }
  }

  if (e.ctrlKey || e.altKey) return;

  switch(e.code) {
    case 'Escape':
      editor.setMode(null);
      break;
    case 'Space':
      debuggerSession.value.iterate();
      break;
    case 'KeyG':
      console.log(editor.blockDrawParams);
      editor.blockDrawParams.drawPinsGrid = !editor.blockDrawParams.drawPinsGrid;
      break;
    case 'KeyN':
      editor.blockDrawParams.withPinNames = !editor.blockDrawParams.withPinNames;
      break;
    case 'KeyA':
      editor.setMode(Mode.ALU);
      break;
    case 'KeyT':
      editor.setMode(Mode.Transit);
      break;
    case 'KeyR':
      editor.setMode(Mode.Register);
      break;
    case 'Digit1': case 'Digit2': case 'Digit3':
      editor.setNumber(parseInt(e.key));
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

</script>

<template lang="pug">

template(v-if="editor.macros")
  panel
  macros-viewer(ref="macrosViewer")
  debugger-session(ref="debuggerSession")
  context-menu(ref="contextmenu")

template(v-else)
  macros-dialog(@update-macros="editor.macros = $event")

</template>

<style scoped>

</style>