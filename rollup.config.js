import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: 'src/aurelia-ui-virtualization.js',
    output: {
      file: 'dist/es2015/aurelia-ui-virtualization',
      format: 'esm'
    },
    plugin: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            allowJs: true,
          }
        }
      })
    ]
  }
]
