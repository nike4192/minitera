<template lang="pug">

.breakpoint-container
  resizer(
    side="top"
    direction="vertical"
    @resize="resizeCallback")

  div.title-bar
    .title-group
      button.icon(
        @click="reset"
        title="Reset"
        v-html="resetIcon")
      .vr
      button.icon(
        @click="iterate"
        title="Step"
        v-html="iterateIcon")
      button.icon(
        @click="stepPlay"
        title="Step play"
        v-html="stepPlayIcon")
      button.icon(
        @click="forcePlay"
        title="Force play"
        v-html="forcePlayIcon")
      .vr
      button.icon(
        @click="pause"
        title="Pause"
        :disabled="!timeout"
        v-html="pauseIcon")
      button.icon(
        @click="stop"
        title="Stop"
        :disabled="!timeout"
        v-html="stopIcon")

    .title-group
      span.title-item {{ 'Tacts ' + tacts }}

  .breakpoints-box
    table.breakpoints-info-table(
      @mouseleave="hoverBreakpoint = null")
      tr(
        draggable="true"
        v-for="bp of breakpoints"
        :style="{backgroundColor: infoBreakpointColor(bp)}"
        @mouseenter="hoverBreakpoint = bp")
        td {{ bp.variable.isInput ? 'IN' : 'OUT' }}
        td {{ bp.variable.column }}
        td {{ bp.variable.row }}
        td {{ bp.variable.pin }}

    .breakpoints-streams-box
      table.breakpoints-streams-table(
        v-if="breakpoints.length"
        ref="streamsTable"
        @keydown="streamsTableKeyDownHandler")
        tr(v-for="(bp, i) of breakpoints")
          td(v-for="(_, j) in maxBitLength",
            :bpi="i" :si="j" :tact="j + 1"
            :value="streamBits[i][j]"
            :tabIndex="tableCellTabIndex(j, bp)"
            :current="j === tacts - 1 ? true : null") {{ streamBits[i][j] || 0 }}

</template>

<script lang="ts">

import resetIcon from '@/assets/icons/reset.svg';
import iterateIcon from '@/assets/icons/play.svg';
import stepPlayIcon from '@/assets/icons/next.svg';
import forcePlayIcon from '@/assets/icons/double-next.svg';
import pauseIcon from '@/assets/icons/pause.svg';
import stopIcon from '@/assets/icons/stop.svg';

import { defineComponent } from "vue";
import { Breakpoint, Variable } from '@/core/units';
import Resizer from "@/components/helpers/Resizer.vue";
import {useEditorStore} from "@/stores/editor.store";
import {storeToRefs} from "pinia";

export default defineComponent({
  inject: ['viewer'],
  components: {Resizer},
  setup() {
    const editor = useEditorStore();
    const { macros } = storeToRefs(editor);

    return {
      macros,
      resetIcon, iterateIcon, stepPlayIcon, forcePlayIcon, pauseIcon, stopIcon
    }
  },
  data() {
    return {
      tacts: 0,
      timeout: null,
      hoverBreakpoint: null,
      stepInterval: 200,
      minBitLength: 64
    }
  },
  computed: {
    breakpoints(): Breakpoint[] {
      let { macros } = this;
      return macros.variables.map((variable: Variable) => {
        let {column, row, pin} = variable;
        let block = macros.getBlock(column, row);
        let stream = block.streams[pin];
        return new Breakpoint(variable, stream);
      });
    },
    maxBitLength(): number {
      let maxBitLength = Math.max.apply(Math, this.breakpoints.map((bp: Breakpoint) => bp.stream.all.length));
      return Math.max(maxBitLength, this.tacts, this.minBitLength);
    },
    streamBits(): number[][] {
      let { breakpoints } = this;
      return breakpoints.map((bp: Breakpoint) => bp.stream.all);
    }
  },
  methods: {
    reset() {
      this.macros.reset();
      this.tacts = 0;
    },
    iterate() {
      this.macros.iterate();
      this.tacts++;
    },
    stepPlay() {
      let { macros } = this;

      if (!macros.isEmptyStreams) {
        this.iterate();
      }

      if (macros.isEmptyStreams) {
        this.timeout = null;
      } else {
        this.timeout = setTimeout(() => {
          this.stepPlay();
        }, this.stepInterval);
      }
    },
    pause() {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    },
    stop() {
      this.pause();
      this.reset();
    },
    forcePlay() {
      let start = window.performance.now();
      this.macros.play(() => this.tacts++);
      console.log(window.performance.now() - start);
    },
    resizeCallback() {
      window.dispatchEvent(new Event('resize'));
      // this.viewer.render();
    },
    streamsTableKeyDownHandler(e: KeyboardEvent) {
      let { key } = e;
      let target: HTMLElement = e.target as HTMLElement;
      if (!['0', '1'].includes(key)) return;

      let value = parseInt(key);
      let bpa = target.getAttribute('bpi');
      let bpi = bpa ? parseInt(bpa) : 0;
      let sa = target.getAttribute('si');
      let si = sa ? parseInt(sa) : 0;
      let bp = this.breakpoints[bpi];
      bp.variable.bits[si] = value;
      bp.stream.bits[si - this.tacts] = value;
      if (target.nextElementSibling) {
        let nextSibling: HTMLElement = (target.nextElementSibling as HTMLElement);
        nextSibling.focus();
      } else if (target.parentElement?.nextElementSibling) {
        let nextRow: Element | null = target.parentElement.nextElementSibling;
        if (nextRow) {
          let nextCell: HTMLElement | null = nextRow.querySelector(`[si="${this.tacts}"]`);
          if (nextCell) nextCell.focus();
        }
      }
    },
    infoBreakpointColor(bp: Breakpoint) {
      let { column, row } = bp.variable;
      let odd = (column + row) % 2;
      return `hsl(120deg 40% ${!odd ? 70 : 90}%)`;
    },
    tableCellTabIndex(i: number, bp: Breakpoint) {
      return i >= this.tacts && bp.variable.isInput || null;
    }
  },
  watch: {
    macros() {
      console.log(this.macros);
      this.tacts = 0;
    },
    hoverBreakpoint(newVal: Breakpoint, oldVal: Breakpoint) {
      let { macros } = this;

      if (oldVal) {
        let { column, row } = oldVal.variable;
        let block = macros.getBlock(column, row);
        block.hoverPin = null;
      }

      if (newVal) {
        let { column, row, pin } = newVal.variable;
        let block = macros.getBlock(column, row);
        block.hoverPin = pin;
      }

      this.viewer.render();
    }
  }
})

