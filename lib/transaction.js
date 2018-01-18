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
  } else {
    p.balance = 0;
    p.balorig = 0;
  }
  var performTransactionFn = performTransaction(p, p.asset, p.amount, p.source_address, p.target_address, p.base, p.element, p.balance, p.balorig)

  // Check if user has sufficient funds AFTER checking if there is any data at all.
  if (p.element === null) {
    ifInsufficientFundsExit(p.asset, p.amount, performTransactionFn);
  } else {
    performTransactionFn();
  }
}

function stopTransactionAndSetBalance (element, balorig) {
  UItransform.txStop();
  UItransform.setBalance(element, balorig);
}

function renderMessageAndMaybeRetry (element, uiMessage, uiRenderFunction, properties, commandLineMessage) {
  if (element !== null) {
    uiRenderFunction();
    alert(uiMessage);
  } else {
    renderMessageAndRetry(properties, commandLineMessage);
  }
}

function renderMessageAndMaybeExit (element, balorig, uiMessage, loggerMessage, commandLineMessage) {
  if (element !== null) {
    UItransform.txStop();
    UItransform.setBalance(element, balorig);
    alert(loggerMessage);
    logger(loggerMessage)
  } else {
    renderCmdlMessageAndExit(commandLineMessage);
  }
}

function renderMessageAndRetry (properties, message) {
  process.stdout.write(message);
  setTimeout(() => sendTransaction(properties), 1000);
}

function renderCmdlMessageAndExit (message) {
  process.stdout.write(message);
  setTimeout(() => process.exit(), 4000);
}

function renderSuccessfulMessageAndExit (element, balance, properties, object) {
  if (element !== null) {
    UItransform.deductBalance(element, balance); // Again deduct real amount from balance in GUI (in case of refresh)
    setTimeout(function() {
      UItransform.txStop();
      UItransform.txHideModal();
    }, 1000);
    logger('Node sent transaction ID: '+ object.data); // Push function returns TXID
  } else {
    var succesfullTransactionMessage = 'Transaction of ' + properties.amount + ' ' + properties.asset.toUpperCase() + ' successfully sent to ' + properties.target_address;
    renderCmdlMessageAndExit(succesfullTransactionMessage);
  }
}

function ifInsufficientFundsExit (asset, amount, cb) {
  var balance_
  hybriddcall({r:'a/' + asset + '/balance/'  + assets.addr[asset], z:0}, null, function (object){
    if(typeof object.data === 'string') { object.data = formatFloat(object.data); }
    var currentBalance = String(object.data);
    var fee_ = Number(assets.fees[asset])
    var hasSufficientFunds = amount + fee_ < currentBalance;

    if (!hasSufficientFunds) {
      renderCmdlMessageAndExit('Transaction failed: Insufficient funds to perform this transaction.\n');
    } else {
      process.stdout.write('Processing transaction.\n');
      cb()
    }
  })
  return 1;
}

function performTransaction (properties, asset, amount, source_address, target_address, base, element, balance, balorig) {
  return function () {
    var fee = Number(assets.fees[asset]);
    // send call to perform transaction
    if(typeof assets.fact[asset]!='undefined') {
      // prepare universal unspent query containing: source address / target address / amount / public key
      var unspent = 'a/'+asset+'/unspent/'+source_address+'/'+String(toInt(amount).plus(toInt(fee)))+'/'+target_address+(typeof assets.keys[asset].publicKey==='undefined'?'':'/'+assets.keys[asset].publicKey);
      hybriddcall({r:unspent,z:1,pass:properties},0, function(object,passdata) {
        if(typeof object.data!='undefined' && !object.err) {
          var unspent = object.data;
          var p = passdata;
          if(unspent!==null && typeof unspent==='object' && typeof unspent.change!=='undefined') { unspent.change = toInt(unspent.change,assets.fact[asset]); }
          storage.Get(assets.modehashes[ assets.mode[asset].split('.')[0] ]+'-LOCAL', function(dcode) {
            deterministic = activate( LZString.decompressFromEncodedURIComponent(dcode) );
            setTimeout(function() {
              if(typeof deterministic!='object' || deterministic=={}) {
                // alert(lang.alertError,lang.modalSendTxErrorDcode);
                if (element !== null) {
                  alert('Sorry, the transaction could not be generated! Deterministic code could not be initialized!');
                  element && UItransform.txStop();
                } else {
                  renderCmdlMessageAndExit('Transaction failed: The transaction could not be generated. Deterministic code could not be initialized.\n');
                }
                UItransform.setBalance(element,balorig);
              } else {
                try {
                  // DEBUG: logger(JSON.stringify(assets));
                  var transaction = deterministic.transaction({
                    mode:assets.mode[asset].split('.')[1],
                    source:source_address,
                    target:target_address,
                    amount:toInt(amount,assets.fact[asset]),
                    fee:toInt(fee,assets.fact[base]),
                    factor:assets.fact[asset],
                    contract:assets.cntr[asset],
                    keys:assets.keys[asset],
                    seed:assets.seed[asset],
                    unspent:unspent
                  });
                  if(typeof transaction!='undefined') {
                    // DEBUG: logger(transaction);
                    // Do transaction on blockchain
                    hybriddcall({r:'a/'+asset+'/push/'+transaction,z:1,pass:p},null, function(object,passdata) {
                      var p = passdata;
                      if(typeof object.data!='undefined' && object.error==0) {
                        renderSuccessfulMessageAndExit(element, balance, properties, object)
                      } else {
                        renderMessageAndMaybeRetry(
                          element,
                          'The transaction could not be sent by the hybridd node! Please try again.',
                          () => {UItransform.txStop(); UItransform.setBalance(element,balorig); logger('Error sending transaction: '+object.data);},
                          'The transaction could not be sent by the hybridd node! Retrying in a moment.\n',
                          renderMessageAndRetry
                        ) // alert(lang.alertError,lang.modalSendTxFailed+'\n'+object.data);
                      }
                    });
                  } else {
                    renderMessageAndMaybeExit(
                      element,
                      balorig,
                      'The transaction deterministic calculation failed!  Please ask the Internet of Coins developers to fix this.',
                      'Deterministic calculation failed for ' + asset + '!',
                      'Transaction failed: The transaction deterministic calculation failed.\n'
                    )
                  }
                } catch(e) {
                  renderMessageAndMaybeExit(
                    element,
                    balorig,
                    'Sorry, the transaction could not be generated! Check if you have entered the right address.',
                    'Error generating transaction for ' + asset + ': ' + e,
                    'Transaction failed: The transaction could not be generated! Check if you have entered the right address.\n'
                  )
                }
              }
            },500);
          });
        } else {
          renderMessageAndMaybeRetry(
            element,
            'Sorry, the node did not send us data about unspents for making the transaction! Maybe there was a network problem. Please simply try again.',
            UItransform.txStop,
            properties,
            'Transaction failed: The node did not send us data about unspents for making the transaction! Maybe there was a network problem. Retrying in a moment.\n')
        }
      });
    } else {
      renderMessageAndMaybeRetry(
        element,
        'Transaction failed. Assets were not yet completely initialized. Please try again in a moment.',
        UItransform.txStop,
        properties,
        'Transaction failed: Assets were not yet completely initialized. Retrying in a moment.\n')
    }
  }
}
