#!/bin/bash

input=paymentScripts/logs/wallet/new_wallet_users_succes.csv
output=paymentScripts/logs/assets/users_with_credentials_succes.csv
failed=paymentScripts/logs/assets/users_with_credentials_failed.csv

source paymentScripts/config
assetNames=$ASSETNAMES
assetNamesLength=${#ASSETNAMES[@]}
exec=$EXEC

columnsInCSV=$(awk '{print NF}' $input | sort -nu | head -n 1)
totalRowNumber=$(($assetNamesLength + $columnsInCSV))


green='\033[0;32m'
red='\033[0;31m'
nc='\033[0m'

[ ! -f $input ] && { echo "$input file not found"; exit 99; }

ARRAY_USER=()
ARRAY_PASS=()

cp $input credentials.tmp
> $output
> $failed

while IFS=" " read -r name mail amount user pass
do
    ARRAY_USER+=("$user")
    ARRAY_PASS+=("$pass")
done < $input

for i in "${!ARRAY_USER[@]}"
do
    USER=${ARRAY_USER[$i]}
    PASS=${ARRAY_PASS[$i]}

    echo "Retrieving address for user $USER"

    for asset in "${ASSETNAMES[@]}" # GET ASSET ADDRESS AND WRITE TO TEMP FILE
    do
        echo "[.] Retrieving $asset address."
        $($exec -u "$USER" -p "$PASS" --getaddress $asset >> "$USER.bak")
    done
done

for user in "${ARRAY_USER[@]}"
do
    sed -n -e '/^Asset/p' "$user.bak" > file.tmp && mv file.tmp "$user.bak" # ONLY GET ASSET ADDRESS DATA IN TEMP FILE
    fileLength=$(awk 'END {print NR}' "$user.bak")

    if [ $fileLength = $assetNamesLength ] # CHECK LENGTH ASSETNAMES === ASSET ADDRESS
    then
        echo "[.] Copying assets addresses for user $user."
        cat "$user.bak" | while read line
        do
            assetAddr=$(echo $line | cut -d':' -f 2 | tr -d '[:space:]') # REMOVE WHITESPACES
            awk -v user="$user" -v assetAddress="$assetAddr" '{if ($4 == user) print $0, assetAddress; else print $0}' credentials.tmp > file.tmp && mv file.tmp credentials.tmp;
        done
    else
        echo -e "${red} Could not retrieve all addresses. Operation failed for user $user."
        echo -e "${nc}"
    fi

    # # CLEANUP
    rm "$user.bak"
done

cp credentials.tmp $output
awk -v rowNumber="$totalRowNumber" '{if ($rowNumber == "") print $0}' $output >> $failed # $8 should be amount of rows plus amount of assets