</script>

<style lang="stylus">

border-color = #eee;
selected-background = #29f;

zero-bit-color = lightgray;  /* #99C794 #C695C6 */
one-bit-color = black;

scrollbar-size = 1em
scrollbar-thumb-border-radius = 0.2em
scrollbar-thumb-offset = 0.3em

.vr
  margin 0.2em 0.4em
  height max-height
  width 1px
  background-color lightgray

.breakpoint-container
  position: relative;
  width: 100%;
  display flex
  flex-direction column
  box-sizing: border-box;
  background-color: var(--main-background-color);
  border-top: 1px solid lightgray;

  /* Title bar */

  .title-bar
    padding 0.4em 1em;
    display: flex;
    justify-content space-between
    font-family Helvetica, Arial;

    .title-group
      display flex

    .title-item
      display inline-flex
      align-items center
      justify-content center

    button.icon
      float: left;
      display: inline-block;
      padding: 0;
      border: none;
      background-color: unset;

      &:not([disabled]):hover
        background-color: #0003;

      &[disabled]
        opacity 0.25

      svg
        float: left;
        display: inline-block;

  /* Breakpoints Box */

  table
    float: left;
    font-family: monospace;
    font-size: 1.1em;
    border-collapse: collapse;

  *::-webkit-scrollbar
    width: scrollbar-size;
    height: scrollbar-size;

  *::-webkit-scrollbar-track
    background-color inherit

  *::-webkit-scrollbar-thumb
    border-radius scrollbar-thumb-border-radius
    background-color: lightgray;
    box-shadow inset (- scrollbar-thumb-offset) (- scrollbar-thumb-offset) 0 white,
    inset (- scrollbar-thumb-offset) scrollbar-thumb-offset 0 white,
    inset scrollbar-thumb-offset (- scrollbar-thumb-offset) 0 white,
    inset scrollbar-thumb-offset scrollbar-thumb-offset 0 white

  .breakpoints-box
    padding-left 1em
    position: relative;
    flex-shrink 1
    overflow-y scroll

    .breakpoints-info-table
      cursor: default;
      background-color #ddd

      td
        padding-left: 0.3em;
        padding-right: 0.3em;
        border: 1px solid white;

    .breakpoints-streams-box
      overflow-x scroll

      &:empty {
        overflow-x auto
      }

      .breakpoints-streams-table
        cursor default

        tr
          border-top: 1px solid border-color;
          border-bottom: 1px solid border-color;

          td
            padding-left: 0.2em;
            padding-right: 0.2em;
            border: none;
            border-right: 1px solid border-color;
            color: zero-bit-color;

            &[value="1"] {
              color: one-bit-color;
            }

            &:focus {
              background: selected-background;
            }

            &[current]
              border-right: 1px solid red;

              & ~ td
                color: gray;

        tr:first-child td[current]::after
          content attr(tact);
          position absolute
          top -1em
          color black
</style>