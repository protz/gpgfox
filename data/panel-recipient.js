/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.getElementById("ok").addEventListener("click", function () {
  let recipientNode = document.getElementById("recipient");
  self.port.emit("ok", {
    recipient: recipientNode.value,
  });
}, false);
