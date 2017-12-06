#!/bin/sh
OLDPATH=$PATH
WHEREAMI=`pwd`
export PATH=$WHEREAMI/node/bin:"$PATH"
NODEINST=`which node`
BROWSERIFY=../hybridd/node_modules/browserify/bin/cmd.js
MINIFY=../hybridd/node_modules/minifier/index.js
UGLIFY=../hybridd/node_modules/uglify-es/bin/uglifyjs
CSSMIN=../hybridd/node_modules/cssmin/bin/cssmin

OUTPATH=../cli4ioc-public

echo "Creating cli4ioc release..."
echo ""

mkdir $OUTPATH
cp cli4ioc $OUTPATH/

mkdir -p $OUTPATH/lib/crypto
$UGLIFY lib/crypto/decimal-light.js > $OUTPATH/lib/crypto/decimal-light.js
$UGLIFY lib/crypto/hex2base32.js > $OUTPATH/lib/crypto/hex2base32.js
$UGLIFY lib/crypto/hex2dec.js > $OUTPATH/lib/crypto/hex2dec.js
$UGLIFY lib/crypto/lz-string.js > $OUTPATH/lib/crypto/lz-string.js
$UGLIFY lib/crypto/nacl.js > $OUTPATH/lib/crypto/nacl.js
$UGLIFY lib/crypto/sjcl.js > $OUTPATH/lib/crypto/sjcl.js
$UGLIFY lib/crypto/urlbase64.js > $OUTPATH/lib/crypto/urlbase64.js
$UGLIFY lib/crypto/sha256.js > $OUTPATH/lib/crypto/sha256.js

$UGLIFY lib/buttons.js > $OUTPATH/lib/buttons.js
$UGLIFY lib/globals.js > $OUTPATH/lib/globals.js
$UGLIFY lib/hybriddcall.js > $OUTPATH/lib/hybriddcall.js
$UGLIFY lib/login.js > $OUTPATH/lib/login.js
$UGLIFY lib/main.js > $OUTPATH/lib/main.js
$UGLIFY lib/modal.js > $OUTPATH/lib/modal.js
$UGLIFY lib/storage.js > $OUTPATH/lib/storage.js
$UGLIFY lib/transaction.js > $OUTPATH/lib/transaction.js

mkdir -p $OUTPATH/lib/views
$UGLIFY lib/views/interface.js > $OUTPATH/lib/views/interface.js
$UGLIFY lib/views/assets.js > $OUTPATH/lib/views/assets.js
$UGLIFY lib/views/assets.ui.js > $OUTPATH/lib/views/assets.ui.js

mkdir -p $OUTPATH/storage

echo "Release created in ../cli4ioc-public"
