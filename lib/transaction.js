let functions = require('./functions');
let UI = require('./ui');

const UItransform = {
  txStart: function () {
    // spinnerStart('SendTx');
  },
  txStop: function () {
    // spinnerStop('SendTx');
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

function performTransaction (properties, symbol, amount, target, element, balance, balorig) {
  hybrix.rawTransaction(
    {symbol: symbol, amount: amount, target: target, channel: 'y'},
    (transactionId) => {
      renderSuccessfulMessageAndExit(element, balance, properties, transactionId);
    },
    (error) => {
      console.log(error);
      renderMessageAndMaybeExit(
        element,
        balorig,
        'Sorry, the transaction could not be generated! Check if you have entered the right address.',
        'Error generating transaction for ' + symbol + ': ' + error,
        'Transaction failed: The transaction could not be generated! Check if you have entered the right address.\n',
        1
      );
    }
  );
}

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
  p.target = String(properties.target).trim();

  p.element = properties.element;
  if (p.element !== null) {
    p.balorig = p.element.getText(); // running in cli4ioc
    if (!functions.isToken(p.asset)) {
      p.balance = functions.toInt(p.balorig).minus(functions.toInt(p.amount).plus(functions.toInt(p.fee))); // TODO this will break on large numbers!
    } else {
      p.balance = functions.toInt(p.balorig).minus(functions.toInt(p.amount));
    }
    // instantly deduct hypothetical amount from balance in GUI
    UItransform.deductBalance(p.element, p.balance);
  } else {
    p.balance = 0;
    p.balorig = 0;
  }
  performTransaction(p, p.asset, p.amount, p.target, p.element, p.balance, p.balorig);
};

function renderMessageAndMaybeExit (element, balorig, uiMessage, loggerMessage, commandLineMessage) {
  if (element !== null) {
    UItransform.txStop();
    UItransform.setBalance(element, balorig);
    UI.alert(loggerMessage);
    UI.log(loggerMessage);
  } else {
    renderCmdlMessageAndExit(commandLineMessage);
  }
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
    UI.log('Node sent transaction ID: ' + object.data); // Push function returns TXID
  } else {
    let succesfullTransactionMessage = 'Transaction of ' + properties.amount + ' ' + properties.asset.toUpperCase() + ' successfully sent to ' + properties.target_address;
    renderCmdlMessageAndExit(succesfullTransactionMessage);
  }
}

exports.send = sendTransaction;
