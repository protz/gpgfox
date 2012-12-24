/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

self.on("message", function ({ className, text: [head, pgpBlock, tail] }) {
  let items = document.getElementsByClassName(className);
  if (!items.length) {
    console.log("Item not found", className);
  } else {
    let item = items[0];
    if (head && head.length);
      item.textContent = head+"\n";
    item.textContent += pgpBlock;
    if (tail && tail.length);
      item.textContent += "\n"+tail;
    item.style.display = "block";
    item.style.whiteSpace = "pre";
    console.log("Decrypted text inserted");
  }

  // Tell the add-on script to kill us, we're not needed anymore
  self.postMessage("seppuku");
}); 
