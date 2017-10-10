#!/usr/bin/env node
var cmdlinearg = process.argv[2];
var fs = require('fs');
LZString = require('../lib/crypto/lz-string.js');
UrlBase64 = require('../lib/crypto/urlbase64.js');

var jsdata = fs.readFileSync(cmdlinearg, 'utf8');

// DEBUG:console.log(jsdata);

var lzma_result = LZString.compressToEncodedURIComponent(jsdata);
// NO LONGER NEEDED DUE TO PROPER YCHAN: var lzma_result = UrlBase64.safeCompress(jsdata);

fs.writeFileSync(cmdlinearg+'.lzma',lzma_result);
