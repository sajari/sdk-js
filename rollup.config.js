import typescript from "rollup-plugin-typescript2";
import uglify from "rollup-plugin-uglify";

export default [
  {
    input: "src/main.ts",
    output: [
      {
        file: "dist.es/main.js",
        format: "es"
      },
      {
        file: "dist.cjs/main.js",
        format: "cjs",
        name: "Sajari"
      }
    ],
    plugins: [typescript()]
  },
  {
    input: "src/main.ts",
    output: {
      file: "dist.iife/main.js",
      format: "iife",
      name: "Sajari",
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
