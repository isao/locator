/*
 * Copyright 2013 Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

'use strict';

var path = require('path'),
    DEFAULT_RULES_NAME = 'main',
    DEFAULT_RULES_PATH = './rulesets';


function pickRules(rulesObj, rulesname) {
    var rules;
    if (rulesObj[rulesname]) {
        rules = rulesObj[rulesname];
        rules._name = rulesname;
    }
    return rules;
}

/**
 * wrap `require` in a try/catch with some debug logging
 * @param {string} str require pathname
 * @return {object|undefined} module returned by `require`, or undefined
 */
function tryRequire(str) {
    var mod;
    try {
        mod = require(str);
    } catch(err) {
        if (!(('MODULE_NOT_FOUND' === err.code) && err.message.indexOf(str))) {
            throw err; // module was loaded and threw an exception, re-throw.
        }
    }
    return mod;
}

/**
 * create an array of strings of possible ruleset paths
 *
 * @example getPossibilities('/APP/a/b/c/d/BDL', '/app', 'foo.js') will return:
 * [ '/APP/a/b/c/d/BDL/foo.js',
 *   '/APP/a/b/c/d/BDL/node_modules/foo.js',
 *   '/APP/a/b/c/d/node_modules/foo.js',
 *   '/APP/a/b/c/node_modules/foo.js',
 *   '/APP/a/b/node_modules/foo.js',
 *   '/APP/a/node_modules/foo.js',
 *   '/APP/node_modules/foo.js' ]
 * @param {string} dir Bundle directory path
 * @param {string} rootdir Application directory path
 * @param {string} rulespath Subpath or filename of the ruleset
 * @return {array} array of strings of possible ruleset paths
 */
function getPossibilities(dir, rootdir, rulespath) {
    var dirs = [];

    if (rulespath) {
        dirs.push(path.resolve(dir, rulespath)); // in cwd?

        do { // in node_modules or any parent dir's node_modules?
            dirs.push(path.resolve(dir, 'node_modules', rulespath));
            dir = path.dirname(dir);
        } while(dir.length >= rootdir.length);

    } else {
        dirs.push(DEFAULT_RULES_PATH);
    }

    return dirs;
}

/**
 * Loads the rulesets for the bundle (or seed).
 * @module Locator
 * @private
 * @method loadRuleset
 * @param {Bundle|object} bundle The bundle (or bundle seed, see _makeBundleSeed())
 * to load the ruleset for.
 * @return {object} The ruleset, or undefined if we couldn't load it.
 */
function loadRuleset(bundle, rootdir, pathCache) {
    var bundledir = bundle.baseDirectory,
        rulesname = (bundle.options && bundle.options.ruleset) || DEFAULT_RULES_NAME,
        rulespath = bundle.options && bundle.options.rulesets,
        paths = getPossibilities(bundledir, rootdir, rulespath),
        rulesObj;

    if (pathCache[bundledir]) {
        paths.unshift(pathCache[bundledir]);
    }

    paths.some(function tryLoad(pathname) {
        rulesObj = tryRequire(pathname);
        return rulesObj;
    });

    return pickRules(rulesObj, rulesname);
}

module.exports = loadRuleset;
