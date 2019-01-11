import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: 'src/aurelia-ui-virtualization.ts',
    output: {
      file: 'dist/es2015/aurelia-ui-virtualization.js',
      format: 'esm'
    },
    plugins: [
      typescript({
        cacheRoot: '.rollupcache',
        tsconfigOverride: {
          compilerOptions: {
          }
        }
      })
    ]
  }
]
