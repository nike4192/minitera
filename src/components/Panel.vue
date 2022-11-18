
<script setup lang="ts">

import {ContextMenuEnum, Mode} from "@/core/types";

import {computed, inject, ref} from "vue";
import ScrollSelect from "@/components/inputs/ScrollSelect.vue";
import ContextMenu from "@/components/helpers/ContextMenu.vue";
import PanelButton from "@/components/helpers/PanelButton.vue";
import {importMacros} from "@/core/editor.service";
import {useEditorStore} from "@/stores/editor.store";
import {storeToRefs} from "pinia";

const editor = useEditorStore();
const { mode, number } = storeToRefs(editor);

const subModes = computed(() => {
  switch (mode.value) {
    case Mode.ALU:
      return [1, 2, 3];
    case Mode.Transit:
      return [1, 2, 3];
    case Mode.Register:
      return null;
  }
});

const fileContextMenu = computed(() => {
  return [
    {
      label: 'New',
      shortcut: ['Ctrl', 'N'],
      handler: () => {
        editor.createMacros();
        return true;
      }
    },
    ContextMenuEnum.HorizontalRule,
    {
      label: 'Import',
      shortcut: ['Ctrl', 'I'],
      handler: async () => {
        await editor.importMacros();
        return true;
      }
    },
    ContextMenuEnum.HorizontalRule,
    {
      label: 'Export',
      shortcut: ['Ctrl', 'E'],
      handler: () => {
        editor.exportMacros();
        return true;
      }
    }
  ]
});

</script>

<template lang="pug">

.panel
  .panel-group
    panel-button(:options="fileContextMenu") File

  .panel-group
    scroll-select(
      :options="Mode"
      v-model="mode")
    scroll-select(
      v-if="subModes"
      :options="subModes"
      v-model="number")

  .panel-group

</template>

<style lang="stylus">

.panel {
  display: flex;
  align-items: center;
  justify-content space-between
  height: 1.5em;
  font-size: 1.2em;
  border-bottom: 1px solid lightgray;

  .panel-group {
    height 100%

    button.panel-button {
      padding 0 1em
      font-size 0.9rem
      height 100%
      background-color transparent
      border none

      &:hover {
        background-color #0001
      }
    }
  }
}

</style>
