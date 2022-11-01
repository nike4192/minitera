
import { createApp } from 'vue';
import MacrosViewer from './components/MacrosViewer.vue';
import DebuggerSession from './components/DebuggerSession.vue';

import { atb, bta, exportFile, importFile } from '/src/utils.js';
import { Op, Mode, Macros, Block, Variable, Breakpoint } from '/src/minitera.js';

var macros = new Macros();

macros.createMap(2, 1);

macros.setBlock(0, 0, new Block({
	operation: Op.And,
	inputs: ['LH', 'LL', 'UH'],
	outputs: ['RL'],
	mask: 'M'
}));

macros.setBlock(1, 0, new Block({
	operation: Op.And,
	inputs: ['LL', 'UH', 'UL'],
	outputs: ['DH'],
	mask: 'M'
}));

let variables = [
	new Variable(true, 0, 0, 'LH', [
		1, ...bta(0b10101), 1, ...bta(0b1000001)
	]),
	new Variable(true, 0, 0, 'LL', [
		1, ...bta(0b10101), 1, ...bta(0b1000001)
	]),
	new Variable(true, 0, 0, 'UH',
		bta(0b1111111111111)
	),
	new Variable(true, 0, 1, 'UH', [
		1, 1, ...bta(0b10101), 1, ...bta(0b1000001)
	]),
	new Variable(true, 0, 1, 'UL', [
		0, ...bta(0b1111111111111)
	])
];

macros.init(variables);

window.macros = macros;

const app = createApp({
	data() {
		return {
			context: {
				mode: null,
				number: null
			},
			macros,
			blockSize: 200,
			blockDrawParams: {
				drawPinsGrid: false,
				withPinNames: false
			}
		}
	},
	components: {
		MacrosViewer, DebuggerSession
	},
	mounted() {
		window.addEventListener('keydown', this.windowKeyDownHandler);
	},
	unmounted() {
		window.removeEventListener('keydown', this.windowKeyDownHandler);
	},
	methods: {
		windowKeyDownHandler(e) {

			switch(e.code) {
				case 'KeyE':
					if (e.ctrlKey) {
						e.preventDefault();
						let filename = prompt('Filename to export', 'macros');
						if (filename) {
							let content = JSON.stringify(macros);
							let url = window.URL.createObjectURL(new Blob([content]));
							exportFile(url, filename + '.mtm');
						}
					}
					break;
				case 'KeyI':
					if (e.ctrlKey) {
						e.preventDefault();
						importFile().then(file => {
							file.text().then(content => {
								let json = JSON.parse(content);
								let macros = Macros.fromJSON(json);
								console.log(macros);
								this.macros = macros;
							});
						});
					}
					break;
			}

			if (e.ctrlKey || e.altKey) return;

			let { context } = this;

			switch(e.code) {
				case 'Space':
					this.$refs.debuggerSession.iterate();
					break;
				case 'KeyG':
					this.blockDrawParams.drawPinsGrid = !this.blockDrawParams.drawPinsGrid;
					break;
				case 'KeyN':
					this.blockDrawParams.withPinNames = !this.blockDrawParams.withPinNames;
					break;
				case 'KeyA':
					context.mode = context.mode === Mode.ALU ? null : Mode.ALU;
					break;
				case 'KeyT':
					context.mode = context.mode === Mode.TRANSIT ? null : Mode.TRANSIT;
					break;
				case 'KeyR':
					context.mode = context.mode === Mode.REGISTER ? null : Mode.REGISTER;
					break;
				case 'Digit1': case 'Digit2': case 'Digit3':
					let number = parseInt(e.key);
					if (context.mode === Mode.ALU ||
						context.mode === Mode.TRANSIT) {
						context.number = number;
					}
			}
		}
	},
	watch: {
		context: {
			handler() {
				let { context } = this;
				if (!context.mode) {
					context.number = null;
				}
			},
			deep: true
		}
	}
});

app.mount('#app');

window.app = app;
