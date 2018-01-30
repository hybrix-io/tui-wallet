#!/bin/sh
export CLI4IOC_HOST="http://127.0.0.1:1111/"
#export CLI4IOC_HOST="http://staging.coinstorm.net/api/"
# export CLI4IOC_HOST="https://wallet.coinstorm.net/api/"
export CLI4IOC_USER="H7L4YVCQURRLTN4B"
export CLI4IOC_PASS="BYKVA2EENK7SEDSOKLOLPKAWSLHWJ6CTYH7225FHESTUIATO"
./cli4ioc $@
