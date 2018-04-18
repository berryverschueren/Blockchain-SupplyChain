'use strict'

// Imports.
import path from 'path';
import express from 'express';
const proxy = require('express-http-proxy');
const { REST_API } = require('./config');
let webpackDevServer = require('webpack-dev-server');

// Object: Instantiate the express module.
const app = express();

// Object: Instantiate the webpack module.
let webpack = require('webpack');
let webpackMiddleware = require('webpack-dev-middleware');
let webpackHotMiddleware = require('webpack-hot-middleware');

// Object: Read the webpack config file.
let config = require('./webpack.config.js');

// Object: Use the config file to set up webpack.
const compiler = webpack(config);

// Object: Instantiate the middleware module.
const middleware = webpackMiddleware(compiler, {
    publicPath: config.output.publicPath,
    noInfo: true,
    quite: false,
    lazy: false,
    watchOptions: {
        aggregateTimeout: 300,
        poll: true
    },
    stats: {
        colors: true,
    }
});

// Provide the webpack generated dist folder to express.
//app.use(express.static(__dirname + './dist'));

// Provide the webpack middleware to express.
app.use(middleware);

// Provide the webpack hotloading module to express.
app.use(webpackHotMiddleware(compiler));

// Serve compiled code on the home url and derivations of the home url.
app.use('/', express.static(process.cwd() + '/dist'));
app.use('/#', express.static(process.cwd() + '/dist'));
app.use('/#assets', express.static(process.cwd() + '/dist'));

// Set up a proxy using the express-http-proxy module.
app.use('/api', proxy(REST_API, {  
    proxyReqPathResolver: function(req) {
    return require('url').parse(req.url).path;
  }
}));

// Tell the server to listen on port 3000.
app.listen(3000);