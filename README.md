GPGFox
======

Lightweight revival of the late FireGPG, using no binary components to ensure
forward compatibility.

Usage
-----

This addon works with inline-PGP, that is, encrypted blocks in plain-text which
start with `-----BEGIN PGP` and end up with `END PGP-----`.

This addon adds two entries in the context menu (right-click):

* `decrypt text here`, which will decrypt a PGP block under the cursor;
* `encrypt text field`, which will encrypt the contents of (for the moment) a
  text area.

The default path to the GPG utility is `/usr/bin/gpg`. You can pick a different
one in the addon's options, should you need to.
