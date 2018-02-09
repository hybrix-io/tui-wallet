#!/bin/bash
input=credentials.tmp

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
echo -e "${green}[.] Starting Hybridd transaction transfers.${nc}"

while read line
do
    user=$(awk -v userIndex="$index" '(NR == userIndex) {print $4}' $input)

    echo -e "${yellow}Processing transaction(s) for user $user ${nc}"

    for i in "${!assetNames[@]}"; do
        addressColumn=$(($columnOffset + $i))
        totalAmount=$(awk -v userIndex="$index" '(NR == userIndex) {print $3}' $input)
        amount=$(( $totalAmount / $assetNamesLength ))
        address=$(awk -v col="$addressColumn" -v userIndex="$index" '(NR == userIndex) {print $col}' $input)

        if [[ $address != *"xxxx"* ]] # address === xxxx IF IT ALREADY HAS BEEN PROCESSED
        then
            assetNameUppercase=$(echo ${assetNames[$i]} | tr /a-z/ /A-Z/)
            successfulTransactionStr=$(echo "Transaction of $amount $assetNameUppercase successfully sent to $address")

            echo "[.] Processing transaction of $amount $assetNameUppercase to $address."
            $exec -u $ownUserID -p $ownPass --sendtransaction ${assetNames[$i]} $amount $address >> tmp.bak # DO ACTUAL TRANSACTION

            if grep -a "$successfulTransactionStr" "tmp.bak" # CHECK IF TRANSACTION SUCCEEDED BY LOOKING FOR SUCCESFUL TRANSACTION LOG
            then
                echo -e "${green}Succes: ${nc}Transaction of $amount ${assetNames[$i]} succesful."
                awk -v userIndex="$index" -v columnNumber="$addressColumn" '(NR == userIndex) {$columnNumber="xxxx"; print}' temp_users_with_credentials.csv >> file.tmp && mv file.tmp temp_users_with_credentials.csv
            else

                echo -e "${red}Error: ${nc}Transaction of $amount ${assetNames[$i]} failed.${nc}"
                echo $line $amount ${assetNames[$i]} >> failed_transactions.csv
                cp tmp.bak "paymentScripts/logs/user-$(echo $user)_$(echo ${assetNames[$i]}).log"
            fi
            rm tmp.bak
        else
            echo "Address was xxxx"
        fi
    done
    (( index++ ))
done < $input

echo '[.] All done.'
