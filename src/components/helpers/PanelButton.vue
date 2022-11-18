
<script setup lang="ts">

import {inject, onMounted, onUnmounted, ref} from "vue";

import ContextMenu from "@/components/helpers/ContextMenu.vue";

const props = defineProps({options: Array<any>});

const contextmenu = ref(null);
const button = ref(null);
// const contextmenu = inject('contextmenu');

function showContextMenu() {
  let clientRect = button.value.getBoundingClientRect();

  let clientX = clientRect.left;
  let clientY = clientRect.bottom;

  contextmenu.value.show(props.options, { clientX, clientY });
}

function hideContextMenu(e: MouseEvent) {
  console.log('hide');
  if (!contextmenu.value.$el || !e.relatedTarget ||
      !contextmenu.value.$el.contains(e.relatedTarget) &&
      !button.value.contains(e.relatedTarget)
  ) {
    contextmenu.value.hide();
  }
}
</script>

<template lang="pug">

button.panel-button(
  ref="button"
  @mouseenter="showContextMenu"
  @mouseleave="hideContextMenu")
  slot

context-menu(
  type="panel"
  ref="contextmenu"
  @mouseleave="hideContextMenu")

</template>

<style lang="stylus">

</style>