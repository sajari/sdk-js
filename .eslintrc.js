module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaFeatures: {
      ecmaVersion: 8,
      experimentalObjectRestSpread: true
    },
    sourceType: "module"
  },
  overrides: {
    files: "src/*.js",
    excludedFiles: "**.*.test.js"
  },
  plugins: ["class-property", "import"],
  rules: {
    "linebreak-style": ["error", "unix"],
    semi: ["error", "always"],
    "import/no-unresolved": [2, { commonjs: true, amd: true }],
    "import/named": 2,
    "import/namespace": 2,
    "import/default": 2,
    "import/export": 2,
    "no-unused-vars": ["error", { ignoreRestSiblings: true }]
  }
};
