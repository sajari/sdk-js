import typescript from "rollup-plugin-typescript2";

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist.es/main.js',
      format: 'es'
    },
    {
      file: 'dist.cjs/main.js',
      format: 'cjs'
    }
  ],
  plugins: [
    typescript({ abortOnError: false })
  ]
};

