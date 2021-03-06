/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setText(aNode, aValue) {
  switch (aNode.tagName) {
    case "TEXTAREA":
      aNode.value = aValue;
      break;

    case "BODY":
      while (aNode.firstChild)
        aNode.removeChild(aNode.firstChild);
      let pre = aNode.ownerDocument.createElement("pre");
      aNode.appendChild(pre);
      pre.textContent = aValue;
      break;

    default:
      aNode.textContent = aValue;
      aNode.style.display = "block";
      aNode.style.whiteSpace = "pre";
      break;
  }
}

self.on("message", function ({ className, text }) {
  let items = document.getElementsByClassName(className);

  if (!items.length) {
    let iframes = document.getElementsByTagName("iframe");
    for (let iframe of iframes) {
      try {
        let body = iframe.contentDocument.body;
        if (body.parentNode.classList.contains(className)) {
          items = [body];
          break;
        }
      } catch (e) {
        // Not the same origin...
      }
    }
  }

  if (items.length != 1) {
    console.log("Not just one item found:", items.length);
    return;
  }

  setText(items[0], text);
  console.log("Encrypted text inserted");

  // Tell the add-on script to kill us, we're not needed anymore
  self.postMessage("seppuku");
}); 
