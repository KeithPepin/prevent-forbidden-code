#!/usr/bin/env node

'use strict';

let git = require('simple-git')(process.cwd());
let colors = require('colors'); // eslint-disable-line no-unused-vars
let fs = require('fs');
let minimatch = require('minimatch');
let finder = require('find-package-json')();
let packageJson = finder.next().value;
let projectName = 'prevent-forbidden-code';
let defaultForbid = [
    'console.log(',
    'console.info(',
    'console.error(',
    'console.warn(',
    'debugger',
    'var_dump',
    'print_r',
    'fdescribe(',
    'fit(',
    'ddescribe(',
    'iit('
];
let configExists = (packageJson && packageJson.config && packageJson.config[projectName]);
let forbidIsValid = configExists && packageJson.config[projectName].forbid && Array.isArray(packageJson.config[projectName].forbid);
let exclusionIsValid = configExists && Array.isArray(packageJson.config[projectName].exclude);
let forbiddenCode = forbidIsValid ? packageJson.config[projectName].forbid : defaultForbid;
let exclusions = exclusionIsValid ? packageJson.config[projectName].exclude : [];
let errorFound = false;

/**
 * Analyzes a given file for forbidden code
 * @param {String} fileName
 * @param {String} contents
 */
function checkFile(fileName, contents) {
    forbiddenCode.forEach(function(forbiddenItem) {
        if (contents.indexOf(forbiddenItem) > -1) {
            /* eslint-disable */
            console.log('FAILURE: '.red + 'You left a '.reset + forbiddenItem.yellow + ' in '.reset + fileName.cyan);
            /* eslint-enable */
            errorFound = true;
        }
    });
}

/**
 * Checks if a given file is excluded via the package.json config section
 * @param {String} fileName
 * @return {String} {boolean}
 */
function checkExcluded(fileName) {
    return exclusions.some(function(exclusion) {
        return minimatch(fileName, exclusion);
    });
}

/**
 * Indicates if a given file exists or not
 * @param {String} file
 * @return {boolean}
 */
function fileExists(file) {
    let fileExists = true;

    try {
        fs.statSync(file, function(err, stat) {
            if (err == null) {
                fileExists = true;
            } else {
                fileExists = false;
            }
        });
    } catch (e) {
        fileExists = false;
    }

    return fileExists;
}

git.diff(['--cached', '--name-only'], function(error, diff) {
    let initialFiles = diff.trim().split('\n');
    let files = [];

    /* eslint-disable */
    console.log('[ >>> BEGIN PRE-COMMIT FORBIDDEN CODE CHECK ]'.green);
    /* eslint-enable */

    initialFiles.reduce(function(previous, current) {
        if (!checkExcluded(current) && fileExists(current)) {
            previous.push(current);
        }

        return previous;
    }, files);

    files.forEach(function(file) {
        let fileContents = fs.readFileSync(file, 'utf-8');

        checkFile(file, fileContents);
    });

    if (errorFound) {
        /* eslint-disable */
        console.log('[ >>> COMMIT REJECTED ]'.red);
        console.log('If you absolutely need to commit this use git commit --no-verify (-n)'.red);
        /* eslint-enable */
        process.exit(1);
    } else {
        /* eslint-disable */
        console.log('[ >>> PRE-COMMIT FORBIDDEN CODE CHECK COMPLETE ]'.green);
        /* eslint-enable */
        process.exit(0);
    }
});
