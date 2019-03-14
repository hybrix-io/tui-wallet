var UrlBase64 = require('./crypto/urlbase64');
var sjcl = require('./crypto/sjcl');
var DJB2 = require('./crypto/hashDJB2');
var base32ToHex = require('./crypto/hex2base32').base32ToHex;

function clean (dirty) {
  if (typeof dirty !== 'undefined') {
    var dirty_str = dirty.toString();
    var clean_str = dirty_str.replace(/[^A-Za-z0-9]/g, '');
  } else { clean_str = ''; }
  return clean_str;
}

// returns array of double public/secret keypairs
// one for encrypting (boxPk/boxSk) and one for signing (signPk/signSk)
function generateKeys (secret, salt, position) {
  // normalise strings with stringtolower and stringtoupper
  // alert(secret.toUpperCase()+'/'+salt.toLowerCase());

  // Key Seed I
  // create bitArrays from secret and salt
  var secr_ba = sjcl.codec.utf8String.toBits(secret.toUpperCase());
  var salt_ba = sjcl.codec.utf8String.toBits(salt.toLowerCase());
  // use pbkdf2 to calculate key_seed (64 * 4 bytes = 256 bits = 32 bytes)
  var key_seed1 = sjcl.misc.pbkdf2(secr_ba, salt_ba, 5000 + position, 4096, false);

  // Key Seed II
  // reverse secret upper case + upper case salt
  var rsecret = secret.toUpperCase().split('').reverse().join('');
  // create bitArrays from reverse secret
  var rsecr_ba = sjcl.codec.utf8String.toBits(rsecret);
  var usalt_ba = sjcl.codec.utf8String.toBits(salt.toUpperCase());
  // use pbkdf2 to calculate key_seed (64 * 4 bytes = 256 bits = 32 bytes)
  var key_seed2 = sjcl.misc.pbkdf2(rsecr_ba, usalt_ba, 5000 + position, 4096, false);

  // use two seeds to generate master key seed
  var key_seed3 = sjcl.misc.pbkdf2(key_seed1, key_seed2, 5000 + position, 4096, false);
  var key_seed_str3 = sjcl.codec.hex.fromBits(key_seed3);
  // DEBUG alert(key_seed_str3+'['+key_seed_str3.length+']');
  var final_key_seed = nacl.from_hex(key_seed_str3);
  // create user master key
  var new_key = nacl.crypto_box_keypair_from_seed(final_key_seed);
  // animation possible here
  return new_key;
}

function seedGenerator (user_keys, asset) {
  // this salt need not be too long (if changed: adjust slice according to tests)
  var salt = '1nT3rN3t0Fc01NsB1nD5tH3cRyPt05Ph3R3t093Th3Rf0Rp30Pl3L1k3M34nDy0U';
  // slightly increases entropy by XOR obfuscating and mixing data with a key
  function xorEntropyMix (key, str) {
    var c = '';
    var k = 0;
    for (var i = 0; i < str.length; i++) {
      c += String.fromCharCode(str[i].charCodeAt(0).toString(10) ^ key[k].charCodeAt(0).toString(10)); // XORing with key
      k++;
      if (k >= key.length) { k = 0; }
    }
    return c;
  }
  // return deterministic seed  GL.usercrypto.
  return UrlBase64.Encode(xorEntropyMix(nacl.to_hex(user_keys.boxPk), xorEntropyMix(asset.split('.')[0], xorEntropyMix(salt, nacl.to_hex(user_keys.boxSk))))).slice(0, -2);
}

function activate (code) {
  try {
    eval('window.deterministic = (function(){})(); ' + code); // interpret deterministic library into an object
    return window.deterministic;
  } catch (e) {
    return null;
  }
}

