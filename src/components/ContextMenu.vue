
<script>

	import { h } from 'vue';
	
	export default {
		props: ['event', 'items'],
		updated() {
			this.setPosition();
		},
		mounted() {
			this.setPosition();
			this.$el.addEventListener('contextmenu', this.contextMenuHandler);
		},
		unmounted() {
			this.$el.removeEventListener('contextmenu', this.contextMenuHandler);
		},
		methods: {
			contextMenuHandler(e) {
				e.preventDefault();
			},
			setPosition() {
				let { clientX, clientY } = this.event;
				this.$el.style.left = `${clientX}px`;
				this.$el.style.top = `${clientY}px`;
			},
			renderItemList(items) {
				return h('ul', items.map(item => {
					let span = h('span', { innerHTML: item.label });
					let attrs = {
						checked: item.checked || null
					};
					if (item.handler && typeof item.handler === 'function') {
						attrs.onClick = (e) => item.handler(item.value, e);
					}
					let children = [span];

					if (item.children) {
						children = children.concat(item.children);
					}
					if (item.subitems) {
						attrs.subitems = true;
						children = children.concat(this.renderItemList(item.subitems));
					}

					return h('li', attrs, children);
				}));
			}
		},
		render() {
			let { items } = this;
			return h('div', {
				class: 'contextmenu'
			},
			this.renderItemList(items));
		},
		watch: {
			event() { this.$forceUpdate(); },
			items() { this.$forceUpdate(); }
		}
	}

</script>

<style>
	.contextmenu {
		position: fixed;
	}
	.contextmenu ul {
		margin: 0;
		padding: 4px 0;
		list-style: none;
		background: white;
		border-radius: 4px;
		box-shadow: 0 0 8px #0003;
	}
	.contextmenu ul li {
		position: relative;
		padding: 0 2rem 0 1rem;
		min-width: 60px;
		font-size: 1.1rem;
		font-family: Helvetica;
		user-select: none;
		color: black;
	}
	.contextmenu ul > li:hover {
		background-color: gray;
		color: white;
	}
	.contextmenu ul > li[subitems]:hover::after {
		background-color: white;
	}
	.contextmenu ul > li[subitems]::after {
		content: '';
		position: absolute;
		margin-top: -6px;
		top: 50%;
		right: 12px;
		width: 12px;
		height: 12px;
		clip-path: path('M0 0 L12 6 L0 12 Z');
		background-color: black;
	}
	.contextmenu ul > li[checked]::after {
		content: '';
		position: absolute;
		margin-top: -6px;
		top: 50%;
		right: 12px;
		width: 12px;
		height: 12px;
		clip-path: path('M 10.1425,1.75 4.5,7.5335002 1.857,5.0280002 0,6.8860002 4.5,11.25 12,3.6075 Z');
		background-color: black;
	}
	.contextmenu ul ul {
		position: absolute;
		top: -4px;
		left: calc(100% - 4px);
	}
	.contextmenu ul li > ul {
		visibility: hidden;
	}
	.contextmenu ul li:hover > ul,
	.contextmenu ul li > ul:hover {
		visibility: visible;
	}
</style>