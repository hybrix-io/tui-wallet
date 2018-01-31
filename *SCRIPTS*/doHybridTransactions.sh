#!/bin/bash
EXEC=././cli4ioc
INPUT=test.csv

OWNUSERID=H7L4YVCQURRLTN4B
OWNPASS=BYKVA2EENK7SEDSOKLOLPKAWSLHWJ6CTYH7225FHESTUIATO

INDEX=1
COLUMNOFFSET=3
ASSETNAMES=( "eth.xhy" "nxt.xhy")
ASSETNAMESLENGTH=${#ASSETNAMES[@]}

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}[.] Starting Hybridd transaction transfers.${NC}"

OLDIFS=$IFS
IFS=,
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

while read line
do
    for i in "${!ASSETNAMES[@]}"; do
        COLUMNOFFSET=4
        ADDRESSCOLUMN=$(($COLUMNOFFSET + $i))
        TOTALAMOUNT=$(awk -v userIndex="$INDEX" '(NR == userIndex) {print $3}' $INPUT)
        AMOUNT=$(( $TOTALAMOUNT / $ASSETNAMESLENGTH ))
        ADDRESS=$(awk -v col="$ADDRESSCOLUMN" -v userIndex="$INDEX" '(NR == userIndex) {print $col}' $INPUT)

        echo "[.] Processing transaction of $AMOUNT ${ASSETNAMES[$i]} to $ADDRESS."
        $EXEC -u $OWNUSERID -p $OWNPASS --sendtransaction $ASSETNAMES[$i] $AMOUNT $ADDRESS; # DO ACTUAL TRANSACTION
    done < $INPUT

    (( INDEX++ ))

done < $INPUT

echo '[.] All done.'
IFS=$OLDIFS