function sessionStep1Reply (data, sessionData, cb) {
  // PROCESS REPLY TO SESSION_STEP 1 REQUEST
  // do something with the returning server_session_pubkey
  // server-side structure of packet:
  //    var sign_hex = {server_sign_pubkey:server_sign_pubkey,server_session_pubkey:server_session_pubkey,current_nonce:current_nonce};
  //    var crypt_hex = nacl.to_hex( nacl.crypto_box(sign_hex,current_nonce,client_session_pubkey,server_session_seckey) );
  //    xresponse = {error:0,server_sign_pubkey:server_sign_pubkey,server_session_pubkey:server_session_pubkey,current_nonce:current_nonce,crhex:crypt_hex};
  if (DEBUG) { console.log('Hello JSON:' + JSON.stringify(data)); }

  var server_sign_binkey = nacl.from_hex(clean(data.server_sign_pubkey));
  var server_session_binkey = nacl.from_hex(clean(data.server_session_pubkey));
  var current_nonce = nacl.from_hex(clean(data.current_nonce));

  if (DEBUG) { console.log('nonce:' + data.current_nonce); }

  var crypt_bin = nacl.from_hex(clean(data.crhex));
  try {
    var crypt_pack = nacl.crypto_box_open(crypt_bin, current_nonce, server_session_binkey, sessionData.session_keypair.boxSk);
    if (DEBUG) { console.log('Cryptstr:' + JSON.stringify(crypt_pack)); }

    var crypt_str = nacl.to_hex(crypt_pack);
    if (DEBUG) { console.log('Crypt hexstr:' + JSON.stringify(crypt_str)); }

    // perform sign check here!
    var sign_bin = nacl.from_hex(clean(crypt_str));
    var sign_pack = nacl.crypto_sign_open(sign_bin, server_sign_binkey);
    var sign_str = nacl.decode_utf8(sign_pack);

    var sign_vars = JSON.parse(sign_str);

    if (DEBUG) { console.log('PAYLOAD:' + JSON.stringify(crypt_str)); console.log('SIGNLOAD:' + JSON.stringify(sign_str)); }
    // check for server sign, session and nonce values within and without of crypt packet so as to associate the two public keys without a shadow of doubt
    if (
      sign_vars.server_sign_pubkey === data.server_sign_pubkey &&
        sign_vars.server_session_pubkey === data.server_session_pubkey &&
        sign_vars.current_nonce === data.current_nonce
    ) {
      // if we are here, signed internal datapacket crhex checks out with open values

      var key_array = {
        'nonce': sessionData.session_nonce,
        'nonce1': sessionData.nonce1_hex,
        'nonce2': sessionData.nonce2_hex,
        'nonce_combi': sign_vars.current_nonce,
        'session_secsign': sessionData.session_secsign,
        'session_seckey': sessionData.session_seckey,
        'session_pubsign': sessionData.session_hexsign,
        'session_pubkey': sessionData.session_hexkey,
        'server_pubsign': sign_vars.server_sign_pubkey,
        'server_pubkey': sign_vars.server_session_pubkey
      };

      var sess_bin = nacl.encode_utf8(JSON.stringify(key_array));

      if (DEBUG) { console.log('Raw session_data: ' + JSON.stringify(key_array)); }

      var sess_response = nacl.crypto_box(sess_bin, current_nonce, sessionData.userKeys.boxPk, sessionData.userKeys.boxSk);
      var sess_hex = nacl.to_hex(sess_response);

      if (typeof cb === 'function') { cb(sess_hex); }
      return {
        sess_hex: sess_hex,
        current_nonce: current_nonce
      };
    }
  } catch (e) {
    console.error(JSON.stringify(e));
  }
}

function readSession (userKeys, nonce, sessionData, onError) {
  if (sessionData === null) {
    onError();
  }
  // decrypt session data (so that it does not lie around but is only 'known' upon decrypt)
  var sess_bin = nacl.from_hex(sessionData);

  // user's session nonce is used for session_data
  var session_data = nacl.crypto_box_open(sess_bin, nonce, userKeys.boxPk, userKeys.boxSk);

  var session_string = nacl.decode_utf8(session_data);
  return JSON.parse(session_string);
}

function generateInitialSessionData (nonce) {
  // post session_pubkey to server + receive server_pubkey back
  // generate random session_seed
  var session_seed = nacl.random_bytes(4096);
  // generate new session keypair
  var session_keypair = nacl.crypto_box_keypair_from_seed(session_seed);
  // generate new session signpair
  var session_sign_seed = nacl.crypto_hash_sha256(session_seed);
  var session_signpair = nacl.crypto_sign_keypair_from_seed(session_sign_seed);
  // convert nonce to hex representation for urlsafe transport
  var session_nonce = nacl.to_hex(nonce);
  // convert pubkeys to hex representation for urlsafe transport
  var session_hexkey = nacl.to_hex(session_keypair.boxPk);
  var session_hexsign = nacl.to_hex(session_signpair.signPk);
  // convert seckeys to hex for storage in key_array
  var session_seckey = nacl.to_hex(session_keypair.boxSk);
  var session_secsign = nacl.to_hex(session_signpair.signSk);

  if (DEBUG) { console.log('session_seed:' + session_seed + '(' + session_seed.length + ')'); }
  if (DEBUG) { console.log('session_hexkey:' + session_hexkey + '(' + session_hexkey.length + ')'); }
  if (DEBUG) { console.log('session_sign_seed:' + session_sign_seed + '(' + session_sign_seed.length + ')'); }
  if (DEBUG) { console.log('session_hexsign:' + session_hexsign + '(' + session_hexsign.length + ')'); }

  return {
    session_hexkey: session_hexkey,
    session_hexsign: session_hexsign,
    session_keypair: session_keypair,
    session_nonce: session_nonce,
    session_seckey: session_seckey,
    session_secsign: session_secsign,
    session_signpair: session_signpair
  };
}

