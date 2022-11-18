import {exportFile, importFile} from "@/core/utils";
import {Macros} from "@/core/modules";

export async function importMacros() {
  let file = await importFile();
  if (file) {
    let content = await file.text();
    let json = JSON.parse(content);
    return Macros.fromJSON(json);
  }
}

export function exportMacros(macros) {
  let filename = prompt('Filename to export', 'macros');
  if (filename) {
    let content = JSON.stringify(macros);
    let url = URL.createObjectURL(new Blob([content]));
    exportFile(url, filename + '.mtm');
  }
}
