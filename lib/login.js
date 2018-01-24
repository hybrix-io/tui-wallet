// login functions
exports.login = login

var sjcl = require('./crypto/sjcl.js');

function login (userid,passcode) {
  // instantiate nacl
  // DONE IN MAIN: nacl = nacl.instantiate();
  var nonce = nacl.crypto_box_random_nonce();
  var user_keys = generate_keys(passcode,userid, 0);
  var user_pubkey = nacl.to_hex(user_keys.boxPk);
  //DEBUG: console.log('user_pubkey:'+user_pubkey+'('+user_pubkey.length+')/nonce:'+nonce);
  do_login(user_keys,nonce);
  continue_session(user_keys,nonce,userid);
}

function do_login(user_keys,nonce) {
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

  //DEBUG console.log('session_seed:'+session_seed+'('+session_seed.length+')');
  //DEBUG console.log('session_hexkey:'+session_hexkey+'('+session_hexkey.length+')');
  //DEBUG console.log('session_sign_seed:'+session_sign_seed+'('+session_sign_seed.length+')');
  //DEBUG console.log('session_hexsign:'+session_hexsign+'('+session_hexsign.length+')');

  // animation: dial_login(1);
  // posts to server under session pub key
  najax({
    url: nodepath+'x/'+session_hexsign+'/'+session_step,
    dataType: 'json'
  })
    .done(function(data) {
      // receive nonce1 back
      if ( clean(data.nonce1).length == 48 )	{
        session_step++; // next step, hand out nonce2
	var nonce2 = nacl.crypto_box_random_nonce();
	var nonce2_hex = nacl.to_hex(nonce2);
	// change first character to 0-7 if it is 8,9,a-f to keep sum nonce within 32 bytes
	var nonce2_hex = nonce2_hex.replace(/^[8-9a-f]/,function(match){var range=['8','9','a','b','c','d','e','f']; return range.indexOf(match);});
	var nonce1_hex = clean(data.nonce1);
	var nonce1_hex = nonce1_hex.replace(/^[8-9a-f]/,function(match){var range=['8','9','a','b','c','d','e','f']; return range.indexOf(match);});
	var secrets_json = { 'nonce1':nonce1_hex, 'nonce2':nonce2_hex, 'client_session_pubkey':session_hexkey };
	var session_secrets = JSON.stringify(secrets_json);

	// using signing method to prevent in transport changes
	var crypt_bin = nacl.encode_utf8(session_secrets);
	var crypt_response = nacl.crypto_sign(crypt_bin,session_signpair.signSk);
	var crypt_hex = nacl.to_hex(crypt_response);

	//DEBUG console.log('CR:'+crypt_hex);
	najax({
	  url: nodepath+'x/'+session_hexsign+'/'+session_step+'/'+crypt_hex,
	  dataType: 'json',
        })
    	  .done(function(data) {

    	    // PROCESS REPLY TO SESSION_STEP 1 REQUEST
            // dial_login(2);
            // do something with the returning server_session_pubkey
            // server-side structure of packet:
            //    var sign_hex = {server_sign_pubkey:server_sign_pubkey,server_session_pubkey:server_session_pubkey,current_nonce:current_nonce};
            //    var crypt_hex = nacl.to_hex( nacl.crypto_box(sign_hex,current_nonce,client_session_pubkey,server_session_seckey) );
            //    xresponse = {error:0,server_sign_pubkey:server_sign_pubkey,server_session_pubkey:server_session_pubkey,current_nonce:current_nonce,crhex:crypt_hex};
            //DEBUG
            console.log("Hello JSON:"+JSON.stringify(data)); // works

            var server_sign_binkey = nacl.from_hex(clean(data.server_sign_pubkey));
            var server_session_binkey = nacl.from_hex(clean(data.server_session_pubkey));
            var current_nonce = nacl.from_hex(clean(data.current_nonce));

            //DEBUG console.log("nonse:"+data.current_nonce); // works

            var crypt_bin = nacl.from_hex(clean(data.crhex));
            var crypt_pack = nacl.crypto_box_open(crypt_bin,current_nonce,server_session_binkey,session_keypair.boxSk);
            //DEBUG console.log("Cryptstr:"+JSON.stringify(crypt_pack)); // works!

            var crypt_str = nacl.to_hex(crypt_pack);
            //DEBUG console.log("Crypt hexstr:"+JSON.stringify(crypt_str)); // works!

            // perform sign check here!
            var sign_bin = nacl.from_hex(clean(crypt_str));
            var sign_pack = nacl.crypto_sign_open(sign_bin,server_sign_binkey);
            var sign_str = nacl.decode_utf8(sign_pack);

            var sign_vars = JSON.parse(sign_str);

            //DEBUG
            console.log('PAYLOAD:'+JSON.stringify(crypt_str)); // works!
            console.log('SIGNLOAD:'+JSON.stringify(sign_str)); // works!

            // check for server sign, session and nonce values within and without of crypt packet so as to associate the two public keys without a shadow of doubt
            if (
              sign_vars.server_sign_pubkey === data.server_sign_pubkey &&
                sign_vars.server_session_pubkey === data.server_session_pubkey &&
                sign_vars.current_nonce === data.current_nonce
            ) {
              // if we are here, signed internal datapacket crhex checks out with open values

              var key_array = {'nonce':session_nonce,'nonce1':nonce1_hex,'nonce2':nonce2_hex,'nonce_combi':sign_vars.current_nonce,
	                       'session_secsign':session_secsign,'session_seckey':session_seckey,
	                       'session_pubsign':session_hexsign,'session_pubkey':session_hexkey, 'server_pubsign':sign_vars.server_sign_pubkey,'server_pubkey':sign_vars.server_session_pubkey};

	      var sess_bin = nacl.encode_utf8(JSON.stringify(key_array));

	      //DEBUG:
	      console.log('Raw session_data: '+JSON.stringify(key_array));

	      var sess_response = nacl.crypto_box(sess_bin,nonce,user_keys.boxPk,user_keys.boxSk);
	      var sess_hex = nacl.to_hex(sess_response);
              GL.sessiondata = sess_hex;
            }
          });
      }
    });
}

