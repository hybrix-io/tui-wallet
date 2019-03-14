// ychan encrypts an API query before sending it to the router
var UrlBase64 = require('./crypto/urlbase64');
var Decimal = require('./crypto/decimal-light');
var hex2dec = require('./crypto/hex2dec');
var CommonUtils = require('./index');
Decimal.set({precision: 64});

var path = function (usercrypto, step, txtdata) {
  // decodes only from UrlBase64 for now, must be real usercrypto!
  var encdata = encode(usercrypto, step, txtdata);
  return 'y/' + encdata;
};

var obj = function (usercrypto, step, encdata) {
  return JSON.parse(decode(usercrypto, step, encdata));
};

/*
  data = {
  sessionID
  sessionNonce
  serverSessionPubKey
  clientSessionSecKey
  step,
  txtdata
  }
*/
var encode_sub = function (data) {
  var cryptUtf8 = nacl.encode_utf8(data.txtdata);
  // use nacl to create a crypto box containing the data
  var cryptBin = nacl.crypto_box(
    cryptUtf8,
    data.sessionNonce,
    data.serverSessionPubKey,
    data.clientSessionSecKey
  );
  var encdata = nacl.to_hex(cryptBin);
  // DEBUG: console.log(sessionid+'/'+step+'/'+encdata); // this seems to work properly
  return data.sessionID + '/' + data.step + '/' + UrlBase64.safeCompress(encdata);
};

// sessionData = sessionHex
var encode = function (usercrypto, step, txtdata) {
  var sessionData = document.querySelector('#session_data').textContent; // fetch relevant info from #session_data
  var sessionSecData = getGeneralSessionData(usercrypto, step, sessionData);

  return encode_sub({
    sessionID: sessionSecData.sessionID,
    sessionNonce: sessionSecData.sessionNonce,
    serverSessionPubKey: sessionSecData.serverSessionPubKey,
    clientSessionSecKey: sessionSecData.clientSessionSecKey,
    step,
    txtdata
  });
};

/*
data = {
encdata
sessionNonce
serverSessionPubKey
clientSessionSecKey
}
*/
var decode_sub = function (data) {
  // TODO: add check for encdata.error:0?
  var txtdata;
  var hexdata = UrlBase64.safeDecompress(data.encdata);
  // DEBUG: alert('Ychan decode nonce conhex: '+nonce_conhex+' Hex data: '+hexdata);
  if (hexdata != null) {
    var cryptHex = nacl.from_hex(hexdata);
    // use nacl to create a crypto box containing the data
    var cryptBin = nacl.crypto_box_open(
      cryptHex,
      data.sessionNonce,
      data.serverSessionPubKey,
      data.clientSessionSecKey
    );
    txtdata = nacl.decode_utf8(cryptBin);
  } else { txtdata = null; }
  return txtdata;
};

var decode = function (usercrypto, step, encdata) {
  var sessionData = document.querySelector('#session_data').textContent;
  var txtdata = null;
  if (encdata !== null) {
    // decompress the data into a hex string
    var sessionSecData = getGeneralSessionData(usercrypto, step, sessionData);
    txtdata = decode_sub({
      encdata,
      sessionNonce: sessionSecData.sessionNonce,
      serverSessionPubKey: sessionSecData.serverSessionPubKey,
      clientSessionSecKey: sessionSecData.clientSessionSecKey
    });
  }
  return txtdata;
};

var getGeneralSessionData = function (usercrypto, step, sessionData) {
  var sessionObject = CommonUtils.readSession(
    usercrypto.user_keys,
    usercrypto.nonce,
    sessionData,
    couldNotRetrieveSessionDataAlert// TODO global callback, should be removed!!
  );
  var sessionID = sessionObject.session_pubsign;
  // TODO: check server public signing of incoming object
  // DEBUG: alert('Incoming object: '+JSON.stringify(session_object)); // works!
  var serverSessionPubKey = nacl.from_hex(sessionObject.server_pubkey);
  var clientSessionSecKey = nacl.from_hex(sessionObject.session_seckey);
  // calculate current session nonce from nonce1 + nonce2 + step
  var nonce1Dec = new Decimal(hex2dec.toDec(sessionObject.nonce1));
  var nonce2Dec = new Decimal(hex2dec.toDec(sessionObject.nonce2));
  var stepDec = new Decimal(step);
  // added using decimal-light plus function for looooong decimals
  var nonceConstr = nonce1Dec.plus(nonce2Dec).plus(stepDec).toDecimalPlaces(64);
  // convert nonce_construct integer string back into hex
  var nonceConvert = hex2dec.toHex(nonceConstr.toFixed(0).toString());
  var nonceConhex = nonceConvert.substr(2, nonceConvert.length);
  var sessionNonce = nacl.from_hex(nonceConhex);

  return {
    sessionID,
    clientSessionSecKey,
    serverSessionPubKey,
    sessionNonce
  };
};

function couldNotRetrieveSessionDataAlert () {
  console.log('Error: Could not retrieve session data.');
}

module.exports = {
  path, // formaliy ychan
  obj,
  decode_sub,
  decode,
  encode_sub,
  encode,
  getGeneralSessionData
};
