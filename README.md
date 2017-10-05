# prevent-forbidden-code

This module is intended as a [ghooks](https://www.npmjs.com/package/ghooks "Kent Dodds' simple git hooks module") or [husky](https://www.npmjs.com/package/husky) compatible plugin that prevents unwanted code from being committed into your repository.

[![NPM](https://nodei.co/npm/prevent-forbidden-code.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/prevent-forbidden-code/)

[![NPM Version](https://img.shields.io/npm/v/prevent-forbidden-code.svg?style=flat-square)](https://www.npmjs.com/package/prevent-forbidden-code)
[![Build Status](https://travis-ci.org/KeithPepin/prevent-forbidden-code.svg?branch=master)](https://travis-ci.org/KeithPepin/prevent-forbidden-code)
[![npm](https://img.shields.io/npm/dt/prevent-forbidden-code.svg?style=flat-square)](https://www.npmjs.com/package/prevent-forbidden-code)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![David](https://david-dm.org/KeithPepin/prevent-forbidden-code/status.svg?style=flat-square)](https://david-dm.org/KeithPepin/prevent-forbidden-code)
[![David](https://david-dm.org/KeithPepin/prevent-forbidden-code/dev-status.svg?style=flat-square)](https://david-dm.org/KeithPepin/prevent-forbidden-code?type=dev)

## Prerequisites

- git
- Node >= 4.4.x
- ghooks

Make sure you have a git repository (`git init`) BEFORE installing ghooks, otherwise you have to take extra steps if you install ghooks before running `git init`.

## Installing

```
npm install prevent-forbidden-code ghooks --save-dev
```

## Basic Configuration

```
// inside package.json
...
  "config": {
    "ghooks": {
      "pre-commit": "prevent-forbidden-code",
    }
  }
...
```

## How it works, and default settings
By default, `prevent-forbidden-code` screens for the following array of commands in your code:

```javascript
[
    "console.log(",
    "console.info(",
    "console.error(",
    "console.warn(",
    "debugger",
    "var_dump",
    "print_r",
    "fdescribe(",
    "fit(",
    "ddescribe(",
    "iit("
]
```

With each commit, the committed files are scanned for any lines containing these commands.  If found, `prevent-forbidden-code` alerts you as to the type of offending command found, and where they were found:

```bash
[ >>> BEGIN PRE-COMMIT FORBIDDEN CODE CHECK ]
FAILURE: You left a console.log( in README.md
[ >>> COMMIT REJECTED ]
If you absolutely need to commit this use git commit --no-verify (-n)
```

**Note:** You can prevent the scan entirely by using the `--no-verify` flag on your commit, as mentioned in the output sample above.

## Configuration Options

### Exclusions
Adding exclusions to your configuration allows `prevent-forbidden-code` to skip one or more matching files from the scan.  Under the hood, `prevent-forbidden-code` uses the excellent [minimatch](https://www.npmjs.com/package/minimatch "minimatch's npm page") module to convert glob expressions in the array into regular expressions for file name matching.  In the following configuration sample, all usages of the normally prevented commands in any markdown file would would be allowed.

```
// inside package.json
...
  "config": {
    "ghooks": {
      "pre-commit": "prevent-forbidden-code",
    },
    "prevent-forbidden-code": {
      "exclude": ["*.md"]
    }
  }
...
```

### Rejecting Custom Lists of Commands
To override the default list of forbidden commands, just add your own `forbid` parameter to the config as an array of commands strings.  The following example would scan files only for `describe.only(` and `it.only(` usages.

```
// inside package.json
...
  "config": {
    "ghooks": {
      "pre-commit": "prevent-forbidden-code",
    },
    "prevent-forbidden-code": {
      "forbid": ["describe.only(", "it.only("]  
      "exclude": ["*.md"]
    }
  }
...
```

## License
This software is licensed under the MIT license.
