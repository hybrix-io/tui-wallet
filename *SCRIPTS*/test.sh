./\*SCRIPTS\*/mkWalletAndAddAsset.sh
exit
export CLI4IOC_USER="I4X4KG67OBET5TS5"
export CLI4IOC_PASS="HD6L5K4JEOM2PZNE"

assetNames=( "eth.xhy" "nxt.xhy")

# GET ASSET ADDRESS AND WRITE TO TEMP FILE
for asset in "${assetNames[@]}"
do
    echo "[.] Retrieving $asset address."
    ./cli4ioc --getaddress $asset >> tmp.bak
done

# ONLY GET ASSET ADDRESS DATA IN TEMP FILE (Mac has to store it in another file...)
sed -n -e '/^Asset/p' tmp.bak >> tmp2.bak

# CHECK LENGTH ASSETNAMES === ASSET ADDRESS
ASSETNAMESLENGTH=${#assetNames[@]}
FILELENGTH=$(awk 'END {print NR}' tmp2.bak)

if [ $FILELENGTH = $ASSETNAMESLENGTH ]; then
   cat tmp2.bak | while read line
   do
       ASSET=$(echo $line | cut -d':' -f 2 | tr -d '[:space:]')
       awk -v asset="$ASSET" '(NR == pattern) {print $0, asset}' test.txt > testfile.tmp && mv testfile.tmp test.txt
   done
else
    RED='\033[0;31m'
    echo "${RED} Couldn't retrieve all addresses"
    exit 0
fi

# CLEANUP
rm tmp.bak
rm tmp2.bak
