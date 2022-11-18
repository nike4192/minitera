
import {defineStore} from "pinia";
import {Block, Macros} from "@/core/modules";
import {bta, exportFile, importFile} from "@/core/utils";
import {ref, watch} from "vue";
import {Mode} from "@/core/types";

export const useEditorStore = defineStore('editor', () => {

  const macros = ref(null);
  const mode = ref(null);
  const number = ref(null);

  const blockDrawParams = ref({
    drawPinsGrid: false,
    withPinNames: false
  });

  function setMode(value: Mode) {
    mode.value = mode.value === value ? null : value;
  }

  function setNumber(value: Number) {
    if (mode.value === Mode.ALU ||
      mode.value === Mode.Transit) {
      number.value = value;
    }
  }

  function createMacros() {
    // Look at App.vue -> open macros-dialog
    macros.value = null;
  }

  async function importMacros() {
    let file = await importFile();
    if (file) {
      let content = await file.text();
      let json = JSON.parse(content);
      macros.value = Macros.fromJSON(json);
    }
  }

  function exportMacros() {
    let filename = prompt('Filename to export', 'macros');
    if (filename) {
      let content = JSON.stringify(macros.value);
      let url = URL.createObjectURL(new Blob([content]));
      exportFile(url, filename + '.mtm');
    }
  }

  // Reset nested options
  watch(mode, () => {
    if (!mode.value) {
      number.value = null;
    }
  });

  return {
    mode, number, setMode, setNumber,
    blockDrawParams,
    macros, createMacros, importMacros, exportMacros
  }
})