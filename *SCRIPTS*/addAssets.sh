USER=$1
PASS=$2
USERINDEX=$3
UPDATEDCSV=$4
ASSETNAMES=$5

assetNames=( "eth.xhy" "nxt.xhy")

# GET ASSET ADDRESS AND WRITE TO TEMP FILE
# for asset in "${assetNames[@]}"
# do
#     echo "[.] Retrieving $asset address."
#     ./cli4ioc -u $USER -p $PASS --getaddress $asset >> tmp.bak
# done

# ONLY GET ASSET ADDRESS DATA IN TEMP FILE (Mac has to store it in another file...)
# sed -n -e '/^Asset/p' tmp.bak >> tmp2.bak

# CHECK LENGTH ASSETNAMES === ASSET ADDRESS
ASSETNAMESLENGTH=${#assetNames[@]}
FILELENGTH=$(awk 'END {print NR}' tmp2.bak)

if [ $FILELENGTH = $ASSETNAMESLENGTH ]; then
   cat tmp2.bak | while read line
   do
       ASSET=$(echo $line | cut -d':' -f 2 | tr -d '[:space:]')
       # awk -v asset="$ASSET" -v userIndex="$USERINDEX" '(NR == pattern) {print $0, asset}' $UPDATEDCSV > file.tmp && mv file.tmp $UPDATEDCSV
       # awk -v asset="$ASSET" -v userIndex="$USERINDEX" '(NR == userIndex) {print $0, asset}' $UPDATEDCSV >> user_credentials.csv;
              awk -v asset="$ASSET" -v userIndex="$USERINDEX" '(NR == userIndex) {print $0 asset}; {print $0}; ' $UPDATEDCSV > file.tmp && mv file.tmp $UPDATEDCSV;
       # REMOVE USER FROM FAILED CSV
       # awk '' failed.csv > file.tmp && mv file.tmp failed.csv

   done
else
    RED='\033[0;31m'
    echo "${RED} Couldn't retrieve all addresses"
    echo -e "${NC}"
    exit 0
fi

# CLEANUP
# rm tmp.bak
# rm tmp2.bak
