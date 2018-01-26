#!/bin/bash

export CLI4IOC_USER="I4X4KG67OBET5TS5"
export CLI4IOC_PASS="HD6L5K4JEOM2PZNE"
EXEC=./cli4ioc

RED='\033[0;32m'
NC='\033[0m'

$EXEC --getaddress eth.xhy |
    while IFS= read -r line
    do
        echo -e "${RED}NEW USER"
        echo -e "${NC}Normal color???"
        if [[ "$line" = *"address"* ]]; then
            ADDRESS="${line//Asset\ ETH.XHY\ address\ is:\ /}"
        fi;
    done
