#!/bin/bash
input=test.csv
output="paymentScripts/logs/wallet/new_wallet_users_succes.csv"
failed="paymentScripts/logs/wallet/new_wallet_users_failed.csv"

source paymentScripts/config
assetNames=$ASSETNAMES
exec=$EXEC

index=1
green='\033[0;32m'
red='\033[0;31m'
yellow='\033[0;33m'
nc='\033[0m'

[ ! -f $input ] && { echo "$input file not found"; exit 99; }
echo -e "${green}Creating wallets with assets for xxxx users.${nc}"

while read
do
    echo -e "${yellow}[.] Creating new user account."
    echo -e "${nc}"
    $exec --newaccount |
        while read -r line
        do # CREATE ACCOUNT
            [[ "$line" = *"userID"* ]] && user="${line//Your\ userID\ /}";
            [[ "$line" = *"pass"* ]] && pass="${line//Your\ pass\ /}";

            if [[ "$pass" != "" ]]; then # ADD ASSETS TO WALLET
                for asset in "${assetNames[@]}"
                do
                    echo "Adding $asset to wallet."
                    $exec -u $user -p $pass --addasset $asset
                done
                awk -v userID="$user" -v pass="$pass" -v pattern="$index" '(NR == pattern) {print $0, userID, pass}' $input >> $output; # APPEND USER CREDENTIALS TO OUTPUT FILE.
            fi
        done
    (( index++ ))
done < $input

# COMPARE OUTPUT WITH INPUT AND MOVE MISSING USERS TO FAILED FILE
awk -v name='$name' '{if ($4 == "") print $0}' $output >> $failed; # APPEND USER TO FAILED OUTPUT FILE

echo '[.] All done.'
