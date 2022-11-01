
<template lang="pug">

.breakpoint-container
	div
		button(@click="iterate") Tacts {{ tacts }}
	table.breakpoints-info
		tr(v-for="bp of breakpoints")
			td {{ bp.isInput ? 'IN' : 'OUT' }}
			td {{ bp.column }}
			td {{ bp.row }}
			td {{ bp.pin }}
	.breakpoints-streams-container
		table.breakpoints-streams(
			ref="streamsTable"
			@keydown="streamsTableKeyDownHandler")
			tr(v-for="(bp, i) of breakpoints")
				td(v-for="(v, j) in maxBitLength",
					:bpi="i", :si="j"
					:value="streamBits[i][j]"
					:tabIndex="j >= tacts && bp.isInput || null"
					:current="j === tacts - 1 ? true : null") {{ streamBits[i][j] || 0 }}

</template>

<script>

	import { Breakpoint } from '/src/minitera.js';

	export default {
		props: ['macros'],
		data() {
			return {
				tacts: 0,
				minBitLength: 64
			}
		},
		computed: {
			breakpoints() {
				return this.macros.getBreakpoints();
			},
			maxBitLength() {
				let maxBitLength = Math.max.apply(Math, this.breakpoints.map(bp => bp.stream.all.length));
				return Math.max(maxBitLength, this.tacts, this.minBitLength);
			},
			streamBits() {
				let { breakpoints } = this;
				return breakpoints.map(bp => bp.stream.all);
			}
		},
		methods: {
			iterate() {
				this.macros.iterate();
				this.tacts++;
			},
			streamsTableKeyDownHandler(e) {
				let { key, target } = e;
				if (!['0', '1'].includes(key)) return;

				let value = parseInt(key);
				let bpi = parseInt(target.getAttribute('bpi'));
				let si = parseInt(target.getAttribute('si'));
				this.breakpoints[bpi].stream.bits[si] = value;
				if (target.nextElementSibling) {
					target.nextElementSibling.focus();
				} else if (target.parentElement.nextElementSibling) {
					let nextRow = target.parentElement.nextElementSibling;
					let nextCell = nextRow.querySelector(`[si="${this.tacts}"]`);
					if (nextCell) nextCell.focus();
				}
			}
		},
		watch: {
			macros() {
				console.log(macros);
				this.tacts = 0;
			}
		}
	}

</script>

<style>
	.breakpoint-container {
		padding: 0 1em;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--main-background-color);
		--border-color: lightgray;
		--selected-background: #29f;

		--zero-bit-color: #C695C6;  /* #99C794 #C695C6 */
		--one-bit-color: crimson;
	}
	.breakpoint-container table {
		float: left;
		font-family: monospace;
		font-size: 1.1em;
		border-collapse: collapse;
	}

	table.breakpoints-info {
		cursor: default;
	}
	table.breakpoints-info td {
		padding-left: 0.3em;
		padding-right: 0.3em;
	}

	.breakpoints-streams-container {
		overflow-x: scroll;
	}

	/* Breakpoint Streams */

	table.breakpoints-streams {
		cursor: default;
	}
	table.breakpoints-streams tr {
		border-top: 1px solid var(--border-color);
		border-bottom: 1px solid var(--border-color);
	}
	table.breakpoints-streams td {
		padding-left: 0.2em;
		padding-right: 0.2em;
		border: none;
		border-right: 1px solid var(--border-color);
	}
	table.breakpoints-streams td:focus {
		background: var(--selected-background);
	}
	table.breakpoints-streams td[current]  {
		border-right: 1px solid red;
	}
	table.breakpoints-streams td[current] ~ td {
		color: gray;
	}

	table.breakpoints-streams td            { color: var(--zero-bit-color); }
	table.breakpoints-streams td[value="1"] { color: var(--one-bit-color); }
</style>