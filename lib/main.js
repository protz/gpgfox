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

let gpg = require("./gpg");
let context = require("context-menu");
let tabs = require("tabs");
let self = require("self");

function GpgFoxUi() {
}

GpgFoxUi.prototype = {
  setupContextMenu: function () {
    // The "decrypt" menu item
    context.Item({
      label: "Decrypt text here",
      context: context.PageContext(),
      contentScriptFile: self.data.url("page-decrypt-context-menu.js"),
      onMessage: function ({ className, value }) {
        let [head, pgpBlock, tail] = value;
        // We assume the active tab is the one from which the right click
        // originates...
        let tab = tabs.activeTab;
        console.log("Decryption requested", className);
        gpg.decrypt(pgpBlock, function (pgpBlock) {
          console.log("Decryption performed", className);
          let worker = tab.attach({
            contentScriptFile: self.data.url("page-decrypt.js"),
            onMessage: function(aMessage) {
              if (aMessage == "seppuku") {
                console.log("Worker destroyed");
                worker.destroy();
              }
            },
          });
          worker.postMessage({ className: className, value: [head, pgpBlock, tail] });
        });
      },
    });

    // The "encrypt" menu item
    context.Item({
      label: "Encrypt text field",
      context: context.SelectorContext("textarea"),
      contentScriptFile: self.data.url("page-encrypt-context-menu.js"),
      onMessage: function ({ className, value }) {
        // We assume the active tab is the one from which the right click
        // originates...
        let tab = tabs.activeTab;
        console.log("Encryption requested", className);
        gpg.encrypt(value, function (value) {
          console.log("Encryption performed", className);
          let worker = tab.attach({
            contentScriptFile: self.data.url("page-encrypt.js"),
            onMessage: function(aMessage) {
              if (aMessage == "seppuku") {
                console.log("Worker destroyed");
                worker.destroy();
              }
            },
          });
          worker.postMessage({ className: className, value: value });
        });
      },
    });
  },

  setup: function () {
    this.setupContextMenu();
  },
};

(new GpgFoxUi()).setup();
