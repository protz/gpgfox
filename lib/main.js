/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

let gpg = require("./gpg");
let context = require("context-menu");
let tabs = require("tabs");
let self = require("self");
let panel = require("panel");

function GpgFoxUi() {
}

GpgFoxUi.prototype = {
  setupContextMenu: function () {
    // The whole decryption logic. It is somewhat simpler than the encryption
    // logic as we don't need to show a panel in-between and the "gpg" module
    // takes care of prompting the user for a passphrase.
    context.Item({
      label: "Decrypt text here",
      context: context.PageContext(),
      contentScriptFile: self.data.url("page-decrypt-context-menu.js"),
      onMessage: function ({ className, text: [head, pgpBlock, tail] }) {
        // So, the user requested that we decrypt the text it found in the node
        // with class {className}; {head} is the text before the PGP block,
        // {tail} is the text that comes after it, and {pgpBlock} is the entire
        // PGP block.
        let tab = tabs.activeTab;
        console.log("Decryption requested", className);

        // The "gpg" module takes care of everything for us.
        gpg.decrypt({
          text: pgpBlock
        }, function (pgpBlock) {
          console.log("Decryption performed", className);

          // And now we attach a worker to replace the DOM node with the
          // decrypted text.
          let worker = tab.attach({
            contentScriptFile: self.data.url("page-decrypt.js"),
            onMessage: function(aMessage) {
              // As usual, the worker is a nice guy and will tell us when we can
              // destroy it.
              if (aMessage == "seppuku") {
                console.log("Worker destroyed");
                worker.destroy();
              }
            },
          });
          worker.postMessage({ className: className, text: [head, pgpBlock, tail] });
        });
      },
    });

    // The whole encryption logic.
    context.Item({
      label: "Encrypt text field",
      context: context.SelectorContext("textarea"),
      contentScriptFile: self.data.url("page-encrypt-context-menu.js"),
      onMessage: function ({ className, text }) {
        // We assume the active tab is the one from which the right click
        // originates, so we save it.
        let tab = tabs.activeTab;
        console.log("Encryption requested", className);

        // We need to display a panel so that the user can pick the recipient.
        let thePanel = panel.Panel({
          contentURL: self.data.url("panel-recipient.html"),
          contentScriptFile: self.data.url("panel-recipient.js"),
          height: 60,
        });

        // Once the panel notifies us with a recipient, we can launch the
        // encryption.
        thePanel.port.on("ok", function({ recipient }) {
          console.log("User asked to encrypt for", recipient);
          gpg.encrypt({
            text: text,
            recipient: recipient
          }, function (text) {
            // Once we get the results of the encryption, we attach a worker to
            // the content page; the worker will take care of modifying the DOM
            // to replace the put the encrypted text in the right place.
            console.log("Encryption performed", className);
            thePanel.destroy();
            let worker = tab.attach({
              contentScriptFile: self.data.url("page-encrypt.js"),
              onMessage: function(aMessage) {
                // We try to destroy the worker as soon as possible.
                if (aMessage == "seppuku") {
                  console.log("Worker destroyed");
                  worker.destroy();
                }
              },
            });
            // Let's give the worker the data it needs.
            worker.postMessage({ className: className, text: text });
          });
        });

        thePanel.show();
      },
    });
  },

  setup: function () {
    this.setupContextMenu();
  },
};

(new GpgFoxUi()).setup();
