  // ychan encrypts an API query before sending it to the router
  ychan = function(usercrypto,step,txtdata) {
    // decodes only from UrlBase64 for now, must be real usercrypto!
    var encdata = ychan_encode(usercrypto,step,txtdata)
    return 'y/'+encdata;
  }

  ychan_obj = function(usercrypto,step,encdata) {
    return JSON.parse(ychan_decode(usercrypto,step,encdata));
  }

  ychan_encode = function(usercrypto,step,txtdata) {
    // fetch relevant info from #session_data
    var session_object = read_session(usercrypto.user_keys,usercrypto.nonce);
    var sessionid = session_object.session_pubsign;
    // alert('Session object: '+JSON.stringify(session_object)); // works!
    var server_session_pubkey = nacl.from_hex(session_object.server_pubkey);
    var client_session_seckey = nacl.from_hex(session_object.session_seckey);
    // calculate current session nonce from nonce1 + nonce2 + step
    var nonce1_dec = new Decimal(hex2dec.toDec(session_object.nonce1));
    var nonce2_dec = new Decimal(hex2dec.toDec(session_object.nonce2));
    var step_dec = new Decimal(step);			    
    // added using decimal-light plus function for looooong decimals
    var nonce_constr = nonce1_dec.plus(nonce2_dec).plus(step_dec).toDecimalPlaces(64);
    // convert nonce_construct integer string back into hex
    var nonce_convert = hex2dec.toHex( nonce_constr.toFixed(0).toString() );
    var nonce_conhex = nonce_convert.substr(2,nonce_convert.length);
    // DEBUG: alert('Nonce conhex: '+nonce_conhex+' Text data: '+txtdata);
    var session_nonce = nacl.from_hex( nonce_conhex ); 
    var crypt_utf8 = nacl.encode_utf8(txtdata);			  
    // use nacl to create a crypto box containing the data         
    var crypt_bin = nacl.crypto_box(crypt_utf8, session_nonce, server_session_pubkey, client_session_seckey);          
    var encdata = nacl.to_hex(crypt_bin);
    // DEBUG: console.log(sessionid+'/'+step+'/'+encdata); // this seems to work properly	
    return sessionid+'/'+step+'/'+UrlBase64.safeCompress(encdata);
  }

  ychan_decode = function(usercrypto,step,encdata) {
    if(encdata==null) {
      txtdata=null;
    } else {
      // decompress the data into a hex string
      encdata = UrlBase64.safeDecompress(encdata);	
      // fetch relevant info from #session_data
      var session_object = read_session(usercrypto.user_keys,usercrypto.nonce);
      // TODO: check server public signing of incoming object
      // DEBUG: alert('Incoming object: '+JSON.stringify(session_object)); // works!
      var server_session_pubkey = nacl.from_hex(session_object.server_pubkey);
      var client_session_seckey = nacl.from_hex(session_object.session_seckey);
      // calculate current session nonce from nonce1 + nonce2 + step
      var nonce1_dec = new Decimal(hex2dec.toDec(session_object.nonce1));
      var nonce2_dec = new Decimal(hex2dec.toDec(session_object.nonce2));
      var step_dec = new Decimal(step);			    
      // added using decimal-light plus function for looooong decimals
      var nonce_constr = nonce1_dec.plus(nonce2_dec).plus(step_dec).toDecimalPlaces(64);
      // convert nonce_construct integer string back into hex
      var nonce_convert = hex2dec.toHex(nonce_constr.toFixed(0).toString());
      var nonce_conhex = nonce_convert.substr(2,nonce_convert.length);
      var session_nonce = nacl.from_hex(nonce_conhex); 
      //DEBUG: alert('Ychan decode enc data: '+JSON.stringify(encdata));
      // TODO: add check for encdata.error:0?
      var hexdata = encdata;
      // DEBUG: alert('Ychan decode nonce conhex: '+nonce_conhex+' Hex data: '+hexdata);
      if(hexdata!=null) {
        var crypt_hex = nacl.from_hex(hexdata);
        // use nacl to create a crypto box containing the data         
        var crypt_bin = nacl.crypto_box_open(crypt_hex, session_nonce, server_session_pubkey, client_session_seckey);          
        var txtdata = nacl.decode_utf8(crypt_bin);
      } else { txtdata = null; }
    }
    return txtdata;
  }

  //zchan
  // zchan compresses an API query before sending it to the router
  // usercryptography is handled by ychan, and keys are passed
  zchan = function(usercrypto,step,txtdata) {
    var encdata = ychan_encode(usercrypto,step,zchan_encode(usercrypto,step,txtdata));
    return 'z/'+encdata;
  }
  zchan_obj = function(usercrypto,step,encdata) {
    try {
      return JSON.parse(zchan_decode(usercrypto,step,encdata));
    } catch(err) {
      return false;
    }					
  }
  zchan_encode = function(usercrypto,step,txtdata) {			  				  
    return LZString.compressToEncodedURIComponent(txtdata);
  }
  zchan_decode = function(usercrypto,step,encdata) {
    return LZString.decompressFromEncodedURIComponent(ychan_decode(usercrypto,step,encdata));
  }

  fromInt = function(input,factor) {
    var f = Number(factor);
    var x = new Decimal(String(input));
    return x.times((f>1?'0.'+new Array(f).join('0'):'')+'1');
  }

  toInt = function(input,factor) {
    var f = Number(factor);
    var x = new Decimal(String(input));
    return x.times('1'+(f>1?new Array(f+1).join('0'):''));
  }

  formatFloat = function(n) {
    return String(Number(n));
  }
  
  isToken = function(symbol) {
    return (symbol.indexOf('.')!==-1?1:0);
  }
  
  // activate (deterministic) code from a string
  activate = function(code) {
    if(typeof code == 'string') {
      // interpret deterministic library in a virtual DOM environment
      const { JSDOM } = jsdom;
      var dom = (new JSDOM('', { runScripts: "outside-only" })).window;
      dom.window.nacl = nacl; // inject NACL into virtual DOM
      dom.window.crypto = crypto; // inject nodeJS crypto to supersede crypto-browserify
      dom.window.logger = logger; // inject the logger function into virtual DOM
      dom.eval('var deterministic = (function(){})(); '+code+';'); // init deterministic code
      return dom.window.deterministic;
    } else {
      console.log('Cannot activate deterministic code!')
      return function(){};
    }
  }

  init_asset = function(entry,fullmode) {
    var mode = fullmode.split('.')[0];
    // if the deterministic code is already cached client-side
    if(typeof assets.modehashes[mode]!='undefined') {
      storage.Get(assets.modehashes[mode], function(dcode) {
        if(dcode) {
          deterministic = activate( LZString.decompressFromEncodedURIComponent(dcode) );
          assets.mode[entry] = fullmode;
          assets.seed[entry] = deterministic_seed_generator(entry);
          assets.keys[entry] = deterministic.keys( {'symbol':entry,'seed':assets.seed[entry]} );
          assets.addr[entry] = deterministic.address( assets.keys[entry] );
          var loop_step = next_step();
          hybriddcall({r:'a/'+entry+'/factor',c:GL.usercrypto,s:loop_step,z:0},0, function(object) { if(typeof object.data!='undefined') { assets.fact[entry]=object.data; } });
          var loop_step = next_step();
          hybriddcall({r:'a/'+entry+'/fee',c:GL.usercrypto,s:loop_step,z:0},0, function(object) { if(typeof object.data!='undefined') { assets.fees[entry]=object.data; } });
          var loop_step = next_step();
          hybriddcall({r:'a/'+entry+'/contract',c:GL.usercrypto,s:loop_step,z:0},0, function(object) { if(typeof object.data!='undefined') { assets.cntr[entry]=object.data; } });
          return true;
        } else {
          storage.Del(assets.modehashes[mode]);
        }
        // in case of no cache request code from server
        if(!dcode) { // || typeof assets.mode[entry]=='undefined') {
          hybriddcall({r:'s/deterministic/code/'+mode,z:0},null,
            function(object) {
              if(typeof object.error != 'undefined' && object.error == 0) {
                // decompress and make able to run the deterministic routine
                storage.Set(assets.modehashes[mode],object.data)
                deterministic = activate( LZString.decompressFromEncodedURIComponent(object.data) );
                assets.mode[entry] = fullmode; 
                assets.seed[entry] = deterministic_seed_generator(entry);
                assets.keys[entry] = deterministic.keys( {'symbol':entry,'seed':assets.seed[entry]} );
                assets.addr[entry] = deterministic.address( assets.keys[entry] );
                var loop_step = next_step();
                hybriddcall({r:'a/'+entry+'/factor',c:GL.usercrypto,s:loop_step,z:0},0, function(object) { if(typeof object.data!='undefined') { assets.fact[entry]=object.data; } });
                var loop_step = next_step();
                hybriddcall({r:'a/'+entry+'/fee',c:GL.usercrypto,s:loop_step,z:0},0, function(object) { if(typeof object.data!='undefined') { assets.fees[entry]=object.data; } });
                var loop_step = next_step();
                hybriddcall({r:'a/'+entry+'/contract',c:GL.usercrypto,s:loop_step,z:0},0, function(object) { if(typeof object.data!='undefined') { assets.cntr[entry]=object.data; } });
              }
            }
          );
          return true;
        }
      });
    }
  }
		
  // creates a unique seed for deterministic asset code
  function deterministic_seed_generator(asset) {
    // this salt need not be too long (if changed: adjust slice according to tests)
    var salt = '1nT3rN3t0Fc01NsB1nD5tH3cRyPt05Ph3R3t093Th3Rf0Rp30Pl3L1k3M34nDy0U';
    // slightly increases entropy by XOR obfuscating and mixing data with a key
    function xorEntropyMix(key, str) {
      var c = '';
      var k = 0;
      for(i=0; i<str.length; i++) {
        c += String.fromCharCode(str[i].charCodeAt(0).toString(10) ^ key[k].charCodeAt(0).toString(10)); // XORing with key
        k++;
        if(k>=key.length) {k=0;}
      }					
      return c;
    }
    // return deterministic seed
    return UrlBase64.Encode( xorEntropyMix( nacl.to_hex(GL.usercrypto.user_keys.boxPk), xorEntropyMix(asset.split('.')[0], xorEntropyMix(salt,nacl.to_hex(GL.usercrypto.user_keys.boxSk)) ) ) ).slice(0, -2);
  }


  // hybriddcall makes direct calls to hybridd, waits for the process,
  // and returns the data to your specified element in the DOM
  // 		- properties should be passed containing: URL, crypto-object, request method ychan or zchan (optional)
  // 		- passing the browser element to update is optional, or can be passed a 0, which is no element
  // 		- the function postfunction runs after a successful call to hybridd, while waitfunction runs regularly while the hybridd process is completing
  //progressbar = function(size) { return '<div class="progress-radial" proc-data=""'+(size>0?' style="font-size: '+size+'em;" size="'+size+'"':'')+'><div class="dot" style="'+(size>0?'width:'+size+'px;height:'+size+'px;"':'width:1em;height:1em;overflow:visible;"')+'"></div><svg style="margin-left:-'+(size>0?size+'px':'1em')+';" viewbox="0 0 80 80" height="120" width="120"><circle cx="40" cy="40" r="35" fill="rgba(255,255,255,0.0)" stroke="#BBB" stroke-width="10" stroke-dasharray="239" stroke-dashoffset="239" /></svg></div>'; }

  hybriddcall = function(properties,element,postfunction,waitfunction) {
    if(typeof properties.r == 'undefined') { 
      if(typeof this.vars.postfunction == 'function') {
        this.vars.postfunction({object:{properties:properties}});
      }
    }
    var urltarget = properties.r;	// URL or request
    var usercrypto = GL.usercrypto;	// crypto properties
    var step = next_step();		// rolling nonce step of crypto packet
    var reqmethod = (typeof properties.z != 'undefined' && !properties.z?0:1);
    if(!element) { element = '#NULL'; }
    // and fill the data using AJAX calls
    var urlrequest = nodepath+(reqmethod ? zchan(usercrypto,step,urltarget) : ychan(usercrypto,step,urltarget));
    var varsmain = {properties:properties,element:element,postfunction:postfunction,waitfunction:waitfunction};
    najax({url: urlrequest, timeout: 30000,
      success: function(encobject){
          var object = (reqmethod ? zchan_obj(usercrypto,step,encobject) : ychan_obj(usercrypto,step,encobject));
          if(object === false) {	// quick and dirty retry function for bad connections (TODO! OPTIMIZE!)
            logger('Retrying call no: '+step);
            hybriddcall(properties,element,postfunction,waitfunction);
          } else {
            if(object==null) { object={} }
            object.properties = properties;
            var element = this.vars.element;
            // we get back the processID in object.data
            //  now we load the proc and check if complete, else little animation
            if( typeof UI.text[element]!='undefined' && isNaN(UI.text[element].getText()) ) {
              spinnerStart(element);
            }
            hybriddproc(element,object,this.vars.postfunction,this.vars.waitfunction,0);
          }
        }.bind({vars:varsmain})
        , error: function(object){
          UI.text[element].setContent('[read error!]');
          if(typeof this.vars.postfunction == 'function') {
            var pass = (typeof this.vars.properties.pass!='undefined'?this.vars.properties.pass:null);
            this.vars.postfunction(object,pass);
          }
        }.bind({vars:varsmain})
    });

    // proc request helper function
    function hybriddproc(element,procobj,postfunction,waitfunction,cnt) {
      if(cnt) { if(cnt<10) { cnt++; } } else { cnt = 1; }
      var urltarget = procobj.properties.r;
      var usercrypto = GL.usercrypto;
      var proc_step = next_step();
      var reqmethod = (typeof procobj.properties.z != 'undefined' && !procobj.properties.z?0:1);
      if(typeof procobj.data != 'undefined') {
        var urlrequest = nodepath+(reqmethod ? zchan(usercrypto,proc_step,'p/'+procobj.data) : ychan(usercrypto,proc_step,'p/'+procobj.data));								
        var varsproc = {element:element,procobj:procobj,postfunction:postfunction,waitfunction:waitfunction,cnt:cnt};
        najax({url: urlrequest, timeout: 30000,
          success: function(result){
            var object = (reqmethod ? zchan_obj(usercrypto,proc_step,result) : ychan_obj(usercrypto,proc_step,result));
            if(typeof object != 'object') { object.progress = 0; }
            var cnt = this.vars.cnt;
            var element = this.vars.element;
            var procobj = this.vars.procobj;
            var postfunction = this.vars.postfunction;
            var waitfunction = this.vars.waitfunction;
            if(object.progress < 1 && object.stopped == null) {
              // check again in X milliseconds
              setTimeout( function(element,procobj,postfunction,waitfunction,cnt) { hybriddproc(element,procobj,postfunction,waitfunction,cnt); } ,(cnt*1000), element,procobj,postfunction,waitfunction,cnt);
              if(typeof waitfunction == 'function') {
                var pass = (typeof procobj.properties.pass!='undefined'?procobj.properties.pass:null);
                waitfunction(object,pass);
              }
            } else {
              // run postfunction
              if(typeof postfunction == 'function') {
                var pass = (typeof procobj.properties.pass!='undefined'?procobj.properties.pass:null);
                object = postfunction(object,pass);
              }
              // progress complete, fadeout progressbar if necessary, and fill the element with returned data
              if(typeof object=='undefined') { object = {}; }
              if(typeof object.data!='undefined') {
                if(object.data == null) { object.data = '?'; }
                if(object.data == 0) { object.data = '0'; }
              } else { object.data = '?' }
              if(typeof UI.text[element]!='undefined') {
                if( isNaN(UI.text[element].getText()) ) {
                  spinnerStop(element);
                }
                UI.text[element].setContent(object.data);
                screen.render();
              }
            }
          }.bind({vars:varsproc}),
          error: function(object){
            spinnerStop(element);
            UI.text[element].setContent('?');
            if(typeof this.vars.postfunction == 'function') {
              var pass = (typeof this.vars.properties.pass!='undefined'?this.vars.properties.pass:null);
              this.vars.postfunction(object,pass);
            }
          }.bind({vars:varsproc})
        });
      }
    }
  }				
