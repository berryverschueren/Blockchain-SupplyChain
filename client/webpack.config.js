const path = require('path');
const webpack = require('webpack');

let jsPath = path.resolve(__dirname, 'app.js');
let htmlPath = path.resolve(__dirname, 'index.html');

module.exports = {
    mode: 'development',
    context: __dirname,
    entry: [
        'webpack-hot-middleware/client?reload=true',
        jsPath,
        htmlPath
    ],

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [{
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: require.resolve('babel-loader'),
                    query: {
                        presets: ['env']
                    }
                },
            }, {
                test: /\.html$/,
                use: {
                    loader: require.resolve('file-loader'),
                    query: {
                        name: '[name].[ext]'
                    }
                }
            }],
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
}