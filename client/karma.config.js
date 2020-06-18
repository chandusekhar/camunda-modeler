/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

var coverage = process.env.COVERAGE,
    modelers = process.env.MODELERS;

if (coverage) {

  // must set NODE_ENV to coverage to activate
  // babel-plugin-istanbul (cf. babel config)
  process.env.NODE_ENV = 'coverage';
}

var path = require('path');
var os = require('os');

var platform = os.platform();
var windows = /^win/.test(platform);

var { DefinePlugin } = require('webpack');

var absoluteBasePath = path.resolve(__dirname);
var resourcePath = path.resolve(__dirname + '/resources');

/* global process */

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'IE', 'PhantomJS' ]
var browsers =
  (process.env.TEST_BROWSERS || 'ChromeHeadless')
    .replace(/^\s+|\s+$/, '')
    .split(/\s*,\s*/g)
    .map(function(browser) {
      if (browser === 'ChromeHeadless') {
        process.env.CHROME_BIN = require('puppeteer').executablePath();

        // workaround https://github.com/GoogleChrome/puppeteer/issues/290
        if (process.platform === 'linux') {
          return 'ChromeHeadless_Linux';
        }
      }

      return browser;
    });

var suite = 'test/suite.js';

if (coverage) {
  suite = 'test/all.js';
} else if (modelers) {
  suite = 'test/modelers.js';
}


module.exports = function(karma) {
  karma.set({

    frameworks: [
      'mocha',
      'sinon-chai'
    ],

    files: [
      suite
    ],

    preprocessors: {
      [suite]: [ 'webpack', 'env' ]
    },

    reporters: [ 'spec' ].concat(coverage ? 'coverage' : []),

    customLaunchers: {
      ChromeHeadless_Linux: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        debug: true
      }
    },

    coverageReporter: {
      reporters: [
        { type: 'lcov', subdir: modelers ? 'modelers' : 'all' }
      ]
    },

    browsers: browsers,

    browserNoActivityTimeout: 30000,

    singleRun: true,
    autoWatch: false,

    webpack: {
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
          },
          {
            oneOf: [
              {
                test: /[/\\][A-Z][^/\\]+\.svg$/,
                use: 'react-svg-loader'
              },
              {
                test: /\.(css|bpmn|cmmn|dmn|less|xml|png|svg)$/,
                use: 'raw-loader'
              }
            ]
          }
        ]
      },
      plugins: [
        new DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('test'),
            WINDOWS: JSON.stringify(windows)
          }
        })
      ],
      resolve: {
        mainFields: [
          'dev:module',
          'browser',
          'module',
          'main'
        ],
        modules: [
          'node_modules',
          absoluteBasePath,
          resourcePath
        ],
        alias: {
          'bpmn-js/lib/Modeler': modelers ? 'bpmn-js/lib/Modeler' : 'test/mocks/bpmn-js/Modeler',
          'cmmn-js/lib/Modeler': modelers ? 'cmmn-js/lib/Modeler' : 'test/mocks/cmmn-js/Modeler',
          'dmn-js/lib/Modeler': modelers ? 'dmn-js/lib/Modeler' : 'test/mocks/dmn-js/Modeler',
          './DmnModeler': modelers ? './DmnModeler' : 'test/mocks/dmn-js/Modeler',
          './CodeMirror': 'test/mocks/code-mirror/CodeMirror',
          'sourcemapped-stacktrace': 'test/mocks/sourcemapped-stacktrace'
        }
      }
    }
  });
};