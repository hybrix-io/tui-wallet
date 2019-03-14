var basex = require('base-x');
// replace multiple strings
// example: replacebulk("testme",['es','me'],['1','2']); => "t1t2"
function replaceBulk (str, findArray, replaceArray) {
  var i; var regex = []; var map = {};
  for (i = 0; i < findArray.length; i++) {
    regex.push(findArray[i].replace(/([-[\]{}()*+?.\\^$|#,])/g, '\\$1'));
    map[findArray[i]] = replaceArray[i];
  }
  regex = regex.join('|');
  str = str.replace(new RegExp(regex, 'g'), function (matched) {
    return map[matched];
  });
  return str;
}

function asciitable () {
  var x = '';
  for (var i = 0; i < 256; i++) { x = x + String.fromCharCode(i); }
  return x;
}

function recode (source, target, input) {
  var BASE = function (val) {
    var out;
    switch (val) {
      case 2: out = '01'; break;
      case 8: out = '01234567'; break;
      case 10: out = '0123456789'; break;
      case 16: out = '0123456789abcdef'; break;
      case 58: out = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; break;
      case 256: out = asciitable(); break;
      case 'RFC4648': out = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; break;
    }
    return out;
  };
  if (typeof target === 'undefined') { target = source; source = BASE(256); }
  switch (source) {
    case 'base58':
      input = input.replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
      source = BASE(58);
      break;
    case 'hex':
      source = BASE(16);
      if (input.substring(0, 2) === '0x') { input = input.substring(2); }
      input = input.toLowerCase().replace(/[^0-9a-f]/g, '');
      break;
    case 'dec':
      input = input.replace(/[^0-9]/g, '');
      source = BASE(10);
      break;
    case 'oct':
      input = input.replace(/[^0-7]/g, '');
      source = BASE(8);
      break;
    case 'bin':
      input = input.replace(/[^0-1]/g, '');
      source = BASE(2);
      break;
    default:
      if (source === 'ascii' || source === 'utf-8' || source === 'utf8') { source = BASE(256); }
      if (source === 'bech32' || source === 'RFC4648') {
        input = replaceBulk(input.toUpperCase(), ['0', '1', '8', '9'], ['O', 'I', 'B', 'G']).replace(/[^A-Z2-7]/g, '');
        source = BASE('RFC4648');
      }
      break;
  }
  switch (target) {
    case 'base58': target = BASE(58); break;
    case 'hex': target = BASE(16); break;
    case 'dec': target = BASE(10); break;
    case 'oct': target = BASE(8); break;
    case 'bin': target = BASE(2); break;
    default:
      if (target === 'ascii' || target === 'utf-8' || target === 'utf8') { target = BASE(256); }
      if (target === 'bech32' || target === 'RFC4648') { target = BASE('RFC4648'); }
      if (!target) { target = BASE(256); }
      break;
  }
  var output = new Buffer(basex(target).encode(new Buffer(basex(source).decode(input)))).toString();
  return output;
}

exports.recode = recode;
