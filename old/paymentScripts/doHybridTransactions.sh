#!/bin/bash
input=paymentScripts/logs/assets/users_with_credentials_succes.csv
output=paymentScripts/logs/transactions/successful_transactions.csv
failed=paymentScripts/logs/transactions/failed_transactions.csv

index=1
columnOffset=6

source paymentScripts/config
exec=$EXEC
assetNames=$ASSETNAMES
assetNamesLength=$(echo ${#ASSETNAMES[@]})
ownUserID=$OWNUSERID
ownPass=$OWNPASS

green='\033[0;32m'
red='\033[0;31m'
yellow='\033[0;33m'
nc='\033[0m'

cp $input temp_users_with_credentials.csv # TEMP FILE TO RECORD WHICH TRANSACTION HAVE BEEN SUCCESFUL.
> $failed
> $output

echo -e "${green}[.] Starting hybrixd transaction transfers.${nc}"

while IFS=" " read -r name mail amount user pass # PUT USER CREDS IN ARRAY
do
    ARRAY_USER+=("$user")
    ARRAY_PASS+=("$pass")
done < $input

for i in "${!ARRAY_USER[@]}"
do
    USER=${ARRAY_USER[$i]}
    PASS=${ARRAY_PASS[$i]}

    echo -e "${yellow}Processing transaction(s) for user $USER ${nc}"

    for j in "${!ASSETNAMES[@]}"; do # PER ASSET, FIND ADDRESS AND DO TRANSACTION
        addressColumn=$(($columnOffset + $j))
        totalAmount=$(awk -v userIndex="$((i + 1))" '(NR == userIndex) {print $3}' $input)
        amount=$(( $totalAmount / $(echo ${#ASSETNAMES[@]}) ))
        address=$(awk -v col="$addressColumn" -v userIndex="$((i + 1))" '(NR == userIndex) {print $col}' $input)

        if [[ $address != *"xxxx"* ]] # address === xxxx IF IT ALREADY HAS BEEN PROCESSED
        then
            assetNameUppercase=$(echo ${ASSETNAMES[$j]} | tr /a-z/ /A-Z/)
            successfulTransactionStr=$(echo "Transaction of $amount $assetNameUppercase successfully sent to $address")

            echo "[.] Processing transaction of $amount $assetNameUppercase to $address."
            $exec -u $ownUserID -p $ownPass --sendtransaction ${ASSETNAMES[$j]} $amount $address >> tmp.bak # DO ACTUAL TRANSACTION

            if grep -a "$successfulTransactionStr" "tmp.bak" # CHECK IF TRANSACTION SUCCEEDED BY LOOKING FOR SUCCESFUL TRANSACTION LOG
            then
                echo -e "${green}Succes: ${nc}Transaction of $amount ${ASSETNAMES[$j]} successful."
                awk -v userIndex="$index" -v columnNumber="$addressColumn" '(NR == userIndex) {$columnNumber="xxxx"; print}' temp_users_with_credentials.csv >> file.tmp && mv file.tmp temp_users_with_credentials.csv
            else
                echo -e "${red}Error: ${nc}Transaction of $amount ${ASSETNAMES[$j]} failed.${nc}"
                echo $USER $PASS $amount ${ASSETNAMES[$j]} >> $failed
                cp tmp.bak "paymentScripts/logs/transactions/logs/user-$(echo $USER)_$(echo ${ASSETNAMES[$j]}).log"
            fi
            rm tmp.bak
        else
            echo "Address was xxxx"
        fi
    done
done

cp temp_users_with_credentials.csv $output

echo '[.] All done.'
