input=paymentScripts/logs/wallet/new_wallet_users_succes.csv
output=paymentScripts/logs/assets/users_with_credentials_succes.csv
failed=paymentScripts/logs/assets/users_with_credentials_failed.csv

source paymentScripts/config
assetNames=$ASSETNAMES
assetNamesLength=${#ASSETNAMES[@]}
exec=$EXEC

green='\033[0;32m'
red='\033[0;31m'
nc='\033[0m'

[ ! -f $input ] && { echo "$input file not found"; exit 99; }

cp $input credentials.tmp
> $output
> $failed

while IFS=" " read -r NAME mail amount USER PASS
do
    echo -e "${green}Getting addresses for user $USER ${nc}"

    for asset in "${ASSETNAMES[@]}" # GET ASSET ADDRESS AND WRITE TO TEMP FILE
    do
        echo "[.] Retrieving $asset address."
        $exec -u $USER -p $PASS --getaddress $asset >> tmp.bak
    done

    sed -n -e '/^Asset/p' tmp.bak > file.tmp && mv file.tmp tmp.bak # ONLY GET ASSET ADDRESS DATA IN TEMP FILE
    fileLength=$(awk 'END {print NR}' tmp.bak)

    if [ $fileLength = $assetNamesLength ] # CHECK LENGTH ASSETNAMES === ASSET ADDRESS
    then
        echo "[.] Copying assets addresses."
        cat tmp.bak | while read line
        do
            assetAddr=$(echo $line | cut -d':' -f 2 | tr -d '[:space:]') # REMOVE WHITESPACES
            awk -v user="$USER" -v assetAddress="$assetAddr" '{if ($4 == user) print $0, assetAddress; else print $0}' credentials.tmp > file.tmp && mv file.tmp credentials.tmp;
        done
    else
        echo -e "${red} Could not retrieve all addresses. Operation failed for user $USER."
        echo -e "${nc}"
    fi

    # # CLEANUP
    rm tmp.bak

    cat $input

done < $input

cp credentials.tmp $output
awk -v rowNumber="" '{if ($8 == "") print $0}' $input >> $failed # $8 should be amount of rows plus amount of assets
