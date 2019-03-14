#!/bin/sh
OLDPATH="$PATH"
WHEREAMI="`pwd`"
export PATH="$WHEREAMI/node_binaries/bin:$PATH"
NODEINST="`which node`"
UGLIFY=node_modules/uglify-es/bin/uglifyjs
CSSMIN=node_modules/cssmin/bin/cssmin

# $HYBRIXD/node/scripts/npm  => $HYBRIXD
SCRIPTDIR="`dirname \"$0\"`"
HYBRIXD="`cd \"$SCRIPTDIR/../../..\" && pwd`"

TUI_WALLET="$HYBRIXD/tui-wallet"
INTERFACE="$HYBRIXD/interface"
DIST="$TUI_WALLET/dist"

echo "[.] Creating tui-wallet release..."

# Create path if required, clean otherwise
mkdir -p "$DIST/storage"
mkdir -p "$DIST/common"

echo "[.] Cleaning target path"
rm -rfv "$DIST/*" >/dev/null

echo "[.] Processing files"
cd "$TUI_WALLET"

# Copy the main entrypoint
cp "$TUI_WALLET/tui-wallet" "$DIST/"
# Copy license
cp "$TUI_WALLET/LICENSE.md" "$DIST/"
# Copy readme
cp "$TUI_WALLET/README.md" "$DIST/"
# Copy package.json
cp "$TUI_WALLET/package.json" "$DIST/"

# Copy node_modules
cp -r "$TUI_WALLET/node_modules" "$DIST/"

# Copy the lib contents
cp -r "$TUI_WALLET/lib" "$DIST/"

# Copy the common directory
cp -r "$TUI_WALLET/common/crypto" "$DIST/common/"

# Copy the common directory
cp -r "$TUI_WALLET/common/node_modules" "$DIST/common/"

# Copy the common directory
cp $TUI_WALLET/common/*.js "$DIST/common/"
cp $TUI_WALLET/common/*.json "$DIST/common/"

# Copy the interface directory
cp -r "$TUI_WALLET/interface" "$DIST/"

# Copy the docs
cp -r "$TUI_WALLET/docs" "$DIST/docs/"

echo "[.] Release created in $DIST/"
echo "[.] Make sure you have proper node binaries."
export PATH="$OLDPATH"
cd "$WHEREAMI"
