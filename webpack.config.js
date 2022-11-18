
const webpack = require('webpack');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');


module.exports = {
	mode: process.env.NODE_ENV || 'development',
	entry: {
		'main': './src/main.ts'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].bundle.js'
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		modules: [
			path.resolve(__dirname, 'src'),
			path.resolve(__dirname, 'node_modules')
		],
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'vue$': path.resolve(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js')
		}
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				loader: 'svg-inline-loader',
				options: {
					removeSVGTagAttrs: false,
					removingTags: []
				}
			},
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				options: {
					appendTsSuffixTo: [/\.vue$/],
				},
				exclude: /node_modules/,
			},
			{
				test: /\.pug$/,
				loader: 'vue-pug-loader'
			},
			{
				test: /\.js$/,
				loader: 'babel-loader'
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},
			{
				test: /\.css$/,
				use: [
					'vue-style-loader',
					'css-loader'
				]
			},
			{
				test: /\.styl(us)?$/,
				use: [
					'vue-style-loader',
					'css-loader',
					'stylus-loader'
				]
			}
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: true,
		}),
		new VueLoaderPlugin()
	]
}
