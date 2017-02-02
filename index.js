#!/usr/bin/env node

'use strict';

var git = require('simple-git')(process.cwd()),
    colors = require('colors'),
    fs = require('fs'),
    minimatch = require('minimatch'),
    finder = require('find-package-json')(),
    packageJson = finder.next().value,
    projectName = 'prevent-forbidden-code',
    defaultForbid = [
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
    ],
    configExists = (packageJson && packageJson.config && packageJson.config[projectName]),
    forbidIsValid = configExists && packageJson.config[projectName].forbid && Array.isArray(packageJson.config[projectName].forbid),
    exclusionIsValid = configExists && Array.isArray(packageJson.config[projectName].exclude),
    forbiddenCode = forbidIsValid ? packageJson.config[projectName].forbid : defaultForbid,
    exclusions = exclusionIsValid ? packageJson.config[projectName].exclude : [],
    errorFound = false;

function checkFile(fileName, contents) {
    forbiddenCode.forEach(function(forbiddenItem) {
        if (contents.indexOf(forbiddenItem) > -1) {
            console.log('FAILURE: '.red + 'You left a '.reset + forbiddenItem.yellow + ' in '.reset + fileName.cyan);
            errorFound = true
        }
    });
}

function checkExcluded(fileName) {
    return exclusions.some(function(exclusion) {
        return minimatch(fileName, exclusion);
    });
}

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
    var initialFiles = diff.trim().split('\n'),
        files = [];

    console.log('[ >>> BEGIN PRE-COMMIT FORBIDDEN CODE CHECK ]'.green);

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
        console.log('[ >>> COMMIT REJECTED ]'.red);
        console.log('If you absolutely need to commit this use git commit --no-verify (-n)'.red);
        process.exit(1);
    } else {
        console.log('[ >>> PRE-COMMIT FORBIDDEN CODE CHECK COMPLETE ]'.green);
        process.exit(0);
    }
});
