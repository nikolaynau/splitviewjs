import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"
import resolve from "@rollup/plugin-node-resolve"

const pkg = require("./package.json")

const output = {
  globals: {
    "split.js": "Split"
  },
  format: "umd",
  file: pkg.main,
  name: "splitview",
  sourcemap: false,
  banner: `/*! @ba/splitview - v${pkg.version} */\n`,
}

const external = [
  "split.js"
]

export default [
  {
    input: "src/index.js",
    output: [
      output,
      {
        file: pkg.module,
        format: "esm",
        sourcemap: false,
      },
    ],
    external,
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled"
      })
    ]
  },
  {
    input: "src/index.js",
    output: {
      ...output,
      sourcemap: true,
      file: pkg["minified:main"],
    },
    external,
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled"
      }),
      terser()
    ]
  }
]
