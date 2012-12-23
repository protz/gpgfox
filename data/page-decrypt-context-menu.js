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
      value: [head, pgpBlock, tail],
    });
  } else {
    console.log("Couldn't find any GPG data here...");
  }
});
