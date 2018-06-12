import typescript from "rollup-plugin-typescript2";
import { uglify } from "rollup-plugin-uglify";

const input = "index";
const outputDir = "dist";
const output = input;

const outputs = {
  es: {
    target: "es6"
  },
  cjs: {
    target: "es5"
  }
};

export default Object.entries(outputs)
  .map(([format, config]) => ({
    input: `src/${input}.ts`,
    output: {
      file: `${outputDir}.${format}/${output}.js`,
      format
    },
    plugins: [
      typescript({
        tsconfigOverride: { compilerOptions: { target: config.target } },
        useTsconfigDeclarationDir: true
      })
    ]
  }))
  .concat({
    input: `src/${input}.ts`,
    output: {
      file: `${outputDir}.iife/${output}.js`,
      format: "iife",
      name: "SajariSearch",
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: { declaration: false, sourceMap: true }
        }
      }),
      uglify()
    ]
  });
