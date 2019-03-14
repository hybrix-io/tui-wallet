const UItransform = {
  txStart: function () {
    spinnerStart('SendTx');
  },
  txStop: function () {
    spinnerStop('SendTx');
  },
  txHideModal: function () {
    UI.modalfunc.destroy();
  },
  setBalance: function (element, setBalance) {
    element.setText(setBalance); // restore original amount
  },
  deductBalance: function (element, newBalance) {
    element.setContent('{red-fg}' + String(newBalance) + '{/red-fg}');
  }
};

let sendTransaction = function (properties) {
  if (properties.element !== null) {
    UItransform.txStart();
  }
  let p = {};
  p.asset = properties.asset;
  p.base = properties.asset.split('.')[0];

  // TODO ROUKE block balance updating for transacting asset
  // for (var j = 0; j < balance.asset.length; j++) {
  //    if (balance.asset[j] === p.asset) { balance.lasttx[j] = (new Date()).getTime(); }
  //  }

  p.amount = Number(properties.amount); // TODO this will break on large numbers!
  p.fee = Number(global.assets[p.asset].fee);
  p.source_address = String(properties.source).trim();
  p.target_address = String(properties.target).trim();

  p.element = properties.element;
  if (p.element !== null) {
    p.balorig = p.element.getText(); // running in cli4ioc
    if (!isToken(p.asset)) {
      p.balance = toInt(p.balorig).minus(toInt(p.amount).plus(toInt(p.fee))); // TODO this will break on large numbers!
    } else {
      p.balance = toInt(p.balorig).minus(toInt(p.amount));
    }
    // instantly deduct hypothetical amount from balance in GUI
    UItransform.deductBalance(p.element, p.balance);
  } else {
    p.balance = 0;
    p.balorig = 0;
  }
  let performTransactionFn = performTransaction(p, p.asset, p.amount, p.source_address, p.target_address, p.base, p.element, p.balance, p.balorig);

  // Check if user has sufficient funds AFTER checking if there is any data at all.
  if (p.element === null) {
    ifInsufficientFundsExit(p.asset, p.amount, performTransactionFn);
  } else {
    performTransactionFn();
  }
};

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
    logger(loggerMessage);
  } else {
    renderCmdlMessageAndExit(commandLineMessage);
  }
}

function renderMessageAndRetry (properties, message) {
  process.stdout.write(message);
  setTimeout(() => sendTransaction(properties), 1000);
}

function renderCmdlMessageAndExit (message) {
  console.log(message);
  setTimeout(() => process.exit(), 4000);
}

function renderSuccessfulMessageAndExit (element, balance, properties, object) {
  if (element !== null) {
    UItransform.deductBalance(element, balance); // Again deduct real amount from balance in GUI (in case of refresh)
    setTimeout(function () {
      UItransform.txStop();
      UItransform.txHideModal();
    }, 1000);
    logger('Node sent transaction ID: ' + object.data); // Push function returns TXID
  } else {
    let succesfullTransactionMessage = 'Transaction of ' + properties.amount + ' ' + properties.asset.toUpperCase() + ' successfully sent to ' + properties.target_address;
    renderCmdlMessageAndExit(succesfullTransactionMessage);
  }
}

function ifInsufficientFundsExit (asset, amount, cb) {
  let balance_;
  hybrixdcall({r: 'a/' + asset + '/balance/' + assets.addr[asset], z: 0}, null, function (object) {
    if (typeof object.data === 'string') { object.data = formatFloat(object.data); }
    let currentBalance = String(object.data);
    let fee_ = Number(assets.fees[asset]);
    let hasSufficientFunds = amount + fee_ < currentBalance;

    if (!hasSufficientFunds) {
      renderCmdlMessageAndExit('Transaction failed: Insufficient funds to perform this transaction.\n', 1);
    } else {
      console.log('Processing transaction.\n');
      cb();
    }
  });
}

function performTransaction (properties, asset, amount, sourceAddress, targetAddress, base, element, balance, balorig) {
  return function () {
    hybrix.transaction(
      {symbol: asset, amount: amount, target: targetAddress, channel: 'y'},
      (rawTransaction) => {
        renderSuccessfulMessageAndExit(element, balance, properties, rawTransaction);
      },
      (error) => {
        renderMessageAndMaybeExit(
          element,
          balorig,
          'Sorry, the transaction could not be generated! Check if you have entered the right address.',
          'Error generating transaction for ' + asset + ': ' + error,
          'Transaction failed: The transaction could not be generated! Check if you have entered the right address.\n',
          1
        );
      }
    );
  };
}

exports.send = sendTransaction;
