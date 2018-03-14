import typescript from "rollup-plugin-typescript2";

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist.es/main.js',
      format: 'es'
    },
    {
      file: 'dist.umd/main.js',
      format: 'umd',
      name: "Sajari"
    }
  ],
  plugins: [
    typescript({ abortOnError: false })
  ]
};

