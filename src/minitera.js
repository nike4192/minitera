
let inPinPath = new Path2D('M-5 0 L5 0 L4.2 4 L-4.2 4 Z');
let outPinPath = new Path2D('M-5 0 L5 0 L5.8 4 L-5.8 4 Z');

class Transit {
	constructor(from, to, delay) {
		this.from = from;
		this.to = to;
		this.delay = delay;
	}
	toJSON() {
		let object = {};

		object.from = this.from;
		object.to = this.to;
		object.delay = this.delay;

		return object;
	}
	static fromJSON(json) {
		let { from, to, delay } = json;
		return new Transit(from, to, delay);
	}
}

class BitStream {

	bits = [];
	buffer = [];
	stash = [];

	constructor(bits = []) {
		this.bits = Array.from(bits);
	}
	get(index) {
		return this.bits[index] || this.buffer[index];
	}
	delay(tacts, value) {
		this.buffer[tacts] ||= value;
	}
	dequeue() {
		return this.bits.shift() || this.buffer.shift() || 0;
	}
	get all() {
		return this.stash.concat(this.bits);
	}
}

class Macros {
	
	map = [];
	streams = [];

	createMap(x, y) {
		this.x = x;
		this.y = y;

		for (let c = 0; c < x; c++) {
			this.map[c] = [];
			for (let r = 0; r < y; r++) {
				this.map[c][r] = new Block();
			}
		}
	}

	init(variables) {
		let streams = [];
		for (let c = 0; c < this.x; c++) {
			for (let r = 0; r < this.y; r++) {
				let block = this.getBlock(c, r);
				if (block.outputs.length) {
					for (let po of block.outputs) {
						let stream = new BitStream();
						block.bindings.out[po] = stream;
						streams.push(stream);
					}
				}
				// console.log(block);
				if (c > 0) block.bind('L', this.getBlock(c - 1, r));
				if (r > 0) block.bind('U', this.getBlock(c, r - 1));
			}
		}
		for (let variable of variables) {
			if (variable.isInput) {
				let { row, column, pin } = variable;
				let block = this.getBlock(column, row);
				let stream = new BitStream(variable.bits);
				block.bindings.in[pin] = stream;
				streams.push(stream);
			}
		}
		this.variables = variables;
		this.streams = streams;
	}

	render(ctx, width, height, blockSize, params) {
		for (let c = 0; c < this.x; c++) {
			for (let r = 0; r < this.y; r++) {
				let block = this.getBlock(c, r);
				let x = c * blockSize, y = r * blockSize;
				if (x > width && y > height) continue;

				block.draw(ctx, c, r, blockSize, params);
			}
		}
	}

	getBreakpoints() {
		let breakpoints = [];		

		for (let c = 0; c < this.x; c++) {
			for (let r = 0; r < this.y; r++) {
				let block = this.getBlock(c, r);
				for (let pin in block.bindings.in) {
					let stream = block.bindings.in[pin];
					let breakpoint = new Breakpoint(true, c, r, pin, stream);
					breakpoints.push(breakpoint);
				}
				for (let pin in block.bindings.out) {
					let stream = block.bindings.out[pin];
					let breakpoint = new Breakpoint(false, c, r, pin, stream);
					breakpoints.push(breakpoint);
				}
			}
		}

		return breakpoints;
	}

	getBlock(x, y) {
		return this.map[x][y];
	}

	setBlock(x, y, block) {
		this.map[x][y] = block;
	}

	iterate() {
		for (let c = 0; c < this.x; c++) {
			for (let r = 0; r < this.y; r++) {
				let block = this.map[c][r];
				block.iterate();
			}
		}
		for (let stream of this.streams) {
			let bit = stream.dequeue();
			stream.stash.push(bit);
		}
	}

	toJSON() {
		let object = {};

		object.x = this.x;
		object.y = this.y;
		object.map = [];
		for (let c = 0; c < this.x; c++) {
			object.map[c] = [];
			for (let r = 0; r < this.y; r++) {
				let block = this.map[c][r];
				object.map[c][r] = block.toJSON();
			}
		}
		object.variables = this.variables.map(v => v.toJSON());

		return object;
	}

	static fromJSON(json) {
		let { x, y } = json;
		let instance = new Macros();

		instance.x = x;
		instance.y = y;
		for (let c = 0; c < x; c++) {
			instance.map[c] = [];
			for (let r = 0; r < y; r++) {
				instance.map[c][r] = Block.fromJSON(json.map[c][r]);
			}
		}
		let variables = json.variables.map(v => Variable.fromJSON(v));
		instance.init(variables);

		return instance;
	}
}

const blockDrawParamsDefault = {
	drawPinsGrid: false,
	withPinNames: false
};

