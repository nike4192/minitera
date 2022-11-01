
const webpack = require('webpack');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');


module.exports = {
	mode: process.env.NODE_ENV || 'development',
	entry: {
		'main': './src/main.js'
	},
	output: {
		path: path.resolve(__dirname, 'public/js'),
		filename: '[name].bundle.js'
	},
	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			path.resolve(__dirname, 'node_modules')
		],
		alias: {
			'vue$': path.resolve(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js')
		}
	},
	module: {
		rules: [
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
