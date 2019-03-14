// globals
/*require('./globals');

// global requires
fs = require('fs');
path = require('path');
storage = require('./storage');
nacl = null; // TODO: make official global
require('./crypto/nacl').instantiate(function (naclinstance) {
  nacl = naclinstance;
});
crypto = require('crypto'); // needed to avoid nodejs crypto problems
LZString = require('./crypto/lz-string');
Decimal = require('./crypto/decimal-light'); Decimal.set({ precision: 64 }); // high precision for nonces
UrlBase64 = require('./crypto/urlbase64');
hex2dec = require('./crypto/hex2dec');
hexToBase32 = require('./crypto/hex2base32').hexToBase32;
DJB2 = require('./crypto/hashDJB2');
sha256 = require('./crypto/sha256');
proofOfWork = require('./crypto/proof');
najax = require('najax'); // replacement for Jquery AJAX
blessed = require('blessed');
clipboardy = require('clipboardy');
jsdom = require('jsdom');
biguint = require('./crypto/biguint-format');
bigint = require('jsbn');
readline = require('readline');

// inline requires
require('./hybrixdcall'); // hybrixdcall
require('./transaction'); // transaction
require('./newAccount_A.js');
require('./newAccount_B.js'); // new account creation

// UI requires
UI.views = {};
require('./views/interface/interface'); // main views interface
require('./views/assets/assets'); // view: assets
UI.buttonfunc = require('./buttons'); // button functions
UI.modalfunc = require('./modal'); // modal functions

// login deterministically
var userid = process.env['CLI4IOC_USER'];
var passwd = process.env['CLI4IOC_PASS'];

function doLogin () {
  if (typeof userid !== 'undefined' && typeof passwd !== 'undefined') {
    login(userid, passwd);
  } else {
    var stdio = require('stdio');
    consoleinput(lang.viewLoginUser, {capitalize: true}, function (err, userid) {
      consoleinput(lang.viewLoginPass, {password: true}, function (err, passwd) {
        login(userid, passwd);
      });
    });
  }
}

function sessionWait () {
  if (GL.session === false) {
    process.stdout.write('.');
    var promise = new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(sessionWait());
      }, 1000);
    });
    return promise;
  } else {
    process.stdout.write('.\n');

    UI.interface();
    return 1;
  }
}

login = function login (userid, passwd) {
  if (typeof userid !== 'undefined' && typeof passwd !== 'undefined' && userid.length === 16 && (passwd.length === 16 || passwd.length === 48)) {
    session_step = 0;
    require('./views/login/login.js').login(userid, passwd);
    process.stdout.write(lang.viewLoginBusy);
    return sessionWait();
  } else {
    console.error(' [!] ' + lang.viewLoginNeedInfo);
    return 0;
  }
};

// command line options and init
var stdio = require('stdio');
var ops = stdio.getopt({
  'rpc': {key: 'r', args: 1, description: 'Run wallet as RPC controllable [optional argument: port]'},
  'userid': {key: 'u', args: 1, description: 'Set username'},
  'passwd': {key: 'p', args: 1, description: 'Set password'},
  'newaccount': {key: 'n', description: 'Generate new wallet'},
  'sendtransaction': {key: 't', args: 3, description: 'Send transaction [argument: asset] [argument: amount] [argument: target address]'},
  'addasset': {key: 'a', args: 1, description: 'Add asset to wallet [argument: asset name]'},
  'getaddress': {key: 'g', args: 1, description: 'Add asset to wallet [argument: asset name]'}
});

if (ops.userid) { userid = ops.userid; }
if (ops.passwd) { passwd = ops.passwd; }
if (ops.newaccount) {
  PRNG.seeder.mkNewAccount();
  process.exit();
}
if (ops.sendtransaction) {
  globals.transactionDetails = {
    asset: ops.sendtransaction[0].toLowerCase(),
    amount: ops.sendtransaction[1],
    target: ops.sendtransaction[2]
  };
}
if (ops.addasset) { globals.newAsset = ops.addasset; }
if (ops.getaddress) { globals.addressToGet = ops.getaddress; }

if (ops.rpc) {
  var router = require('./router.js');
  var http = require('http');
  last_xpath = '';
  // create local server

  var rpcport = String(ops.rpc === 1 ? 1112 : ops.rpc);
  console.log('Waiting for RPC commands on port ' + rpcport + ' ...');
  http.createServer(onRequest).listen(rpcport, '127.0.0.1');
} else {
  if (typeof userid !== 'undefined' && typeof passwd !== 'undefined') {
    login(userid, passwd);
  } else {
    console.log(lang.viewLoginEnter);
    consoleinput(lang.viewLoginUser, {capitalize: true}, function (err, userid) {
      consoleinput(lang.viewLoginPass, {password: true}, function (err, passwd) {
        login(userid, passwd);
      });
    });
  }
}

function onRequest (request, response) {
  response.writeHead(200, {'Content-Type': 'application/json'});
  response.write(router.route(request));
  response.end();
}

function consoleinput (question, options, callback_) {
  // Options can be omited
  if (typeof options === 'function') {
    callback_ = options;
    options = null;
  }
  // Throw possible errors
  if (!question) {
    throw new Error('Prompt question is malformed. It must include at least a question text.');
  }
  // Prints the question
  var performQuestion = function () {
    var str = question;
    str += ': ';
    process.stdout.write(str);
  };
  // Without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  process.stdin.resume();
  // We avoid binary
  process.stdin.setEncoding('utf8');
  // On any data into stdin
  var listener = function (char) {
    // ctrl-c ( end of text )
    var key = char.charCodeAt(0);
    if (char === '\u0003') {
      process.stdout.write('\n');
      process.exit();
    } else if (key === 13) { // on enterkey
      // process.stdout.write('\033c'); clear screen
      process.stdout.write('\n');
      process.stdin.removeListener('data', listener);
      process.stdin.pause();
      process.stdin.setRawMode(false);
      callback_(false, result);
    } else if (key === 127) { // on backspace
      process.stdout.write('\b \b'); // delete char at the terminal
      result = result.slice(0, -1);
    } else {
      // write the key to stdout all normal like
      if (char.match(/^[a-zA-Z0-9*]+$/)) {
        if (typeof options.password !== 'undefined' && options.password) {
          var out = Array(char.length + 1).join('*');
          result = result + char;
        } else if (typeof options.capitalize !== 'undefined' && options.capitalize) {
          var out = char.toUpperCase();
          result = result + char.toUpperCase();
        } else {
          var out = char;
          result = result + char;
        }
        process.stdout.write(out);
      }
      // DEBUG: console.log(' > '+char.charCodeAt(0)+' < ');
    }
  };
  // start raw key input and store result
  var result = '';
  process.stdin.addListener('data', listener);
  performQuestion();
}
*/
