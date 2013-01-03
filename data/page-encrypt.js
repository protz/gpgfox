/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setText([aNode, aDocument], aValue) {
  switch (aNode.tagName) {
    case "TEXTAREA":
      aNode.value = aValue;
      break;

    case "BODY":
      while (aNode.firstChild)
        aNode.removeChild(aNode.firstChild);
      let pre = aDocument.createElement("pre");
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
  // {items} is a list of pairs, the left element of the pair is the node, and
  // the right element of the pair is corresponding document
  let items = [[x, null] for (x of document.getElementsByClassName(className))];

  if (!items.length) {
    let iframes = document.getElementsByTagName("iframe");
    for (let iframe of iframes) {
      let body = iframe.contentDocument.body;
      if (body.parentNode.classList.contains(className)) {
        items = [[body, iframe.contentDocument]];
        break;
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
