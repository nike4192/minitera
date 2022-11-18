<template lang="pug">

.dialog-wrap
	.dialog-box
		.dialog-titlebar
			span {{ title }}
		.dialog-container
			slot

</template>

<script>
	
	export default {
		props: ['title']
	}

</script>

<style>
	
	.dialog-wrap {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		display: flex;
		font-family: Arial;
		justify-content: center;
		align-items: center;
	}

	.dialog-box {
		padding: 0 0.5em;
		border: 1px solid gray;
		min-width: 400px;
		min-height: 200px;
	}

	.dialog-titlebar {
		padding: 0.2em 0;
		box-sizing: content-box;
		color: gray;
		border-bottom: 1px solid gray;
	}

	.dialog-container {
		padding: 0.5em 0;
	}

</style>