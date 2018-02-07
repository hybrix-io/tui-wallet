#!/bin/bash
EXEC=./testwallet.sh
INPUT=credentials.tmp

OWNUSERID=H7L4YVCQURRLTN4B
OWNPASS=BYKVA2EENK7SEDSOKLOLPKAWSLHWJ6CTYH7225FHESTUIATO

INDEX=1
COLUMNOFFSET=3
ASSETNAMES=( "eth.xhy" "nxt.xhy")
ASSETNAMESLENGTH=${#ASSETNAMES[@]}

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# rm failed_transaction.csv
cp $INPUT temp_users_with_credentials.csv

echo -e "${GREEN}[.] Starting Hybridd transaction transfers.${NC}"

# OLDIFS=$IFS
# IFS=,
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

while read line
do
    for i in "${!ASSETNAMES[@]}"; do
        COLUMNOFFSET=6
        ADDRESSCOLUMN=$(($COLUMNOFFSET + $i))
        TOTALAMOUNT=$(awk -v userIndex="$INDEX" '(NR == userIndex) {print $3}' $INPUT)
        AMOUNT=$(( $TOTALAMOUNT / $ASSETNAMESLENGTH ))
        ADDRESS=$(awk -v col="$ADDRESSCOLUMN" -v userIndex="$INDEX" '(NR == userIndex) {print $col}' $INPUT)

        if [[ $ADDRESS != *"xxxx"* ]]
        then
           echo "[.] Processing transaction of $AMOUNT ${ASSETNAMES[$i]} to $ADDRESS."
           $EXEC -u $OWNUSERID -p $OWNPASS --sendtransaction ${ASSETNAMES[$i]} $AMOUNT $ADDRESS >> tmp.bak # DO ACTUAL TRANSACTION

           if grep -a "Transaction failed" "tmp.bak" || $? != 0 || grep -a "1" "tmp.bak"
           then
               echo "Transaction of $AMOUNT ${ASSETNAMES[$i]} failed."
               echo $line $AMOUNT ${ASSETNAMES[$i]} >> failed_transaction.csv
           else
               echo "Transaction of $AMOUNT ${ASSETNAMES[$i]} succesful."
               awk -v userIndex="$INDEX" -v columnNumber="$ADDRESSCOLUMN" '(NR == userIndex) {$columnNumber="xxxx"; print}' temp_users_with_credentials.csv >> file.tmp && mv file.tmp temp_users_with_credentials.csv
           fi
           rm tmp.bak
        else
            echo "Address was xxxx"
        fi

        rm exitStatus.txt

    done

    (( INDEX++ ))
done < $INPUT

echo '[.] All done.'
IFS=$OLDIFS
