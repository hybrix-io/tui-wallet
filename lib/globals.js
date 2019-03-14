const lang = require('./lang');

// global variables

global.availableAssets = {}; // List of available assets on the node to be filled with /list/asset/details request
global.assets = {}; // To be filled with saved assets or default eth,btc
global.starredAssets = []; // To be filled with saved starred assets

let screen;

let Decimal = require('../common/crypto/decimal-light');

function fromInt (input, factor) {
  let f = Number(factor);
  let x = new Decimal(String(input));
  return x.times((f > 1 ? '0.' + new Array(f).join('0') : '') + '1');
}

function toInt (input, factor) {
  let f = Number(factor);
  let x = new Decimal(String(input));
  return x.times('1' + (f > 1 ? new Array(f + 1).join('0') : ''));
}

function formatFloat (n) {
  return String(Number(n));
}

// global compatibility functions
function alert (title, text) {
  if (typeof text !== 'undefined') {
    UI.modalfunc.alert(title, text);
  } else {
    UI.modalfunc.alert(lang.alertTitle, title);
  }
}

function logger (text) {
  if (typeof UI !== 'undefined' && typeof UI.logger !== 'undefined') {
    UI.logger.insertBottom(text);
  } else { console.log(text); }
}

function spinnerStart (element) {
  if (typeof UI.spinner.text[element] !== 'undefined') { clearInterval(UI.spinner.text[element].interval); }
  UI.spinner.text[element] = {};
  UI.spinner.text[element].count = 0;
  let len = 0;
  if (typeof UI.text[element] !== 'undefined') {
    len = UI.text[element].getText().length;
  } else {
    UI.spinner.text[element].prev = UI.edit[element].getContent();
  }
  let spca = ''; let spcb = '';
  if (len > 3) {
    for (let i = 1; i < (len / 2); i = i + 1) { spca = spca + ' '; }
    for (let i = 2; i < (len / 2) + (len % 2); i = i + 1) { spcb = spcb + ' '; }
  }
  UI.spinner.text[element].interval = setInterval(function () {
    let widg = '';
    switch (UI.spinner.text[element].count) {
      case 0: widg = spca + '⋅' + spcb; break;
      case 1: widg = spca + '◦ ' + spcb; break;
      case 2: widg = spca + '•' + spcb; break;
      case 3: widg = spca + '◦' + spcb; break;
    }
    if (UI.spinner.text[element].count > 2) { UI.spinner.text[element].count = 0; } else { UI.spinner.text[element].count++; }
    if (typeof UI.text[element] !== 'undefined') {
      UI.text[element].setContent(widg);
    } else {
      if (typeof UI.edit[element] !== 'undefined') {
        UI.edit[element].setContent(widg);
      }
    }
    screen.render();
  }, 500);
}

function spinnerStop (element) {
  try {
    if (typeof UI.spinner.text[element].prev !== 'undefined') { UI.edit[element].setContent(UI.spinner.text[element].prev); }
    if (typeof UI.spinner.text[element] !== 'undefined') { clearInterval(UI.spinner.text[element].interval); delete UI.spinner.text[element]; }
  } catch (err) {
  }
}

function spinnerStopAll (element) {
  if (typeof UI.spinner.text !== 'undefined') {
    Object.keys(UI.spinner.text).forEach(function (element, key, _array) {
      spinnerStop(key);
    });
  }
}

function getDollarPrices (cb) {
  /* najax({
     url: 'https://api.coinmarketcap.com/v1/ticker/?limit=0',
     dataType: 'json',
     timeout: 30000,
     success: function (data) {
     //      GL.coinMarketCapTickers = data; TODO ROUKE
     cb(cb);
     },
     error: function (e) {
     //  GL.coinMarketCapTickers = []; TODO ROUKE
     cb(e);
     }
     }); */

  cb();
}

function renderDollarPrice (symbolName, assetAmount) {
  /* let assetSymbolUpperCase = symbolName.toUpperCase();
  let tickers = GL.coinMarketCapTickers;
  let matchedTicker = tickers.filter(function (ticker) {
    return ticker.symbol === assetSymbolUpperCase;
  });

  return matchedTicker.length !== 0
    ? (assetAmount * matchedTicker[0].price_usd).toFixed(2)
    : '{grey-fg}n/a{/grey-fg}'; */
}

// Toggle DEBUG
DEBUG = false;
