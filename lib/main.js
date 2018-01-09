// globals
require('./globals');

// global requires
fs = require('fs');
path = require('path');
storage = require('./storage');
nacl = require('./crypto/nacl');
crypto = require('crypto');
LZString = require('./crypto/lz-string');
Decimal = require('./crypto/decimal-light'); Decimal.set({ precision: 64 });  // high precision for nonces
UrlBase64 = require('./crypto/urlbase64');
hex2dec = require('./crypto/hex2dec');
hexToBase32 = require('./crypto/hex2base32').hexToBase32;
DJB2 = require('./crypto/hashDJB2');
sha256 = require('./crypto/sha256');
najax = require('najax');                   // replacement for Jquery AJAX
blessed = require('blessed');
clipboardy = require('clipboardy');
jsdom = require('jsdom');
biguint = require('./crypto/biguint-format');
bigint = require('jsbn')
readline = require('readline');

// inline requires
require('./hybriddcall');                   // hybriddcall
require('./transaction');                   // transaction
require('./newAccount_A.js');
require('./newAccount_B.js');               // new account creation

// UI requires
UI.views = {};
require('./views/interface');               // main views interface
require('./views/assets');                  // view: assets
UI.buttonfunc = require('./buttons');       // button functions
UI.modalfunc = require('./modal');          // modal functions

// login deterministically
var userid = process.env['CLI4IOC_USER'];
var passwd = process.env['CLI4IOC_PASS'];

if (process.argv[2] === '-n' || process.argv[2] === 'new') {
  mkNewAccount();
} else {
  doLogin();
}

function mkNewAccount () {
  PRNG.seeder.mkNewAccount()
}

function doLogin () {
  if ( typeof userid!=='undefined' && typeof passwd!=='undefined' ) {
  login(userid,passwd);
  } else {
    console.log(lang.viewLoginEnter);
    var stdio = require('stdio');
    consoleinput(lang.viewLoginUser, {capitalize:true}, function (err, userid) {
      consoleinput(lang.viewLoginPass, {password:true}, function (err, passwd) {
        login(userid,passwd);
      });
    });
  }
}

function login(userid,passwd) {
  if ( typeof userid!=='undefined' && typeof passwd!=='undefined' && userid.length == 16 && (passwd.length == 16 || passwd.length == 48) ) {
    session_step = 0;
    require('./login.js').login( userid,passwd );
    process.stdout.write(lang.viewLoginBusy);
    function sessionWait() {
        if(GL.session == false) {
          process.stdout.write('.');
          setTimeout(sessionWait, 1000);
        } else {
          process.stdout.write(".\n");
          UI.interface();
        }
    }
    sessionWait();
  } else {
    console.error(lang.viewLoginNeedInfo);
  }
}

function consoleinput(question, options, callback) {
	// Options can be omited
	if (typeof options === 'function') {
		callback = options;
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
  process.stdin.setRawMode( true );
	process.stdin.resume();
  // We avoid binary
  process.stdin.setEncoding( 'utf8' );
  // On any data into stdin
  var listener = function( char ) {
    // ctrl-c ( end of text )
    var key = char.charCodeAt(0);
    if ( char === '\u0003' ) {
      process.stdout.write( '\n' );
      process.exit();
    } else if ( key === 13 ) {    // on enterkey
      //process.stdout.write('\033c'); clear screen
      process.stdout.write( '\n' );
      process.stdin.removeListener('data', listener);
      process.stdin.pause();
      process.stdin.setRawMode( false );
      callback(false, result);
    } else if ( key === 127 ) {    // on backspace
      process.stdout.write( '\b \b' );  // delete char at the terminal
      result = result.slice(0, -1);
    } else {
      // write the key to stdout all normal like
      if(char.match(/^[a-zA-Z0-9*]+$/)) {
        if (typeof options.password!=='undefined' && options.password) {
          var out=Array(char.length+1).join('*');
          result = result + char;
        } else if (typeof options.capitalize!=='undefined' && options.capitalize) {
          var out=char.toUpperCase();
          result = result + char.toUpperCase();
        } else {
          var out = char;
          result = result + char;
        }
        process.stdout.write( out );
      }
      // DEBUG: console.log(' > '+char.charCodeAt(0)+' < ');
    }
	};
  // start raw key input and store result
  var result = '';
	process.stdin.addListener('data', listener);
	performQuestion();
}
