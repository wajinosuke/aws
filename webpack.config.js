var path = require('path');
module.exports = {
    mode: 'development',
    target: 'node',
    devtool: 'source-map',
    entry: [path.join(__dirname, '/src/index.js')],
    output: {
        path: `${__dirname}/dist`,
        filename: 'main.js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }]
    }
};