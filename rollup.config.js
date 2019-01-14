import typescript from "rollup-plugin-typescript2";
import { uglify } from "rollup-plugin-uglify";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist.umd/index.js",
      format: "umd",
      name: "SajariSearch"
    },
    plugins: [
      typescript({
        tsconfigOverride: { compilerOptions: { target: "es5" } },
        useTsconfigDeclarationDir: true
      }),
      uglify()
    ]
  },
  {
    input: "src/index.ts",
    output: {
      file: "dist.iife/index.js",
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
  }
];
