#!/bin/bash
EXEC=./testwallet.sh
INPUT=test.csv
OUTPUT=new_wallet_users_succes.csv
FAILED=new_wallet_users_failed.csv
OLDIFS=$IFS
IFS=,
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

ASSETNAMES=( "eth.xhy" "nxt.xhy")
INDEX=1

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

[ -e "$OUTPUT" ] && rm "$OUTPUT" # REMOVE OLD OUTPUT FILE

while read
do
    echo -e "${GREEN}[.] Creating new user account."
    echo -e "${NC}"
    $EXEC --newaccount |
        while read -r line
        do
            # CREATE ACCOUNT
            [[ "$line" = *"userID"* ]] && USERID="${line//Your\ userID\ /}";
            [[ "$line" = *"pass"* ]] && PASS="${line//Your\ pass\ /}";

            if [[ "$PASS" != "" ]]; then
                # ADD ASSETS TO WALLET
                for asset in "${ASSETNAMES[@]}"
                do
                    echo "Adding $asset to wallet."
                    $EXEC -u $USERID -p $PASS --addasset $asset
                done

                # APPEND CREDENTIALS TO OUTPUT FILE
                awk -v userID="$USERID" -v pass="$PASS" -v pattern="$INDEX" '(NR == pattern) {print $0, userID, pass}' $INPUT >> $OUTPUT; # APPEND USER CREDENTIALS TO OUTPUT FILE.
            fi
        done
    (( INDEX++ ))
done < $INPUT

# COMPARE OUTPUT WITH INPUT AND MOVE MISSING USERS TO FAILED FILE
awk -v name='$name' '{if ($4 == "") print $0}' $OUTPUT >> $FAILED; # APPEND USER TO FAILED OUTPUT FILE

echo '[.] All done.'
IFS=$OLDIFS
