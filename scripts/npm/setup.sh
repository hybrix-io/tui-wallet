#!/bin/sh

WHEREAMI=`pwd`
OLDPATH=$PATH

# $HYBRIXD/$NODE/scripts/npm  => $HYBRIXD
SCRIPTDIR="`dirname \"$0\"`"
HYBRIXD="`cd \"$SCRIPTDIR/../../..\" && pwd`"

NODE="$HYBRIXD/node"
DETERMINISTIC="$HYBRIXD/deterministic"
NODEJS="$HYBRIXD/nodejs"
COMMON="$HYBRIXD/common"
INTERFACE="$HYBRIXD/interface"
TUI_WALLET="$HYBRIXD/tui-wallet"

if [ "`uname`" = "Darwin" ]; then
    SYSTEM="darwin-x64"
elif [ "`uname -m`" = "i386" ] || [ "`uname -m`" = "i686" ]; then
    SYSTEM="x86"
elif [ "`uname -m`" = "x86_64" ]; then
    SYSTEM="x86_64"
else
    echo "[!] Unknown Architecture (or incomplete implementation)"
    exit 1;
fi

# NODE
if [ ! -e "$TUI_WALLET/node_binaries" ];then

    echo " [!] tui_wallet/node_binaries not found."

    if [ ! -e "$NODEJS" ];then
        cd "$HYBRIXD"
        echo " [i] Clone node js runtimes files"
        git clone https://www.gitlab.com/hybrix/hybrixd/dependencies/nodejs.git
    fi
    echo " [i] Link NODEJS files"
    ln -sf "$NODEJS/$SYSTEM" "$TUI_WALLET/node_binaries"
fi
export PATH="$NODE/node_binaries/bin:$PATH"

# COMMON
if [ ! -e "$TUI_WALLET/common" ];then

    echo " [!] tui_wallet/common not found."

    if [ ! -e "$COMMON" ];then
        cd "$HYBRIXD"
        echo " [i] Clone common files"
        git clone https://www.gitlab.com/hybrix/hybrixd/common.git
    fi
    echo " [i] Link common files"
    ln -sf "$COMMON" "$TUI_WALLET/common"

fi

# INTERFACE
if [ ! -e "$TUI_WALLET/interface" ];then

    echo " [!] tui_wallet/interface not found."

    if [ ! -e "$INTERFACE" ];then
        cd "$HYBRIXD"
        echo " [i] Clone interface files"
        git clone https://www.gitlab.com/hybrix/hybrixd/interface.git
    fi
    echo " [i] Link interface files"
    ln -sf "$INTERFACE/dist" "$TUI_WALLET/interface"
fi

# GIT HOOKS
sh "$COMMON/hooks/hooks.sh" "$TUI_WALLET"

cd "$WHEREAMI"
export PATH="$OLDPATH"
