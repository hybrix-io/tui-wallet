INPUT="new_wallet_users_succes.csv"
OUTPUT="users_with_credentials_succes.csv"
EXEC="./testwallet.sh"

assetNames=("eth.xhy" "nxt.xhy")
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

OLDIFS=$IFS
IFS=" "
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }

cp $INPUT credentials.tmp

while read NAME mail amount USER PASS
do
    echo -e "${GREEN}Getting addresses for user $USER"
    echo -e "${NC}"
    # GET ASSET ADDRESS AND WRITE TO TEMP FILE
    for asset in "${assetNames[@]}"
    do
        echo "[.] Retrieving $asset address."
        $EXEC -u $USER -p $PASS --getaddress $asset >> tmp.bak
    done

    sed -n -e '/^Asset/p' tmp.bak > file.tmp && mv file.tmp tmp.bak # ONLY GET ASSET ADDRESS DATA IN TEMP FILE

    ASSETNAMESLENGTH=${#assetNames[@]}
    FILELENGTH=$(awk 'END {print NR}' tmp.bak)

    if [ $FILELENGTH = $ASSETNAMESLENGTH ] # CHECK LENGTH ASSETNAMES === ASSET ADDRESS
    then
        echo "Copying assets addresses."
        cat tmp.bak | while read line
        do
            ASSETADDR=$(echo $line | cut -d':' -f 2 | tr -d '[:space:]') # REMOVE WHITESPACES
            awk -v user="$USER" -v assetAddress="$ASSETADDR" -v userIndex="$USERINDEX" '{if ($4 == user) print $0, assetAddress; else print $0}' credentials.tmp > file.tmp && mv file.tmp credentials.tmp;
        done
    else
        echo -e "${RED} Could not retrieve all addresses. Operation aborted for user $USER."
        echo -e "${NC}"
    fi

    # # CLEANUP
    rm tmp.bak

done < $INPUT

# $8 should be amount of rows plus amount of assets
awk '{if ($8 == "") print $0}' $INPUT >> users_with_credentials_failed.csv
