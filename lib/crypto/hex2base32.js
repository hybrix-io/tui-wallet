function hexToBase32(inputval) {
  // define rfc4648 alphabet array (32 bits)
  var RFC4648 = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7'];
 
  // clean input value to accept only valid hex strings
  var inputstr = inputval.toString();
  inputstr = inputstr.toUpperCase();
  inputstr = inputstr.replace(/[^A-F0-9]/g,'');
 
  var bitstr = '';
  // create string of bits out of hexstring
  for ( var cnt=0; cnt<inputstr.length; cnt++ ) {
    var bitint = parseInt(inputstr[cnt],16);
   
    //DEBUG console.log(bitint+'/'+bitint.toString(2));

    // hex values must be zero padded to four bits each
    bitprt = bitint.toString(2);
   
    // first check whether bitstr length is 4 and prefix zero's if not
    var addzeros = 4 - bitprt.length;
 
    for ( var dnt=0; dnt<addzeros; dnt++ ) {
      bitprt = "0"+bitprt;
    }
   
    bitstr = bitstr + bitprt;   
   
  }
 
  // convert bitstr to rfc4648 per 5 bits
 
  // first check whether bitstr length is multiple of 5 and prefix zero's if not
  var remainder = bitstr.length % 5;
  var addzeros = 5 - remainder
 
  // do not add five zero's padding
  if ( addzeros == 5 ) { addzeros = 0; }
 
  for ( var cnt=0; cnt<addzeros; cnt++ ) {
    bitstr = "0"+bitstr;
  }
     
  //DEBUG console.log( bitstr+'/'+bitstr.length+'/'+remainder );

  // process bitstring per five bits
  var startpos = 0;
  var endpos = 5;
  var base32str = '';
 
  for ( var cnt=0; cnt<(bitstr.length/5); cnt++ ) {
    var bitpart = bitstr.substring(startpos+(cnt*5),endpos+(cnt*5));
    base32str += RFC4648[parseInt(bitpart,2)];
    //DEBUG console.log( RFC4648[parseInt(bitpart,2)]+'/'+bitpart );
  }
   
  return base32str;
 
}


function base32ToHex(inputval) {
 
  // define rfc4648 alphabet array (32 bits)
  var RFC4648 = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7'];
  var HEX = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F' ];
 
  // clean input value to accept only valid rfc4648
  var inputstr = inputval.toString();
  inputstr = inputstr.toUpperCase();
  inputstr = inputstr.replace(/[^A-Z2-7]/g,'');

  var bitstr = '';

  // create string of bits out of rfc4648 string
  for ( var cnt=0; cnt<inputstr.length; cnt++ ) {
    var bitint = RFC4648.indexOf(inputstr[cnt]);
    var bitbit = bitint.toString(2);
   
    // add leading zeros to five bit length
    var remainder = 5 - bitbit.length;
   
    for ( var dnt=0; dnt<remainder; dnt++ ) {
      bitbit = "0"+bitbit;
    }
   
    //DEBUG console.log(bitint+'/'+bitbit);

    bitstr = bitstr + bitbit;
  
  } // end of bitstring creation
 
  //DEBUG console.log("before zero-remove:"+bitstr);
 
  // first check whether bitstr length is multiple of 4 and remove prefixed zero's if not
  var remainder = bitstr.length % 4;
  var remzeros = 4 - remainder;
 
  // do not remove if remzeros is four
  if ( remzeros == 4 ) { remzeros = 0; }
 
  // remove prefixed zeros  
  for ( var cnt=0; cnt<remzeros; cnt++ ) {
    if ( bitstr.startsWith('0') ) {
      bitstr = bitstr.substring(1);
    }
  }

  //DEBUG console.log("after zero-remove:"+bitstr);
 
  // process bitstring per four bits
  var startpos = 0;
  var endpos = 4;
  var hexstr = '';
 
  for ( var cnt=0; cnt<(bitstr.length/4); cnt++ ) {
    var bitpart = bitstr.substring(startpos+(cnt*4),endpos+(cnt*4));
    var hexint = parseInt(bitpart,2);
    //DEBUG console.log( hexint );

    // convert to hex
    hexstr = hexstr + HEX[hexint];
       
    //DEBUG console.log( hexstr+'/'+bitpart );
  }
 
  return hexstr;
 
}
