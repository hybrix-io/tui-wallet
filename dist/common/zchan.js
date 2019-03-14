var ychan = require('./ychan');
var LZString = require('./crypto/lz-string');

// zchan
// zchan compresses an API query before sending it to the router
// usercryptography is handled by ychan, and keys are passed

var path = function (usercrypto, step, txtdata) {
  var encdata = ychan.encode(usercrypto, step, encode(usercrypto, step, txtdata));
  return 'z/' + encdata;
};

var obj = function (usercrypto, step, encdata) {
  try {
    return JSON.parse(decode(usercrypto, step, encdata));
  } catch (err) {
    return false;
  }
};

var encode = function (usercrypto, step, txtdata) {
  return LZString.compressToEncodedURIComponent(txtdata);
};

var decode_sub = function (encdata) {
  return LZString.decompressFromEncodedURIComponent(encdata);
};

var decode = function (usercrypto, step, encdata) {
  return ychan.ychan_decode(usercrypto, step, encdata);
};

module.exports = {
  path, // formily zchan
  obj,
  encode,
  decode_sub,
  decode
};
