import path from 'path';
import express from 'express';
let webpackDevServer = require('webpack-dev-server');
const proxy = require('express-http-proxy');
const { REST_API } = require('./config');
const app = express();

// console.log('Using development configuration!');
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

app.use(express.static(__dirname + './dist'));
const bundlePath = path.join(__dirname, './dist/index.html');


app.use(middleware);
app.use(webpackHotMiddleware(compiler));

// serve static code (compiled JS)
app.use('/', express.static(process.cwd() + '/dist'));

// this is the proxy - it will request the external api when you hit /api
// http://localhost:3000/api -> http://example.com/api
app.use('/api', proxy(REST_API/*'localhost:8008/'*/, {  
    proxyReqPathResolver: function(req) {
    return require('url').parse(req.url).path;
  }
  // this passes any URL params on to the external api
  // eg /api/user/1234 -> example.com/api/user/1234
//   forwardPath: (req, res) => '/api' + (url.parse(req.url).path === '/' ? '' : url.parse(req.url).path)

// tell it to use port 3000 - localhost:3000
})).listen(3000);


// app.get('*', function response(req, res) {
//     res.write(middleware.fileSystem.readFileSync(bundlePath));
//     res.end();
// // });



// app.listen(port, '0.0.0.0', function onStart(err) {
//     if (err) {
//         console.log(err);
//     }
//     console.info('==> Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
// });
