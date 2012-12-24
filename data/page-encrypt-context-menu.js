/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

self.on("click", function (node, data) {
  console.log("Menu item clicked");
  let className = "gpgfox-"+Math.round(Math.random()*1000);
  node.classList.add(className);
  console.log("Requesting encryption");
  self.postMessage({
    className: className,
    text: node.value,
  });
});
