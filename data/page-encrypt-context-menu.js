/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function findEditable(aNode) {
  console.log("findEditable", aNode.tagName);
  if (aNode.tagName == "TEXTAREA")
    return aNode;
  // These two find the outermost node with the isContentEditable property
  else if (aNode.isContentEditable && aNode.parentNode && aNode.parentNode.isContentEditable)
    return findEditable(aNode.parentNode);
  else if (aNode.isContentEditable)
    return aNode;
  // This will return the HTML node
  else if (aNode.parentNode && aNode.parentNode.designMode == "on")
    return aNode;
  // This walks up the DOM
  else if (aNode.parentNode)
    return findEditable(aNode.parentNode);
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
