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
let { Cc, Ci } = require("chrome");
let timers = require("timers");

let cachedPassphrase = null;

function getPassphrase() {
  if (cachedPassphrase != null) {
    return cachedPassphrase;
  } else {
    let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Ci.nsIPromptService);
    let check = { value: false };
    let password = { value: "" };
    let result = promptService.promptPassword(
      null, "GPGFox", "Please enter your passphrase",
      password, "Remember passphrase for 5 minutes", check
    );
    if (result) {
      if (check.value) {
        cachedPassphrase = password.value;
        timers.setTimeout(function () cachedPassphrase = null, 300*1000);
      }
      return password.value;
    } else {
      return null;
    }
  }
}

function callGpg(opts, k) {
  let output = [];
  let defaults = {
    command:     '/usr/bin/gpg',
    arguments:   [ ],
    environment: [ ],
    charset: 'UTF-8',
    workdir: '/tmp',
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

function encrypt(aData, k) {
  let output = [];
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
    callGpg({
      arguments: [
        '--decrypt',
        '--passphrase', passphrase
      ],
      stdin: aData,
    }, k);
  }
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;
