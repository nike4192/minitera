
<script setup lang="ts">

import {computed} from "vue";

const props = defineProps(['modelValue', 'options']);
const emit = defineEmits(['update:modelValue']);
const value = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

const deltaThreshold = 10;
let deltaAccum = 0;

function onWheel(e: WheelEvent) {
  let select = e.target as HTMLSelectElement;
  let options = select.options;
  let selectedIndex = select.selectedIndex;

  deltaAccum += e.deltaY;

  if (Math.abs(deltaAccum) > deltaThreshold) {
    if (deltaAccum > 0 && selectedIndex < options.length - 1) {
      select.selectedIndex++;
      select.dispatchEvent(new Event('input'));
    }
    if (deltaAccum < 0 && selectedIndex > 0) {
      select.selectedIndex--;
      select.dispatchEvent(new Event('input'));
    }
    deltaAccum = 0;
  }
}

</script>

<template lang="pug">

select.scroll-select(
  @wheel.passive="onWheel"
  v-model="value")
  template(v-if="Array.isArray(options)")
    option(
      v-for="value of options"
      :value="value")
      | {{ value }}
  template(v-else-if="typeof options === 'object'")
    option(
      v-for="(key, value) of options"
      :value="value")
      | {{ key }}


</template>

<style lang="stylus">

select.scroll-select
  border: 1px solid black;

</style>