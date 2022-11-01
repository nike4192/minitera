<template lang="pug">

canvas(ref="canvas")

Teleport(to="body")
	context-menu(
		v-if="contextmenu"
		:event="contextmenu.event"
		:items="contextmenu.items")

</template>

<script>

	import { h } from 'vue';
	import { Op, Mode, Block } from '/src/minitera.js';
	import ContextMenu from '/src/components/ContextMenu.vue';

	export default {
		props: ['context', 'macros', 'blockSize', 'blockDrawParams'],
		components: {
			ContextMenu
		},
		data() {
			return {
				canvasContext: {},
				contextmenu: null,
				hoverBlock: null,
			}
		},
		mounted() {
			let canvas = this.canvas;
			canvas.addEventListener('mousemove', this.canvasMouseMoveHandler);
			canvas.addEventListener('mouseleave', this.canvasMouseLeaveHandler);
			canvas.addEventListener('mousedown', this.canvasMouseDownHandler);
			canvas.addEventListener('mouseup', this.canvasMouseUpHandler);
			canvas.addEventListener('contextmenu', this.canvasContextMenuHandler);

			this.render();
		},
		unmounted() {
			let canvas = this.canvas;
			canvas.removeEventListener('mousemove', this.canvasMouseMoveHandler);
			canvas.removeEventListener('mouseleave', this.canvasMouseLeaveHandler);
			canvas.removeEventListener('mousedown', this.canvasMouseDownHandler);
			canvas.removeEventListener('mouseup', this.canvasMouseUpHandler);
			canvas.removeEventListener('contextmenu', this.canvasContextMenuHandler);
		},
		computed: {
			canvas() {
				return this.$refs.canvas;
			}
		},
		methods: {
			render() {
				let { canvas, macros, blockSize } = this;
				let ctx = canvas.getContext('2d');
				canvas.width = macros.x * blockSize;
				canvas.height = macros.y * blockSize;

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				macros.render(ctx, canvas.width, canvas.height, this.blockSize, this.blockDrawParams);
			},
			getBlockByMouseEvent(e) {
				let { offsetX, offsetY } = e;
				let { macros, blockSize } = this;

				let x = Math.floor(offsetX / blockSize);
				let y = Math.floor(offsetY / blockSize);

				if (0 <= x && x < macros.x && 0 <= y && y < macros.y) {
					return macros.getBlock(x, y);
				} else {
					return null;
				}
			},
			getPinByMouseEvent(e) {
				let { offsetX, offsetY } = e;
				let { blockSize } = this;

				let bx = (offsetX % blockSize) / blockSize;
				let by = (offsetY % blockSize) / blockSize;

				let { gridLines, gridLambda, getGridPin, gridPins } = Block;

				for (let i = 0; i <= gridLines.length; i++) {
					for (let j = 0; j <= gridLines.length; j++) {
						if (!gridLambda(i, j)) continue;
						let x1 = i ? gridLines[i - 1]: 0, x2 = gridLines[i] || 1;
						let y1 = j ? gridLines[j - 1]: 0, y2 = gridLines[j] || 1;
						if (x1 <= bx && bx <= x2 && y1 <= by && by <= y2) {
							return getGridPin(i, j);
						}
					}
				}

				return null;
			},
			canvasMouseMoveHandler(e) {
				let block = this.getBlockByMouseEvent(e);
				if (!block) return;

				this.hoverBlock = block;

				let hoverPin = this.getPinByMouseEvent(e);
				if (hoverPin !== block.hoverPin) {
					block.hoverPin = hoverPin;
					this.render();
				}
			},
			canvasContextMenuHandler(e) {
				e.preventDefault();
			},
			canvasMouseDownHandler(e) {
				let { canvasContext } = this;
				canvasContext.hoverBlock = this.hoverBlock;
				canvasContext.hoverPin = this.hoverBlock?.hoverPin;

				this.contextmenu = null;
			},
			clickPinHandler(e) {
				let { context } = this;

				let block = this.hoverBlock;
				let pin = block.hoverPin;

				if (e.button === 0) {
					block.setPin(pin, context.mode, context.number - 1);
					// if (context.mode === Mode.ALU) {
					// 	block[pin[2] === 'I' ? 'inputs' : 'outputs'][context.number - 1] = pin.slice(0, -1);
					// 	this.render();
					// }
				} else if (e.button === 2) {
					// let stream = block.bindings[pin[2] === 'I' ? 'in' : 'out'][pin.slice(0, -1)];
					// console.log(pin, stream.bits.join(''), stream.stash.join(''));
					// if (context.mode === Mode.ALU) {
					// 	block[pin[2] === 'I' ? 'inputs' : 'outputs'][context.number - 1] = null;
					// 	this.render();
					// }
					block.resetPin(pin, context.mode, context.number - 1);
				}
				this.render();
			},
			clickBlockHandler(e) {
				let block = this.hoverBlock;
				if (e.button === 2) {
					this.showContextMenuByMouseEvent(e, block);
				} else {
					this.contextmenu = null;
				}
			},
			canvasMouseUpHandler(e) {
				let { canvasContext } = this;
				if (this.hoverBlock === canvasContext.hoverBlock) {
					let block = this.hoverBlock;
					if (block.hoverPin === canvasContext.hoverPin) {
						if (block.hoverPin) {
							this.clickPinHandler(e);
						} else {
							this.clickBlockHandler(e);
						}
					}
				}
			},
			canvasMouseLeaveHandler(e) {
				this.hoverBlock = null;
			},
			showContextMenuByMouseEvent(e, block) {
				this.contextmenu = {
					event: e,
					items: [
						{
							label: '<i>Operation</i>',
							subitems: Object.keys(Op).map(op => {
								return {
									label: op,
									value: Op[op],
									checked: block.operation === Op[op],
									handler: (v) => {
										block.operation = v;
										this.render();
										this.showContextMenuByMouseEvent(e, block);
									}
								}
							})
						},
						{
							label: '<i>Mask<i>',
							subitems: [
								{
									label: 'External',
									checked: block.mask === 'M',
									value: 'M',
									handler: (v) => {
										block.mask = v;
										this.render();
										this.showContextMenuByMouseEvent(e, block);
									}
								},
								{
									label: 'Start Bit',
									checked: block.mask === 'S',
									value: 'S',
									handler: (v) => {
										let wordLength = prompt('Word Length', 64);
										if (wordLength) {
											block.mask = v;
											block.wordLength = wordLength;
											this.render();
											this.showContextMenuByMouseEvent(e, block);
										}
									}
								}
							]
						}
					]
				}
			}
		},
		watch: {
			hoverBlock(newBlock, oldBlock) {
				if (oldBlock) {
					oldBlock.hoverPin = null;
					this.render();
				}
			},
			blockDrawParams: {
				handler() {
					this.render();
				},
				deep: true
			},
			blockSize() {
				this.render();
			}
		}
	}
</script>
