const path = require('path');

module.exports = {
  entry: {
    main: {
      import: './src/index.ts',
      dependOn: 'common',
    },
    common: 'three',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 500,
  },
};
