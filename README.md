# @materya/pg-tools

[![NPM version][npm-image]][npm-url]
[![Dependency Status][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![codecov][codecov-image]][codecov-url]
[![License][license-image]][license-url]

A set of tools to manipulate a PosgreSQL Database for your projects,
based on [Slonik](https://github.com/gajus/slonik).

*This is an alpha project, work is still in progress.*

> **DO NOT USE IN PRODUCTION**

## Install

```
npm i -D @materya/pg-tools
```

## Tools

### Migrate

A simple migrations command manager

#### Usage

* Run all migrations from last applied one
  ```
  npm run migrate -- up
  ```

* Reverse all migrations
  ```
  npm run migrate -- down
  ```

### Seed

A simple seeds command manager

#### Usage

* Run all seeds from last applied one
  ```
  npm run seed -- up
  ```

* Reverse all seeds
  ```
  npm run seed -- down
  ```

## License

[GPL-3.0](LICENSE)

[npm-image]: https://img.shields.io/npm/v/@materya/pg-tools/latest?style=flat-square
[npm-url]: https://npmjs.org/package/@materya/pg-tools
[david-image]: https://img.shields.io/david/materya/pg-tools?style=flat-square
[david-url]: https://david-dm.org/materya/pg-tools
[snyk-image]: https://snyk.io/test/github/materya/pg-tools/badge.svg?style=flat-square
[snyk-url]: https://app.snyk.io/test/github/materya/pg-tools?targetFile=package.json
[codecov-image]: https://img.shields.io/codecov/c/github/materya/pg-tools/master.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/materya/pg-tools
[license-image]: https://img.shields.io/npm/l/@materya/pg-tools?style=flat-square
[license-url]: LICENSE
