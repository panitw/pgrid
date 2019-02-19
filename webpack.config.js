const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: './src/main.js',
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'pgrid.js'
    },
    target: 'web',
    mode: 'production',
    node: {
        global: false,
        process: false,
        __filename: false,
        __dirname: false,
        Buffer: false,
        setImmediate: false
    }
};