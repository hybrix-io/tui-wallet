#!/bin/bash
EXEC=./cli4ioc
INPUT=test.csv
OUTPUT=output.csv
OLDIFS=$IFS
IFS=,
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

ASSETNAMES=( "eth.xhy" "nxt.xhy")
INDEX=1

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# REMOVE OLD OUTPUT FILE
[ -e "$OUTPUT" ] && rm "$OUTPUT"

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
                awk -v userID="$USERID" -v pass="$PASS" -v pattern="$INDEX" '(NR == pattern) {print $0, userID, pass}' $INPUT > $OUTPUT
                # CALL FN TO ADD ASSETS TO WALLET
                ./addAssets.sh "$USERID" "$PASS" "$INDEX" $OUTPUT $ASSETNAMES
            else
                echo -e "${RED}[.] Could not create wallet for user no. $INDEX"
                echo -e "${NC}"
                awk -v pattern="$INDEX" '(NR == pattern) {print $0}' $INPUT >> failed.csv
            fi;
        done
    (( INDEX++ ))
done < $INPUT
echo '[x] All done.'
IFS=$OLDIFS
