GPGFox
======

This Firefox addon provides a thin layer over GPG, therefore allowing you to
perform encryption and decryption in your browser.

This is somehow a revival of the late FireGPG, but it doesn't use any binary
components to make forward compatibility easier. Similarly, it won't
automatically perform encryption or decryption, so as not to break with every
Gmail update.

Usage
-----

This addon works with inline-PGP, that is, encrypted blocks in plain-text which
start with `-----BEGIN PGP` and end up with `END PGP-----`.

This addon adds two entries in the context menu (right-click):

* `decrypt text here`, which will decrypt a PGP block under the cursor;
* `encrypt text here`, which will encrypt the contents of a composition-like
  area under the cursor; for instance, composition areas of most webmails work
  (tested with Gmail, Yahoo, Zimbra).

The default path to the GPG utility is `/usr/bin/gpg`. You can pick a different
one in the addon's options, should you need to.

Download
--------

This is the development website. Head over to
[AMO](https://addons.mozilla.org/en-US/firefox/addon/gpgfox/) in order to install
the addon.

Hacking
-------

This addon is built using the
[AddonSDK](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/).
Use `cfx xpi` to build a ready-to-install xpi, and use `cfx run` to run a fresh
instance of Firefox with the addon installed.
