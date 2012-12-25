/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

let { subprocess } = require("./ipccode/subprocess");
let { Cc, Ci, Cu } = require("chrome");
let timers = require("timers");
let file = require("file");
let simplePrefs = require("simple-prefs");

let { FileUtils } = Cu.import("resource://gre/modules/FileUtils.jsm");

let idleService = Cc["@mozilla.org/widget/idleservice;1"]
                  .getService(Ci.nsIIdleService);
let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                    .getService(Ci.nsIPromptService);

// Remember the passphrase...
let cachedPassphrase = null;

// ... and clear it out after five idle minutes.
timers.setInterval(function () {
  if (idleService.idleTime > 5*60*1000)
    cachedPassphrase = null;
}, 5000);


/**
 * This is the function that takes care of prompting the user for a passphrase,
 * and remembering it if needed.
 * @returns {String} the passphrase, if any, or {null} if the user canceled the
 *  action.
 */
function getPassphrase() {
  if (cachedPassphrase != null) {
    return cachedPassphrase;
  } else {
    let check = { value: false };
    let password = { value: "" };
    let result = promptService.promptPassword(
      null, "GPGFox", "Please enter your passphrase",
      password, "Remember passphrase for 5 idle minutes", check
    );
    if (result) {
      if (check.value)
        cachedPassphrase = password.value;
      return password.value;
    } else {
      return null;
    }
  }
}


/**
 * This is a wrapper for calling the gpg utility with a set of default options.
 * @param {opts} an object whose keys are those accepted by {subprocess.call}.
 * @param {k} the continuation; it will receive a string which is the output of
 *  gpg.
 * @returns the result of {subprocess.call}
 */
function callGpg(opts, k) {
  let output = [];
  let defaults = {
    command:     simplePrefs.prefs.gpgPath,
    arguments:   [ ],
    environment: [ ],
    charset: 'UTF-8',
    //workdir: '/tmp',
    stdin: function(stdin) {
    },
    stdout: function(data) {
      output.push(data);
      console.log("Received output from GPG", data);
    },
    stderr: function(data) {
      console.log("Error from GPG", data);
    },
    done: function(result) {
      console.log("GPG terminated with", result.exitCode);
      console.log("GPG output", output.join(""));
      k(output.join(""));
    },
    mergeStderr: false
  };
  for (let k in opts)
    defaults[k] = opts[k];
  return subprocess.call(defaults);
}


/**
 * Generates a safe, unique file name. I didn't find any API in the SDK to do
 * that, but fortunately, {FileUtils} is here for us.
 * @returns {String} the path to a temporary file name
 */
function getTmpFileName() {
  let file = FileUtils.getFile("TmpD", ["gpgfox.tmp"]);
  file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
  return file.path;
}


function encrypt({ recipient, text }, k) {
  callGpg({
    arguments: [
      '--encrypt',
      '--armor',
      '--trust-model', 'always',
      '-r', recipient,
    ],
    stdin: text,
  }, k);
}


function decrypt({ text }, k) {
  let passphrase = getPassphrase();
  if (passphrase == null) {
    console.log("User aborted");
  } else {
    let path = getTmpFileName();
    let stream = file.open(path, "w");
    stream.writeAsync(text, function () {
      // The docs say that {writeAsync} will close the stream for us.
      callGpg({
        arguments: [
          '--decrypt',
          '--passphrase-fd=0',
          path
        ],
        stdin: passphrase,
      }, k);
    });
  }
}


exports.encrypt = encrypt;
exports.decrypt = decrypt;
