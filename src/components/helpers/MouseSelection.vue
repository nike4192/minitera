<template lang="pug">

.mouse-selection(:style="compStyle")

</template>

<script lang="ts">

import {defineComponent} from "vue";

export default defineComponent({
  props: {
    parentRef: {
      type: String
    }
  },
  data() {
    return {
      mouse: {
        down: null
      },
      clientRect: null
    }
  },
  mounted() {
    let target = this.target;

    target.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('blur', this.onBlur);
  },
  unmounted() {
    let target = this.target;

    target.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('blur', this.onBlur);
  },
  computed: {
    target() {
      return this.$parent.$refs[this.parentRef];
    },
    compStyle() {
      let { clientRect } = this;
      if (this.mouse.down && clientRect) {
        return {
          top: clientRect.top + 'px',
          left: clientRect.left + 'px',
          width: clientRect.width + 'px',
          height: clientRect.height + 'px'
        }
      }
    }
  },
  methods: {
    onMouseDown(e: MouseEvent) {
      if (e.button === 0) {
        this.mouse.down = e;
        this.clientRect = new DOMRect();
      }
    },
    onMouseMove(e: MouseEvent) {
      let { clientRect } = this;
      let de = this.mouse.down;

      if (de) {
        e.preventDefault();
        this.mouse.move = e;
        let deltaX = e.clientX - de.clientX;
        let deltaY = e.clientY - de.clientY;

        clientRect.x = deltaX < 0 ? e.clientX : de.clientX;
        clientRect.y = deltaY < 0 ? e.clientY : de.clientY;
        clientRect.width = Math.abs(deltaX);
        clientRect.height = Math.abs(deltaY);

        this.clientRect = null;
        this.clientRect = clientRect;

        this.$forceUpdate();
      }
    },
    onMouseUp(e: MouseEvent) {
      this.mouse.down = null;
    },
    onBlur() {
      this.mouse.down = null;
    }
  }
})

</script>

<style lang="stylus">

.mouse-selection
  position: fixed;
  background-color #29f8
  user-select none

</style>