const Op = {
	NOP: 'NOP',
	And: 'And',
	Xor: 'Xor',
	NAnd: 'NAnd',
	Impl: 'Impl',
	NImpl: 'NImpl'
}

const Mode = {
	ALU: 'ALU',
	TRANSIT: 'Transit',
	REGISTER: 'Register'
}

class Block {

	transits = [];
	inputs = [];
	outputs = [];

	delayedCallbacks = []
	bindings = {
		in: {},
		out: {}
	}

	static gridLines = [0.15, 0.3, 0.45, 0.55, 0.7, 0.85];

	static gridLambda = (i, j) =>
		(
			(!!(i - 6) ^ !!j) ||
			(!!i ^ !!(j - 6)) ||
			(i === 6 || j === 6)
		) && (
			(i !== 3 && j !== 3) 
		);

	static getGridPin = (i, j) =>
		i === 0 && j === 0 ? 'FBO' :
		i === 6 && j === 6 ? 'FBI' :
		i === 0 && j === 6 ? 'C0' :
		i === 6 && j === 0 ? 'C1' :
		i === 0 ? 'L' + ['H', 'L'][Math.abs(j - 3) - 1] + ['I', 'O'][Number(j < 3)] :
		i === 6 ? 'R' + ['H', 'L'][Math.abs(j - 3) - 1] + ['I', 'O'][Number(j > 3)] :
		j === 0 ? 'U' + ['H', 'L'][Math.abs(i - 3) - 1] + ['I', 'O'][Number(i > 3)] :
		j === 6 ? 'D' + ['H', 'L'][Math.abs(i - 3) - 1] + ['I', 'O'][Number(i < 3)] :
		null;

	static gridPositionPins = [
		['FBO', 'ULI', 'UHI', null, 'UHO', 'ULO', 'C1'],
		['LLO',    ...Array(5).fill(null),       'RLI'],
		['LHO',    ...Array(5).fill(null),       'RHI'],
		[                                             ],
		['LHI',    ...Array(5).fill(null),       'RHO'],
		['LLI',    ...Array(5).fill(null),       'RLO'],
		['C0', 'DLO', 'DHO', null, 'DHI', 'DLI', 'FBI']
	]

	static gridPinPositions = {
		FBO: [0, 0], C1:  [6, 0], C0:  [0, 6], FBI: [6, 6],
		ULI: [1, 0], UHI: [2, 0], UHO: [4, 0], ULO: [5, 0],
		LLO: [0, 1], LHO: [0, 2], LHI: [0, 4], LLI: [0, 5],
		RLI: [6, 1], RHI: [6, 2], RHO: [6, 4], RLO: [6, 5],
		DLO: [1, 6], DHO: [2, 6], DHI: [4, 6], DLI: [5, 6],
	}

	getGridPinPosition(pin) {
		let { gridPinPositions, gridLines } = this.constructor;
		let [ i, j ] = gridPinPositions[pin];
		let x1 = i ? gridLines[i - 1]: 0, x2 = gridLines[i] || 1;
		let y1 = j ? gridLines[j - 1]: 0, y2 = gridLines[j] || 1;
		let cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
		return [cx, cy];
	}

