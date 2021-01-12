const lang = require('./lang');
const fs = require('fs');
// global variables

global.availableAssets = {}; // List of available assets on the node to be filled with /list/asset/details request
global.assets = {}; // To be filled with saved assets or default eth,btc
global.legacyFilePrefix = {
  assetPreference: 'ff00-0035',
  contacts: 'ff00-0036',
  currencyPreference: 'ff00-0037',
  pendingTransactions: 'ff00-0038'
};

let screen;

/**
 * @param number
 */
function pad (number) {
  if (number < 10) return '0' + number;
  return number;
}

/**
 * @param categories
 * @param {...any} messages
 */
function logger (categories, ...messages) {
  const now = new Date();
  const timestamp = now.getFullYear() +
        '-' + pad(now.getMonth() + 1) +
        '-' + pad(now.getDate()) +
        'T' + pad(now.getHours()) +
        ':' + pad(now.getMinutes()) +
    ':' + pad(now.getSeconds());

  if (!fs.existsSync('./var/log/tui-wallet.log')) {
    fs.mkdirSync('./var/log', {recursive: true});
    fs.appendFileSync('./var/log/tui-wallet.log', `[i] ${timestamp} info|log Created log file.\n`);
  }

  let head = '[.]';
  if (categories.includes('error') || categories.includes('warn')) head = '[!]';
  else if (categories.includes('info')) head = '[i]';

  const categoryString = categories.filter(category => !['error', 'info', 'warn'].includes(category)).join('|');
  messages.unshift(head, timestamp, categoryString);
  // UI.log(messages.join(' '));
  fs.appendFileSync('./var/log/tui-wallet.log', messages.join(' ') + '\n');
}
global.logger = logger;

/**
 * @param element
 */
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

/**
 * @param element
 */
function spinnerStop (element) {
  try {
    if (typeof UI.spinner.text[element].prev !== 'undefined') { UI.edit[element].setContent(UI.spinner.text[element].prev); }
    if (typeof UI.spinner.text[element] !== 'undefined') { clearInterval(UI.spinner.text[element].interval); delete UI.spinner.text[element]; }
  } catch (err) {
  }
}

/**
 * @param element
 */
function spinnerStopAll (element) {
  if (typeof UI.spinner.text !== 'undefined') {
    Object.keys(UI.spinner.text).forEach(function (element, key, _array) {
      spinnerStop(key);
    });
  }
}

// Toggle DEBUG
DEBUG = false;
