import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy';
import pkg from './package.json';

const isDevelopment = process.env.NODE_ENV === 'development';

const output = {
  globals: {
    'split.js': 'Split'
  },
  format: 'umd',
  file: 'dist/splitview.js',
  name: 'SplitView',
  sourcemap: false,
  banner: `/*! ${pkg.name} - v${pkg.version} */\n`
};

const external = ['split.js'];

export default [
  {
    input: 'src/index.js',
    output: [
      output,
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: false
      }
    ],
    external,
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled'
      }),
      css({ output: 'splitview.css' }),
      copy({
        targets: [{ src: 'demo/index.html', dest: 'dist' }]
      }),
      ...(isDevelopment ? [serve('dist')] : [])
    ]
  },
  {
    input: 'src/index.js',
    output: {
      ...output,
      sourcemap: true,
      file: 'dist/splitview.min.js'
    },
    external,
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled'
      }),
      css({
        output: 'splitview.min.css',
        minify: true
      }),
      terser()
    ]
  }
];
