/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function findPgpBlock(aNode) {
  /* This routine is stolen from Patrick's plugin for Conversations, there's a
   * lot of knowledge in there, so hopefully it should help us out a lot! */
  let head = "";
  let tail = "";
  let msgText = aNode.textContent;
  if (!msgText)
    return null;

  let startOffset = msgText.indexOf("-----BEGIN PGP");
  if (startOffset < 0) {
    if (aNode.tagName && aNode.tagName == "body")
      return null;
    else
      return findPgpBlock(aNode.parentNode);
  }

  let indentMatches = msgText.match(/\n(.*)-----BEGIN PGP/);
  let indent = "";
  if (indentMatches && (indentMatches.length > 1)) {
    indent = indentMatches[1];
  }
  head = msgText.substring(0, startOffset).replace(/^[\n\r\s]*/,"");
  head = head.replace(/[\n\r\s]*$/,"");
  let endStart = msgText.indexOf("\n"+indent+"-----END PGP") + 1;
  let nextLine = msgText.substring(endStart).search(/[\n\r]/);
  if (nextLine > 0) {
    tail = msgText.substring(endStart+nextLine).replace(/^[\n\r\s]*/,"");
  }

  let pgpBlock = msgText.substring(startOffset - indent.length,
                                   endStart + nextLine);
  if (nextLine == 0) {
    pgpBlock += msgText.substring(endStart);
  }
  if (indent) {
    pgpBlock = pgpBlock.replace(new RegExp("^"+indent+"?", "gm"), "");
  }
  return [aNode, head, pgpBlock, tail];
}

self.on("click", function (node, data) {
  console.log("Menu item clicked");

  let r = findPgpBlock(node);
  if (r) {
    let [node, head, pgpBlock, tail] = r;

    let className = "gpgfox-"+Math.round(Math.random()*1000);
    node.classList.add(className);

    console.log("Requesting decryption");
    self.postMessage({
      className: className,
      text: [head, pgpBlock, tail],
    });
  } else {
    console.log("Couldn't find any GPG data here...");
  }
});
