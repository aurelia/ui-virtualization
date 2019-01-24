const { AureliaPlugin } = require('aurelia-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const aureliaModules = [
  'binding',
  'templating',
  'framework',
  'bootstrapper',
  'event-aggregator',
  'templating-resources',
  'dependency-injection',
  'pal',
  'pal-browser',
  'router',
  'templating-router',
  'metadata',
  'task-queue',
  'history',
  'history-browser',
  'logging',
  'logging-console',
  'path'
];

module.exports = (env = {}) => {
  const isProduction = env.prod === 'production';
  return {
    mode: isProduction ? 'production' : 'development',
    resolve: {
      extensions: [".ts", ".js"],
      modules: ["src", "node_modules"],
      alias: {
        ...aureliaModules
          .map(mName => `aurelia-${mName}`)
          .reduce((mNameMap, mName) => {
            mNameMap[mName] = path.resolve(__dirname, `./node_modules/${mName}`);
            return mNameMap;
          }, {}),
        // 'aurelia-binding': path.resolve(__dirname, './node_modules/aurelia-binding'),
        // 'aurelia-templating': path.resolve(__dirname, './node_modules/aurelia-templating'),
        // 'aurelia-framework': path.resolve(__dirname, './node_modules/aurelia-framework'),
        // 'aurelia-templating-resources': path.resolve(__dirname, './node_modules/aurelia-templating-resources'),
        // 'aurelia-dependency-injection': path.resolve(__dirname, './node_modules/aurelia-dependency-injection'),
        // 'aurelia-metadata': path.resolve(__dirname, './node_modules/aurelia-metadata'),
        // 'aurelia-pal': path.resolve(__dirname, './node_modules/aurelia-pal'),
        // 'aurelia-pal-browser': 'aurelia-pal-browser',
        // 'aurelia-task-queue': path.resolve(__dirname, 'node_modules/aurelia-task-queue'),
        'aurelia-ui-virtualization': path.resolve(__dirname, '../../src/aurelia-ui-virtualization.ts')
      }
    },
    entry: {
      // application entry file is app and 
      app: ["aurelia-bootstrapper"],
    },
    output: {
      // If production, add a hash to burst cache
      filename: isProduction ? '[name].[hash].js' : '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'awesome-typescript-loader',
          exclude: path.resolve(__dirname, 'node_modules')
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            attrs: false,
            minimize: true,
            removeComments: true,
            removeCommentsFromCDATA: true,
            removeCDATASectionsFromCDATA: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            removeAttributeQuotes: true,
            useShortDoctype: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            removeScriptTypeAttributes: true,
            removeStyleTypeAttributes: true,
          }
        }
      ]
    },
    plugins: [
      new AureliaPlugin(),
      // Standard plugin to build index.html
      new HtmlWebpackPlugin({
        template: 'index.ejs'
      }),
      new CopyWebpackPlugin([
        // Have all static files / asessts copied over
        { from: 'static/**', to: '.' },
        // Have base vendor css and javascript copied over
        { context: 'node_modules/jquery/dist', from: 'jquery.min.js', to: 'static/js' },
        { context: 'node_modules/bootstrap/dist/js', from: 'bootstrap.bundle.min.js', to: 'static/js' },
        { context: 'node_modules/bootstrap/dist/css', from: '**', to: 'static/css', ignore: '**.map' }
      ], {
          copyUnmodified: true
      }),
    ]
  };
};
