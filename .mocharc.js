module.exports = {
  require: [
    'ts-node/register/transpile-only',
    'tsconfig-paths/register',
  ],
  file: [
    './test/mocha.env.ts',
    './test/mocha.setup.ts',
  ],
  timeout: 10000,
  recursive: true,
  colors: true,
  exit: true,
}
