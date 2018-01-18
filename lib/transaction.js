sendTransaction = function(properties) {
  if (properties.element !== null) {
    UItransform.txStart();
  }
  var p = {};
  p.asset = properties.asset;
  p.base  = properties.asset.split('.')[0];
  // block balance updating for transacting asset
  for(var j=0;j<balance.asset.length;j++) {
    if(balance.asset[j]==p.asset) { balance.lasttx[j] = (new Date).getTime(); }
  }
  p.amount = Number( properties.amount );
  p.fee = Number(assets.fees[p.asset]);
  p.source_address = String(properties.source).trim();
  p.target_address = String(properties.target).trim();
  p.element = properties.element;
  if(p.element !== null) {
    if(typeof p.element.getText === 'undefined') {
      p.balorig = $(p.element).attr('amount');  // running in browser
    } else {
      p.balorig = p.element.getText();  // running in cli4ioc
    }
    if(!isToken(p.asset)) {
      p.balance = toInt(p.balorig).minus(toInt(p.amount).plus(toInt(p.fee)));
    } else {
      p.balance = toInt(p.balorig).minus(toInt(p.amount));
    }
    // instantly deduct hypothetical amount from balance in GUI
    UItransform.deductBalance(p.element,p.balance);
  }

  // send call to perform transaction
  if(typeof assets.fact[p.asset]!='undefined') {
    // prepare universal unspent query containing: source address / target address / amount / public key
    var unspent = 'a/'+p.asset+'/unspent/'+p.source_address+'/'+String(toInt(p.amount).plus(toInt(p.fee)))+'/'+p.target_address+(typeof assets.keys[p.asset].publicKey==='undefined'?'':'/'+assets.keys[p.asset].publicKey);
    hybriddcall({r:unspent,z:1,pass:p},0, function(object,passdata) {
      if(typeof object.data!='undefined' && !object.err) {
        var unspent = object.data;
        var p = passdata;
        if(unspent!==null && typeof unspent==='object' && typeof unspent.change!=='undefined') { unspent.change = toInt(unspent.change,assets.fact[p.asset]); }
        storage.Get(assets.modehashes[ assets.mode[p.asset].split('.')[0] ]+'-LOCAL', function(dcode) {
          deterministic = activate( LZString.decompressFromEncodedURIComponent(dcode) );
          setTimeout(function() {
            if(typeof deterministic!='object' || deterministic=={}) {
              // alert(lang.alertError,lang.modalSendTxErrorDcode);
              if (p.element !== null) {
                alert('Sorry, the transaction could not be generated! Deterministic code could not be initialized!');
                p.element && UItransform.txStop();
              } else {
                process.stdout.write('Transaction failed: The transaction could not be generated. Deterministic code could not be initialized.\n');
                setTimeout(() => process.exit(), 4000);
              }
              UItransform.setBalance(p.element,p.balorig);
            } else {
              try {
                // DEBUG: logger(JSON.stringify(assets));
                var transaction = deterministic.transaction({
                  mode:assets.mode[p.asset].split('.')[1],
                  source:p.source_address,
                  target:p.target_address,
                  amount:toInt(p.amount,assets.fact[p.asset]),
                  fee:toInt(p.fee,assets.fact[p.base]),
                  factor:assets.fact[p.asset],
                  contract:assets.cntr[p.asset],
                  keys:assets.keys[p.asset],
                  seed:assets.seed[p.asset],
                  unspent:unspent
                });
                if(typeof transaction!='undefined') {
                  // DEBUG: logger(transaction);
                  // Do transaction on blockchain
                  hybriddcall({r:'a/'+p.asset+'/push/'+transaction,z:1,pass:p},null, function(object,passdata) {
                    var p = passdata;
                    if(typeof object.data!='undefined' && object.error==0) {
                      if (p.element !== null) {
                        // again deduct real amount from balance in GUI (in case of refresh)
                        UItransform.deductBalance(p.element,p.balance);
                        setTimeout(function() {
                          UItransform.txStop();
                          UItransform.txHideModal();
                        },1000);
                        // push function returns TXID
                        logger('Node sent transaction ID: '+object.data);
                      } else {
                        process.stdout.write('Transaction of ' + properties.amount + ' ' + properties.asset.uppercase() + ' successfully sent to ' + properties.target);
                        setTimeout(() => process.exit(), 4000);
                      }
                    } else {
                      if (p.element !== null) {
                        UItransform.txStop();
                        UItransform.setBalance(p.element,p.balorig);
                        logger('Error sending transaction: '+object.data);
                        //alert(lang.alertError,lang.modalSendTxFailed+'\n'+object.data);
                        alert('The transaction could not be sent by the hybridd node! Please try again. ');
                      } else {
                        process.stdout.write('The transaction could not be sent by the hybridd node! Retrying in a moment.\n');
                        setTimeout(() => sendTransaction(properties), 1000);
                      }
                    }
                  });
                } else {
                  if (p.element !== null) {
                    UItransform.txStop();
                    UItransform.setBalance(p.element,p.balorig);
                    alert('The transaction deterministic calculation failed!  Please ask the Internet of Coins developers to fix this.');
                    logger('Deterministic calculation failed for '+p.asset+'!')
                  } else {
                    process.stdout.write('Transaction failed: The transaction deterministic calculation failed.\n');
                    setTimeout(() => process.exit(), 4000);
                  }
                }
              } catch(e) {
                if (p.element !== null) {
                  UItransform.txStop();
                  UItransform.setBalance(p.element,p.balorig);
                  alert('Sorry, the transaction could not be generated! Check if you have entered the right address.');
                  logger('Error generating transaction for '+p.asset+': '+e)
                } else {
                  process.stdout.write('Transaction failed: The transaction could not be generated! Check if you have entered the right address.\n');
                  setTimeout(() => process.exit(), 4000);
                }
              }
            }
          },500);
        });
      } else {
        if (p.element !== null) {
          UItransform.txStop();
          alert('Sorry, the node did not send us data about unspents for making the transaction! Maybe there was a network problem. Please simply try again.');
        } else {
          process.stdout.write('Transaction failed: The node did not send us data about unspents for making the transaction! Maybe there was a network problem. Retrying in a moment.\n');
          setTimeout(() => sendTransaction(properties), 1000);
        }
      }
    });
  } else {
    if (p.element !== null) {
      UItransform.txStop();
      alert('Transaction failed. Assets were not yet completely initialized. Please try again in a moment.');
    } else {
      process.stdout.write('Transaction failed: Assets were not yet completely initialized. Retrying in a moment.\n');
      setTimeout(() => sendTransaction(properties), 1000);
    }
  }
}
