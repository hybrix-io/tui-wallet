#!/bin/bash

EXEC=./testwallet.sh

INPUT=test.csv
OUTPUT=output.csv
OLDIFS=$IFS
IFS=,
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

GREEN='\033[0;32m'
NC='\033[0m'
INDEX=1

# REMOVE OLD OUTPUT FILE
[ -e "$OUTPUT" ] && rm "$OUTPUT"

while read
do
    echo -e "${GREEN}[x] Creating new user account."
    $EXEC --newaccount |
        while IFS= read -r line
        do
            # CREATE ACCOUNT
            [[ "$line" = *"userID"* ]] && USERID="${line//Your\ userID\ /}";
            [[ "$line" = *"pass"* ]] && PASS="${line//Your\ pass\ /}";

            if [[ "$PASS" != "" ]]; then
                # SET ENV VARIABLES, LOGIN TO WALLET AND ADD ASSET
                echo -e "${NC}[x] Setting ENV with new user credentials."
                export CLI4IOC_USER="$USERID"
                export CLI4IOC_PASS="$PASS"

                # ADD ETH.XHY ASSET
                echo '[x] Adding ETH.XHY asset to wallet.'
                $EXEC --addasset eth.xhy
                echo '[x] Adding NXT.XHY asset to wallet.'
                $EXEC --addasset nxt.xhy

                # GET HYBRID ADDRESS
                echo '[x] Getting ETH.XHY address from wallet.'
                $EXEC --getaddress eth.xhy |
                    while IFS= read -r line2
                    do
                        if [[ "$line2" = *"address"* ]];
                        then
                            ADDRESS="${line2//Asset\ ETH.XHY\ address\ is:\ /}"

                            # APPEND DATA TO OUTPUT FILE
                            echo '[x] Appending user data to output file.'
                            awk -F "," -v pass="$PASS" -v userid="$USERID" -v pattern="$INDEX" -v address="$ADDRESS" 'BEGIN { OFS = ",";} (NR == pattern) {$4=userid; $5=pass; $6=address; print; exit}' $INPUT >> $OUTPUT;
                        fi;
                    done
            fi;
        done
    (( INDEX++ ))
done < $INPUT
echo '[x] All done.'
IFS=$OLDIFS
