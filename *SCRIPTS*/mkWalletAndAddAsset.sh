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
        while IFS= read -r line
        do
            # CREATE ACCOUNT
            [[ "$line" = *"userID"* ]] && USERID="${line//Your\ userID\ /}";
            [[ "$line" = *"pass"* ]] && PASS="${line//Your\ pass\ /}";

            if [[ "$PASS" != "" ]]; then
                awk -v userID="$USERID" -v pass="$PASS" -v pattern="$INDEX" '(NR == pattern) {print $0, userID, pass}' $INPUT >> $OUTPUT # APPEND USER CREDENTIALS TO OUTPUT FILE.
                # CALL FN TO ADD ASSETS TO WALLET AND APPEND ASSETS ADDRESSES TO FILE.
                # ./addAssets.sh "$USERID" "$PASS" "$INDEX" $OUTPUT $ASSETNAMES
            fi;
        done
    (( INDEX++ ))
done < $INPUT

awk '{if ($4 != "") print $0}' $INPUT > $FAILED; # APPEND USER TO FAILED OUTPUT FILE

echo '[.] All done.'
IFS=$OLDIFS
