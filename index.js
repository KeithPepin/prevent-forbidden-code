#!/usr/bin/env node

'use strict';

var git = require('simple-git')(process.cwd());
var colors = require('colors'); // eslint-disable-line no-unused-vars
var fs = require('fs');
var minimatch = require('minimatch');
var finder = require('find-package-json')();
var packageJson = finder.next().value;
var projectName = 'prevent-forbidden-code';
var defaultForbid = [
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
var configExists = (packageJson && packageJson.config && packageJson.config[projectName]);
var forbidIsValid = configExists && packageJson.config[projectName].forbid && Array.isArray(packageJson.config[projectName].forbid);
var exclusionIsValid = configExists && Array.isArray(packageJson.config[projectName].exclude);
var forbiddenCode = forbidIsValid ? packageJson.config[projectName].forbid : defaultForbid;
var exclusions = exclusionIsValid ? packageJson.config[projectName].exclude : [];
var errorFound = false;

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
    var fileExists = true;

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
    var initialFiles = diff.trim().split('\n');
    var files = [];

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
        var fileContents = fs.readFileSync(file, 'utf-8');

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
        console.log('[ >>> PRE-COMMIT FORBIDDEN CODE CHECK COMPvarE ]'.green);
        /* eslint-enable */
        process.exit(0);
    }
});
