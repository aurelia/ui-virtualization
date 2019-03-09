const path = require('path');
const { AureliaPlugin } = require('aurelia-webpack-plugin');

module.exports = function(config) {
  const browsers = config.browsers;
  config.set({

    basePath: '',
    frameworks: ["jasmine"],
    files: ["test/**/*.spec.ts", "test/**/*.spec.tsx"],
    preprocessors: {
      "test/**/*.spec.ts": ["webpack", "sourcemap"],
      "test/**/*.spec.tsx": ["webpack", "sourcemap"]
    },
    webpack: {
      mode: "development",
      resolve: {
        extensions: [".ts", ".tsx", ".js"],
        modules: ["src", 'test', "node_modules"],
        alias: {
          src: path.resolve(__dirname, "src"),
          test: path.resolve(__dirname, 'test')
        }
      },
      devtool: browsers.indexOf('ChromeDebugging') > -1 ? 'eval-source-map' : 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
            options: {
              compilerOptions: {
                sourceMap: true
              }
            }
          },
          {
            test: /\.html$/i,
            loader: 'html-loader'
          }
        ]
      },
      plugins: [
        new AureliaPlugin({
          noHtmlLoader: true,
          noWebpackLoader: true,
          aureliaApp: undefined,
          features: { 
            ie: false,
            svg: false,
            unparser: false,
            polyfills: "esnext"
          }
        })
      ]
    },
    mime: {
      "text/x-typescript": ["ts"]
    },
    reporters: ["mocha"],
    webpackServer: { noInfo: config.noInfo },
    browsers: browsers && browsers.length > 0 ? browsers : ['ChromeHeadlessOpt'],
    customLaunchers: {
      ChromeDebugging: {
        base: "Chrome",
        flags: [...commonChromeFlags, "--remote-debugging-port=9333"],
        debug: true
      },
      ChromeHeadlessOpt: {
        base: 'ChromeHeadless',
        flags: [
          ...commonChromeFlags
        ]
      }
    },
    singleRun: false,
    mochaReporter: {
      ignoreSkipped: true
    },
    // webpackMiddleware: {
    //   // webpack-dev-middleware configuration
    //   // i. e.
    //   stats: 'errors-only'
    // }
  });
};


const commonChromeFlags = [
  '--no-default-browser-check',
  '--no-first-run',
  '--no-managed-user-acknowledgment-check',
  '--no-pings',
  '--no-sandbox',
  '--no-wifi',
  '--no-zygote',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backing-store-limit',
  '--disable-boot-animation',
  '--disable-breakpad',
  '--disable-cache',
  '--disable-clear-browsing-data-counters',
  '--disable-cloud-import',
  '--disable-component-extensions-with-background-pages',
  '--disable-contextual-search',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-infobars',
  '--disable-translate',
  '--disable-sync'
];