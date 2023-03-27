import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'assets/js/index.js',
  output: [
    {
      format: 'esm',
      file: 'assets/js/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};