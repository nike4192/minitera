<template lang="pug">

.viewer-box
  .viewer-container
    svg.grid-pattern
      pattern(
        id="grid-pattern"
        :patternTransform="viewMatrix"
        :width="blockSize"
        :height="blockSize"
        patternUnits="userSpaceOnUse")
        rect.grid-line(
          x="0"
          y="0"
          :width="blockSize"
          :height="blockSize"
          :stroke-width="1 / viewMatrix.a")
      rect(x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)")
    canvas.viewer(ref="canvas")
    mouse-selection(parent-ref="canvas")

</template>

<script lang="ts">

import { ref, watch } from "vue";

import ContextMenu from '/src/components/helpers/ContextMenu.vue';
import MouseSelection from "@/components/helpers/MouseSelection.vue";

import useViewerNavigation from "@/composables/viewer/useViewerNavigation";
import useViewerRendering from "@/composables/viewer/useViewerRendering";
import useViewerContextMenu from "@/composables/viewer/useViewerContextMenu";
import {useEditorStore} from "@/stores/editor.store";
import {storeToRefs} from "pinia";
import {blockSize} from "@/core/constants";

export default {
  components: {
    MouseSelection, ContextMenu
  },
  inject: ['contextmenu'],
  setup(props) {
    const editor = useEditorStore();
    const { macros, blockDrawParams } = storeToRefs(editor);

    const canvas = ref(null);
    const viewMatrix = ref(null);

    viewMatrix.value = new DOMMatrix();

    const { render } = useViewerRendering(canvas, macros, viewMatrix, blockDrawParams);
    const { states } = useViewerNavigation(canvas, macros, viewMatrix, render);
    useViewerContextMenu(canvas, macros, states, render);

    const { hover } = states.value;

    watch(() => hover.block, (newBlock, oldBlock) => {
      if (!newBlock && oldBlock) {
        oldBlock.hoverPin = null;
      }
      if (oldBlock && oldBlock !== newBlock) {
        oldBlock.hoverPin = null;
      }
      render();
    });

    watch(() => hover.pin, (newPin, oldPin) => {
      if (hover.block) {
        hover.block.hoverPin = newPin;
        render();
      }
    })

    return {
      canvas,
      viewMatrix,
      blockSize,
      render
    }
  },
  data() {
    return {
      canvasContext: {},
    }
  },
  mounted() {
  },
  unmounted() {
  },
  computed: {
  },
  methods: {
  },
  watch: {
    blockDrawParams: {
      handler() {
        this.render();
      },
      deep: true
    }
  }
}
</script>

<style lang="stylus">

.viewer-box {
  position: relative;
  /*padding: 1.2em;*/
  flex-grow: 1;
  min-height: 0;
  overflow hidden

  .viewer-container {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: content-box;
    /*border: 1px solid lightgray;*/

    canvas.viewer {
      display: block;
      width: 100%;
      height: 100%;
    }

    svg.grid-pattern {
      position: absolute;
      display: block;
      width: 100%;
      height: 100%;
      z-index: -1;

      .grid-line {
        fill: none;
        /*stroke-width: 3;*/
        stroke: lightgray;
        stroke-dasharray: 0 5 5;
      }
    }
  }
}

</style>