	constructor(params = {}) {
		this.operation = params.operation || Op.NOP;
		this.setMask(params.mask, params.wordLength);
		
		if (params.inputs && Array.isArray(params.inputs)) {
			this.setInputs(...params.inputs);
		}
		if (params.outputs && Array.isArray(params.outputs)) {
			this.setOutputs(...params.outputs);
		}
	}
	setPin(pin, mode, index) {
		switch(mode) {
			case Mode.ALU:
				let shortPin = pin.slice(0, 2);
				if (pin[2] === 'I' || ['C0', 'C1'].includes(pin)) {
					this.inputs[index] = shortPin;
				} else if (pin[2] === 'O') {
					this.outputs[index] = shortPin;
				}
				break;
		}
	}
	resetPin(pin, mode, index) {
		switch(mode) {
			case Mode.ALU:
				let shortPin = pin.slice(0, 2);
				if (pin[2] === 'I' || ['C0', 'C1'].includes(pin)) {
					this.inputs[index] = null;
				} else if (pin[2] === 'O') {
					this.outputs[index] = null;
				}
				break;
		}
	}
	setMask(mask = 'S', wordLength = 64) {
		this.mask = mask;
		if (mask === 'S') {
			this.wordLength = wordLength;
		}
	}
	setInputs(...inputs) {
		this.inputs = inputs;
	}
	setOutputs(...outputs) {
		this.outputs = outputs;
	}
	setTransits(...transits) {
		this.transits = transits;
	}
	bind(side, block) {
		switch(side) {
			case 'L':
				let {RH, RL} = block.bindings.out;
				let {LH, LL} = this.bindings.in;

				if (RH) this.bindings.in.LH = RH;
				if (RL) this.bindings.in.LL = RL;
				if (LH) block.bindings.out.RH = LH;
				if (LL) block.bindings.out.RL = LL;

				break;
			case 'U':
				let {DH, DL} = block.bindings.out;
				let {UH, UL} = this.bindings.in;

				if (DH) this.bindings.in.UH = DH;
				if (DL) this.bindings.in.UL = DL;
				if (UH) block.bindings.out.DH = UH;
				if (UL) block.bindings.out.DL = UL;

				break;
		}
	}
	drawBackground(ctx, odd, size) {
		ctx.fillStyle = `hsl(120deg 40% ${!odd ? 70 : 90}%)`;
		ctx.fillRect(0, 0, size, size);
	}
	drawPinsGrid(ctx, size) {
		let { gridLines, gridLambda } = this.constructor;

		ctx.save();

		for (let i = 0; i <= gridLines.length; i++) {
			for (let j = 0; j <= gridLines.length; j++) {
				if (!gridLambda(i, j)) continue;
				let x1 = i ? gridLines[i - 1]: 0, x2 = gridLines[i] || 1;
				let y1 = j ? gridLines[j - 1]: 0, y2 = gridLines[j] || 1;
				let x = x1 * size, y = y1 * size;
				let w = (x2 - x1) * size, h = (y2 - y1) * size;
				ctx.fillStyle = `hsl(${(x1 + y2) * 180}deg, 80%, 80%)`;
				ctx.fillRect(x, y, w, h);
			}
		}

		ctx.restore();
	}
	drawText(ctx, size) {
		if (this.operation === Op.NOP) return;

		ctx.save();

		let titleGap = 0.1;

		let cx = size / 2;
		let cy = size / 2;

		ctx.fillStyle = 'black';

		ctx.font = `bold ${size * 0.2}px monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(this.operation, cx, cy - size * titleGap);

		let s = '';
		if (this.mask === 'M') {
			ctx.font = `italic ${size * 0.15}px monospace`;
			s = 'Mask';
		} else {
			ctx.font = `bold ${size * 0.15}px monospace`;
			ctx.textAlign = 'left';
			s = this.wordLength.toString().padStart(2, 0);
		}
		ctx.fillText(s, cx, cy + size * titleGap);

		ctx.restore();
	}
	drawPins(ctx, size, withPinNames) {
		let a = 0.3, b = 0.7, dis = 0.075, d = 0.075;
		let highlightStyle = '#29f';

		let mc = ctx.getTransform();

		ctx.save();

		ctx.font = `italic 5px monospace`;
		ctx.textAlign = 'center';
		ctx.strokeStyle = '#999';

		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 2; j++) {
				let angle = (-j || 1) * i * 90 - j * 90;
				let m = mc.translate(i * size, j * size).rotate(angle);
				for (let k = 0; k < 2; k++) {
					let at = k ? a : b;
					let pinPath = k ? inPinPath : outPinPath;

					let n = j << 1 | i;

					let p1 = ['FBO', 'C1', 'C0', 'FBI'][n];
					let p2 = ['U', 'R', 'L', 'D'][n] + ['H', 'L'][k] + ['O', 'I'][k];
					let p3 = ['U', 'R', 'L', 'D'][n] + ['L', 'H'][k] + ['O', 'I'][k];

					ctx.strokeStyle = p1 === this.hoverPin ? highlightStyle : '#A0A0A0';
					ctx.setTransform(m.translate(d * size, d * size).scale(size / 100));
					ctx.beginPath();
					ctx.arc(0, 0, 3, 0, 2 * Math.PI);
					ctx.stroke();

					if (withPinNames) {
						ctx.fillStyle = '#000';
						ctx.fillText(p1, 0, 0);
					}

					ctx.fillStyle = p2 === this.hoverPin ? highlightStyle : '#A0A0A0';
					ctx.setTransform(m.translate((at - dis) * size, 0).scale(size / 100));
					ctx.fill(pinPath);

					if (withPinNames) {
						ctx.fillStyle = '#000';
						ctx.fillText(p2, 0, 10);
					}

					ctx.fillStyle = p3 === this.hoverPin ? highlightStyle : '#A0A0A0';
					ctx.setTransform(m.translate((at + dis) * size, 0).scale(size / 100));
					ctx.fill(pinPath);

					if (withPinNames) {
						ctx.fillStyle = '#000';
						ctx.fillText(p3, 0, 10);
					}
				}
			}
		}
		ctx.setTransform(mc);
		ctx.restore();
	}
	drawConnections(ctx, size) {
		ctx.save();

		ctx.textAlign = 'center';
		ctx.font = `bold ${size * 0.04}px monospace`;
		ctx.fillStyle = 'black';
		for (let i = 0; i < this.inputs.length; i++) {
			let input = this.inputs[i];
			if (!input) continue;
			let [cx, cy] = this.getGridPinPosition(input + 'I');
			ctx.fillText('I' + (i + 1), cx * size, cy * size);
		}
		for (let i = 0; i < this.outputs.length; i++) {
			let output = this.outputs[i];
			if (!output) continue;
			let [cx, cy] = this.getGridPinPosition(output + 'O');
			ctx.fillText('O' + (i + 1), cx * size, cy * size);
		}

		ctx.restore();
	}
	draw(ctx, r, c, size, params = blockDrawParamsDefault) {
		let x = r * size;
		let y = c * size;

		let m = new DOMMatrix();
		m = m.translate(x, y);

		ctx.setTransform(m);

		let odd = (r + c) % 2;
		this.drawBackground(ctx, odd, size);
		if (params.drawPinsGrid) this.drawPinsGrid(ctx, size);
		this.drawText(ctx, size);
		this.drawPins(ctx, size, params.withPinNames);
		this.drawConnections(ctx, size);
	}
	delay(tacts, callback) {
		this.delayedCallbacks.push({tacts, callback});
	}
	getInputs() {
		return this.inputs.map(i => this.bindings.in[i]);
	}
	getOutputs() {
		return this.outputs.map(i => this.bindings.out[i]);
	}
	handleCallbacks() {
		let dca = this.delayedCallbacks;

		for (let dc of dca)
			if (--dc.tacts <= 0) dc.callback();

		this.delayedCallbacks = dca.filter(dc => dc.tacts > 0);
	}
	calculate(a, b) {
		switch(this.operation) {
			case Op.And: return a & b;
			case Op.Xor: return a ^ b;
			case Op.NAnd: return !(a & b);
			case Op.Impl: return !a | b;
			case Op.NImpl: return a | !b;
		}
	}
	iterate() {

		this.handleCallbacks();

		for (let transit of this.transits) {
			let input = this.bindings.in[transit.from];
			let output = this.bindings.out[transit.to];
			let bit = input.bits[0];
			output.delay(transit.delay + 1, bit);
		}

		let [i1, i2, i3] = this.getInputs();
		let [o1, o2] = this.getOutputs();

		if (! (i1 && i2)) return;

		switch (this.mask) {
			case 'M':
				let m = i3.get(0);
				if (m) {
					let a = i1.get(1);
					let b = i2.get(1);
					let c = this.calculate(a, b);
					o1.delay(2, c);
				} else {
					o1.delay(2, 0);  // Filled zeros
				}
				break;
			case 'S':
				let a = i1.get(0);
				let b = i2.get(0);
				if (this.bitCounter > 0) {
					let c = this.calculate(a, b);
					o1.delay(1, c);
					this.bitCounter--;
				} else {
					if (a && b) {
						this.bitCounter = this.wordLength;
						if (o2) {
							o2.delay(1, 1);
						}
					} else if (o2) {
						o2.delay(1, 0);
					}
					o1.delay(1, 0);  // Filled zeros
				}
		}
	}

	toJSON() {
		let object = {};

		object.operation = this.operation;
		object.mask = this.mask;
		if (this.mask === 'S') {
			object.wordLength = this.wordLength;
		}

		object.inputs = Array.from(this.inputs);
		object.outputs = Array.from(this.outputs);
		object.transits = this.transits.map(t => t.toJSON());

		return object;
	}

	static fromJSON(json) {
		let transits = json.transits.map(t => Transit.fromJSON(t));

		let instance = new Block({
			operation: json.operation,
			mask: json.mask,
			wordLength: json.wordLength,
			inputs: Array.from(json.inputs),
			outputs: Array.from(json.outputs),
			transits,
		});

		return instance;
	}
}
class Variable {
	constructor(isInput, r, c, pin, bits = []) {
		this.isInput = isInput;
		this.row = r;
		this.column = c;
		this.pin = pin;
		this.bits = bits;
	}
	toJSON() {
		let object = {};

		object.isInput = this.isInput;
		object.row = this.row;
		object.column = this.column;
		object.pin = this.pin;
		object.bits = Array.from(this.bits);

		return object;
	}
	static fromJSON(json) {
		let { isInput, row, column, pin, bits } = json;
		return new Variable(
			isInput, row, column, pin, Array.from(bits)
		);
	}
}

class Breakpoint {
	constructor(isInput, column, row, pin, stream) {
		this.isInput = isInput;
		this.column = column;
		this.row = row;
		this.pin = pin;
		this.stream = stream;
	}
}

export {
	Op,
	Mode,
	Macros,
	Block,
	Variable,
	Breakpoint
}