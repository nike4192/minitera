<template lang="pug">

base-dialog(title="Init dialog")
	table.macros-init-table(
		ref="macrosInitTable"
		@click="tableClickHandler"
		@mouseover="tableMouseOverHandler"
		@mouseleave="tableMouseLeaveHandler")
		caption {{ tableCaption }}
		tr(
			v-for="y of macrosTable.initY"
			:y="y")
			td(
				v-for="x of macrosTable.initX"
				:x="x"
				:selected="isSelectedCell(x, y)")
	hr
	.input-row
		.input-item
			label.input-label
				span X
				input.number-input(
					ref="inputX"
					type="number"
					min="1"
					v-model="macrosInit.inputX")
		.input-item
			label.input-label
				span Y
				input.number-input(
					ref="inputY"
					type="number"
					min="1"
					v-model="macrosInit.inputY")
		.input-item
			button(@click="createMacros") Create macros
	hr
	.input-row
		.input-item
			button(@click="importMacros") Import macros
</template>

<script>

	import { exportFile, importFile } from '@/core/utils.ts';
	import { Macros } from '@/core/modules';

	import BaseDialog from './BaseDialog.vue';
	
	export default {
		extends: BaseDialog,
		components: {
			BaseDialog
		},
		data() {
			return {
				macrosTable: {
					initX: 6,
					initY: 6,
					mouseX: null,
					mouseY: null
				},
				macrosInit: {
					inputX: null,
					inputY: null
				}
			}
		},
		computed: {
			tableCaption() {
				let { mouseX, mouseY } = this.macrosTable;

				if (mouseX && mouseY) {
					return `Macros ${mouseX}x${mouseY}`;
				}
			}
		},
		methods: {
			createMacros() {
				let { inputX, inputY } = this.macrosInit;

				if (!inputX) {
					this.$refs.inputX.focus();
					return;
				}
				if (!inputY) {
					this.$refs.inputY.focus();
					return;
				}
				let macros = new Macros();
				macros.createMap(inputX, inputY);
				this.$emit('updateMacros', macros);
			},
			importMacros() {
				importFile().then(file => {
					file.text().then(content => {
						let json = JSON.parse(content);
						let macros = Macros.fromJSON(json);
						this.$emit('updateMacros', macros);
					});
				});
			},
			tableClickHandler(e) {
				let { macrosTable } = this;
				let { mouseX, mouseY } = macrosTable;

				if (mouseX && mouseY) {
					let macros = new Macros();
					macros.createMap(mouseX, mouseY);
					this.$emit('updateMacros', macros);
				}
			},
			tableMouseOverHandler(e) {
				let { target } = e;
				let { macrosTable } = this;

				if (target.matches('td')) {
					let x = target.getAttribute('x');
					let y = target.parentElement.getAttribute('y');

					macrosTable.mouseX = parseInt(x);
					macrosTable.mouseY = parseInt(y);
				}
			},
			tableMouseLeaveHandler(e) {
				let { macrosTable } = this;
				macrosTable.mouseX = null;
				macrosTable.mouseY = null;
			},
			isSelectedCell(x, y) {
				let { macrosTable } = this;

				return (
					macrosTable.mouseX && macrosTable.mouseY &&
					macrosTable.mouseX >= x && macrosTable.mouseY >= y || null
				)
			}
		}
	}

</script>

<style>
	
	.macros-init-table {
		margin: 0 auto;
		border-spacing: 4px;
	}

	.macros-init-table caption {
    	caption-side: bottom;
	}
	.macros-init-table caption:empty::after {
		content: 'Hover to select';
		color: lightgray;
	}

	.macros-init-table td {
		width: 1em;
		height: 1em;
		border: 1px solid gray;
	}

	.macros-init-table td[selected] {
		border: 1px solid orange;
		box-shadow: 0 0 0 1px #f55;
	}

	.input-row {
		display: flex;
		justify-content: center;
	}

	.input-row .input-item {
		margin: 0 0.2em;
	}

	.input-item .input-label span {
		padding-right: 0.2em;
	}

	.number-input {
		width: 60px;
	}

</style>