function generateSecondarySessionData (nonce1, sessionHexKey, signSk) {
  var nonce2 = nacl.crypto_box_random_nonce();
  var nonce2_hex = nacl.to_hex(nonce2);
  // change first character to 0-7 if it is 8,9,a-f to keep sum nonce within 32 bytes
  var nonce2_hex = nonce2_hex.replace(/^[8-9a-f]/, function (match) { var range = ['8', '9', 'a', 'b', 'c', 'd', 'e', 'f']; return range.indexOf(match); });
  var nonce1_hex = clean(nonce1);
  var nonce1_hex = nonce1_hex.replace(/^[8-9a-f]/, function (match) { var range = ['8', '9', 'a', 'b', 'c', 'd', 'e', 'f']; return range.indexOf(match); });
  var secrets_json = {
    'nonce1': nonce1_hex,
    'nonce2': nonce2_hex,
    'client_session_pubkey': sessionHexKey
  };

  var session_secrets = JSON.stringify(secrets_json);

  // using signing method to prevent in transport changes
  var crypt_bin = nacl.encode_utf8(session_secrets);

  var crypt_response = nacl.crypto_sign(crypt_bin, signSk);
  var crypt_hex = nacl.to_hex(crypt_response);

  if (DEBUG) { console.log('CR:' + crypt_hex); }

  return {
    nonce1_hex: nonce1_hex,
    nonce2_hex: nonce2_hex,
    crypt_hex: crypt_hex
  };
}

// THIS KEEPS ON CHECKING UNTIL ALL CALLS AND SESSION STEPS ARE BEING PROCESSED AND SESSIONWATCH IS NOT EMPTY.
// TODO: CPS????
function continueSession (user_keys, nonce, userid, getSessionWatch, cb) {
  var sessionWatch = getSessionWatch(); // THIS CHECKS IF DATA HAS BEEN ATTRIBUTED TO SOME ELEMENT IN DOM
  if (sessionWatch === '') {
    setTimeout(function () { continueSession(user_keys, nonce, userid, getSessionWatch, cb); }, 1000);
  } else {
    cb(); // IF SO, RUN CALLBACK, WHICH SHOULD FETCH THE DASHBOARD VIEW
  }
}

function nextStep () {
  // function to prevent mis-stepping by concurrent step calls
  var current_session = session_step;
  session_step++;
  return current_session + 1;
}

function increaseSessionStep (step) {
  return step + 1;
}

function validatePasswordLength (pass) {
  return typeof pass === 'string' && (pass.length === 16 || pass.length === 48);
}

function validateUserIDLength (userid) {
  return typeof userid === 'string' && userid.length === 16;
}

function validateUseridForLegacyWallets (userID) {
  var hxid = base32ToHex(userID).toUpperCase();
  var hxidSubStr = hxid.substr(12, 4);
  var hxidHash = DJB2.hash(hxid.substr(0, 12)).substr(0, 4);
  return hxidHash === hxidSubStr;
}

function validatePassForLegacyWallets (userID, pass) {
  if (userID === pass) { return false; }
  var hxid = base32ToHex(userID).toLowerCase();
  var passwordUpperCase = pass.toUpperCase();
  var hxidSubStr = hxid.substr(16, 4).toUpperCase();
  var hxidHash = DJB2.hash(hxid.substr(0, 12) + passwordUpperCase).substr(4, 4);
  return hxidHash === hxidSubStr;
}

exports.commonUtils = {
  activate,
  clean,
  continueSession,
  generateKeys,
  generateInitialSessionData,
  generateSecondarySessionData,
  increaseSessionStep,
  nextStep,
  readSession,
  seedGenerator,
  sessionStep1Reply,
  validatePasswordLength,
  validateUserIDLength,
  validateUseridForLegacyWallets,
  validatePassForLegacyWallets

};

if (typeof module !== 'undefined') {
  module.exports = exports.commonUtils;
}
