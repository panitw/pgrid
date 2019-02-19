module.exports = {
    entry: './src/main.js',
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'pgrid.js'
    },
    module: {
        rules: [{
            test: /\.less$/,
            loader: 'less-loader' // compiles Less to CSS
        }]
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