#!/bin/sh
OLDPATH=$PATH
WHEREAMI=`pwd`
NODEINST=`which node`

# $HYBRIXD/interface/scripts/npm  => $HYBRIXD
SCRIPTDIR="`dirname \"$0\"`"
HYBRIXD="`cd \"$SCRIPTDIR/../../..\" && pwd`"

INTERFACE="$HYBRIXD/interface"
NODE="$HYBRIXD/node"
DETERMINISTIC="$HYBRIXD/deterministic"
NODEJS="$HYBRIXD/nodejs"
COMMON="$HYBRIXD/common"
WEB_WALLET="$HYBRIXD/web-wallet"

GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"


if [ -e "$COMMON/scripts/diag/diag.sh" ];then

    sh "$COMMON/scripts/diag/diag.sh"

else

    echo "$RED [!] common not found.$RESET"

fi



export PATH="$OLDPATH"
cd "$WHEREAMI"
