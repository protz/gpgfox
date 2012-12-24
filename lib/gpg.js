/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Thunderbird Conversations
 *
 * The Initial Developer of the Original Code is
 *  Jonathan Protzenko <jonathan.protzenko@gmail.com>
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

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


function encrypt(aData, k) {
  callGpg({
    arguments: [
      '--encrypt',
      '--armor',
      '-r', 'jonathan.protzenko@free.fr',
    ],
    stdin: aData,
  }, k);
}


function decrypt(aData, k) {
  let passphrase = getPassphrase();
  if (passphrase == null) {
    console.log("User aborted");
  } else {
    let path = getTmpFileName();
    let stream = file.open(path, "w");
    stream.writeAsync(aData, function () {
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