next_step = function() {
  // function to prevent mis-stepping by concurrent step calls
  var current_session = session_step;
  session_step++;
  return current_session+1;
}

read_session = function(user_keys,nonce) {
  if(GL.sessiondata === null) {
    console.log('Error: Cannot set up encrypted session. Please check your connectivity!')
    process.exit(404);
  }
  // decrypt session data (so that it does not lie around but is only 'known' upon decrypt)
  var sess_bin = nacl.from_hex(GL.sessiondata);
  // user's session nonce is used for session_data
  var session_data = nacl.crypto_box_open(sess_bin,nonce,user_keys.boxPk,user_keys.boxSk);
  var session_string = nacl.decode_utf8(session_data);

  return JSON.parse(session_string);
}

function continue_session(user_keys,nonce,userid) {
  if ( GL.sessiondata === '' ) {
    setTimeout( function() { continue_session(user_keys,nonce,userid); }, 1000 );
  } else {
    // use read_session(user_keys,nonce) to read out session variables
    // DEBUG: console.log(read_session(user_keys,nonce));  // it works!
    // forward to the interface, session for the user starts
    setTimeout(function() { // added extra time to avoid forward to interface before x authentication completes!
      //console.log({'user_keys':user_keys,'nonce':nonce,'userid':userid});
      GL.session = {'user_keys':user_keys,'nonce':nonce,'userid':userid};
    }, 5000 );
  }
}

function generate_keys(secret, salt, position) {
  // we normalise strings with stringtolower and stringtoupper

  // Key Seed I
  // create bitArrays from secret and salt
  var secr_ba = sjcl.codec.utf8String.toBits(secret.toUpperCase());
  var salt_ba = sjcl.codec.utf8String.toBits(salt.toLowerCase());
  // use pbkdf2 to calculate key_seed (64 * 4 bits per hex char = 256 bits = 32 bytes)
  var key_seed1 = sjcl.misc.pbkdf2(secr_ba,salt_ba,5000+position,4096,false);

  // Key Seed II
  // reverse secret upper case + upper case salt
  var rsecret = secret.toUpperCase().split("").reverse().join("");
  // create bitArrays from reverse secret
  var rsecr_ba = sjcl.codec.utf8String.toBits(rsecret);
  var usalt_ba = sjcl.codec.utf8String.toBits(salt.toUpperCase());
  // use pbkdf2 to calculate key_seed
  var key_seed2 = sjcl.misc.pbkdf2(rsecr_ba,usalt_ba,5000+position,4096,false);

  // use two seeds to generate master key seed
  var key_seed3 = sjcl.misc.pbkdf2(key_seed1,key_seed2,5000+position,4096,false);
  var key_seed_str3 = sjcl.codec.hex.fromBits(key_seed3);
  // DEBUG alert(key_seed_str3+'['+key_seed_str3.length+']');
  var final_key_seed = nacl.from_hex(key_seed_str3);

  // create new key
  var new_key = nacl.crypto_box_keypair_from_seed(final_key_seed);

  return new_key;
}

function clean(dirty) {
  if(typeof dirty!=='undefined') {
    var dirty_str = dirty.toString();
    var clean_str = dirty_str.replace(/[^A-Za-z0-9]/g,'');
  } else { clean_str = ''; }
  return clean_str;
}
