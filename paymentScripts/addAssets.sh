USER=$1
PASS=$2
USERINDEX=$3
UPDATEDCSV=$4
ASSETNAMES=$5

EXEC=./cli4ioc

assetNames=("eth.xhy" "nxt.xhy")

# GET ASSET ADDRESS AND WRITE TO TEMP FILE
for asset in "${assetNames[@]}"
do
    echo "[.] Retrieving $asset address."
    $EXEC -u $USER -p $PASS --getaddress $asset >> tmp.bak
done

sed -n -e '/^Asset/p' tmp.bak > file.tmp && mv file.tmp tmp.bak # ONLY GET ASSET ADDRESS DATA IN TEMP FILE


ASSETNAMESLENGTH=${#assetNames[@]}
FILELENGTH=$(awk 'END {print NR}' tmp2.bak)

if [ $FILELENGTH = $ASSETNAMESLENGTH ]; then # CHECK LENGTH ASSETNAMES === ASSET ADDRESS
   cat tmp.bak | while read line
   do
       ASSET=$(echo $line | cut -d':' -f 2 | tr -d '[:space:]') # REMOVE WHITESPACES
       awk -v asset="$ASSET" -v userIndex="$USERINDEX" '{ if (NR == userIndex) print $0, asset; else print $0}' $UPDATEDCSV > file.tmp && mv file.tmp $UPDATEDCSV;
   done
else
    RED='\033[0;31m'
    echo "${RED} Couldn't retrieve all addresses. Operation aborted for user $USER."
    echo -e "${NC}"
    exit 0
fi

# awk '{if ($6 != "") print $0}' $INPUT > file.tmp && mv file.tmp $INPUT

# CLEANUP
rm tmp.bak
