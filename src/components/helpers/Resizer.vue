<template lang="pug">
.resizer(
  ref="resizer"
  :direction="direction"
  )
</template>

<script lang="ts">

import {defineComponent} from "vue";
import {Direction, Side} from "@/core/types";

export default defineComponent({
  props: {
    direction: {
      type: String
    },
    side: {
      type: String
    },
    cb: {
      type: Function
    },
    el: {
      type: HTMLElement
    }
  },
  data() {
    return {
      mouse: {
        down: null
      },
      bbox: null
    }
  },
  mounted() {
    let resizer = this.$refs.resizer;
    resizer.addEventListener('mousedown', this.onMouseDown);
    resizer.addEventListener('dblclick', this.onDblClick);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('blur', this.onBlur);
  },
  beforeUnmount() {
    let resizer = this.$refs.resizer;
    resizer.removeEventListener('mousedown', this.onMouseDown);
    resizer.removeEventListener('dblclick', this.onDblClick);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('blur', this.onBlur);
  },
  computed: {
    target() {
      return this.el || this.$el.parentElement;
    }
  },
  methods: {
    onDblClick() {
      switch (this.direction) {
        case Direction.Vertical:
          this.target.style.height = '';
          break;
        case Direction.Horizontal:
          this.target.style.width = '';
          break;
      }
      this.$emit('resize');
    },
    onMouseDown(e: MouseEvent) {
      if (e.button === 0) {
        this.mouse.down = e;
        this.bbox = this.target.getBoundingClientRect();
      }
    },
    onMouseMove(e: MouseEvent) {
      let de = this.mouse.down;
      if (de) {
        let deltaX = e.clientX - de.clientX;
        let deltaY = e.clientY - de.clientY;
        this.resize(deltaX, deltaY);
      }
    },
    onMouseUp(e: MouseEvent) {
      if (e.button === 0) {
        this.mouse.down = null;
      }
    },
    onBlur() {
      this.mouse.down = null;
    },
    resize(deltaX, deltaY) {
      switch (this.direction) {
        case Direction.Vertical:
          if (this.side === Side.Top) deltaY = -deltaY;
          this.target.style.height = this.bbox.height + deltaY + 'px';
          break;
        case Direction.Horizontal:
          this.target.style.width = this.bbox.width + deltaX + 'px';
          break;
      }
      this.$emit('resize');
    }
  }
})

</script>

<style lang="stylus">


resizer-size = 0.6em;

.resizer
  position: absolute;
  user-select none
  background-color #0000
  transition background-color 200ms

  &:hover
  &:active
    background-color #0001

  &[direction="horizontal"]
    top 0
    bottom 0
    width: resizer-size;
    cursor ew-resize

  &[direction="vertical"]
    left 0
    right 0
    top: - resizer-size
    height: resizer-size;
    cursor ns-resize

</style>