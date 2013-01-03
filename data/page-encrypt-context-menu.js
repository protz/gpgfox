/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function findEditable(aNode) {
  if (aNode.tagName == "TEXTAREA")
    return aNode;
  else if (aNode.tagName == "IFRAME" &&
      node.contentDocument &&
      node.contentDocument.designMode == "on")
    return aNode;
  else if (aNode.contentEditable)
    return aNode;
  else if (aNode.parentNode)
    return findIframe(aNode.parentNode);
  else
    return null;
}

function getText(aNode) {
  switch (aNode.tagName) {
    case "TEXTAREA":
      return aNode.value;
    case "IFRAME":
      return aNode.contentDocument.body.textContent;
    default:
      return aNode.textContent;
  }
}

self.on("click", function (node, data) {
  console.log("Menu item clicked");

  let editableNode = findEditable(node);

  let className = "gpgfox-"+Math.round(Math.random()*1000);
  editableNode.classList.add(className);
  console.log("Requesting encryption");
  self.postMessage({
    className: className,
    text: getText(editableNode),
  });
});

self.on("context", function (node) {
  console.log("context", node.tagName, node.contentDocument,
    node.contentDocument && node.contentDocument.designMode);

  return (findEditable(node) != null);
 });
