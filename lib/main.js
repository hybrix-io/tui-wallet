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
najax = require('najax');                   // replacement for Jquery AJAX
blessed = require('blessed');
clipboardy = require('clipboardy');
jsdom = require('jsdom');

// inline requires
require('./hybriddcall');                   // hybriddcall
require('./transaction');                   // transaction

// UI requires
UI.views = {};
require('./views/interface');               // main views interface
require('./views/assets');                  // view: assets
UI.buttonfunc = require('./buttons');       // button functions
UI.modalfunc = require('./modal');          // modal functions

// login deterministically
var userid = process.env['CLI4IOC_USER'];
var passwd = process.env['CLI4IOC_PASS'];

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

login(userid,passwd);
