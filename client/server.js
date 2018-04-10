import path from 'path';
import express from 'express';
let webpackDevServer = require('webpack-dev-server');

const port = 4000;
const app = express();

let webpack = require('webpack');
let webpackMiddleware = require('webpack-dev-middleware');
let webpackHotMiddleware = require('webpack-hot-middleware');
let config = require('./webpack.config.js');

const compiler = webpack(config);

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

const bundleFolder = path.join(__dirname, './dist');
const bundlePath = path.join(__dirname, './dist/index.html');

app.use(middleware);
app.use(webpackHotMiddleware(compiler));

app.use('/', express.static(bundleFolder));

app.get('*', function response(req, res) {
    res.sendFile(bundlePath);
    // res.write(middleware.fileSystem.readFileSync(bundlePath));
    // res.end();
});


app.listen(port, '0.0.0.0', function onStart(err) {
    if (err) {
        console.log(err);
    }
    console.info('==> Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
})