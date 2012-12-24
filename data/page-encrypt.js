/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

self.on("message", function ({ className, text }) {
  let textareas = document.getElementsByClassName(className);
  if (!textareas.length) {
    console.log("Item not found", className);
  } else {
    let textarea = textareas[0];
    textarea.value = text;
    console.log("Encrypted text inserted");
  }

  // Tell the add-on script to kill us, we're not needed anymore
  self.postMessage("seppuku");
}); 
