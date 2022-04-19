import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const pkgName = pkg.name;
const inputFileName = `src/${pkgName}.ts`;

export default [
  {
    input: inputFileName,
    output: [
      {
        file: `dist/es2015/${pkgName}.js`,
        format: 'esm'
      },
      {
        file: `dist/umd-es2015/${pkgName}.js`,
        format: 'umd',
        name: 'au.uiVirtualization',
        globals: {
          'aurelia-binding': 'au',
          'aurelia-dependency-injection': 'au',
          'aurelia-pal': 'au',
          'aurelia-templating': 'au',
          'aurelia-templating-resources': 'au',
        }
      }
    ],
    plugins: [
      typescript({
        removeComments: true,
      })
    ]
  },
  {
    input: inputFileName,
    output: [{
      file: `dist/es2017/${pkgName}.js`,
      format: 'esm'
    }],
    plugins: [
      typescript({
        target: 'es2017',
        removeComments: true,
      })
    ]
  },
  {
    input: inputFileName,
    output: [
      { file: `dist/amd/${pkgName}.js`, format: 'amd', amd: { id: pkgName } },
      { file: `dist/commonjs/${pkgName}.js`, format: 'cjs' },
      { file: `dist/system/${pkgName}.js`, format: 'system' },
      { file: `dist/native-modules/${pkgName}.js`, format: 'esm' },
    ],
    plugins: [
      typescript({
        target: 'es5',
        removeComments: true,
      })
    ]
  },
  {
    input: inputFileName,
    output: [{
      file: `dist/umd/${pkgName}.js`,
      format: 'umd',
      name: 'au.uiVirtualization',
      globals: {
        'aurelia-binding': 'au',
        'aurelia-dependency-injection': 'au',
        'aurelia-pal': 'au',
        'aurelia-templating': 'au',
        'aurelia-templating-resources': 'au',
      }
    }],
    plugins: [
      typescript({
        target: 'es5',
        removeComments: true,
      })
    ]
  },
].map(config => {
  config.external = [
    'aurelia-binding',
    'aurelia-dependency-injection',
    'aurelia-pal',
    'aurelia-templating',
    'aurelia-templating-resources'
  ];
  config.output.forEach(output => output.sourcemap = true);
  config.onwarn = /** @param {import('rollup').RollupWarning} warning */ (warning, warn) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  };
  return config;
});
