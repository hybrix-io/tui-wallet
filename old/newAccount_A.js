/*!
* Crypto-JS v2.5.4	Crypto.js
* http://code.google.com/p/crypto-js/
* Copyright (c) 2009-2013, Jeff Mott. All rights reserved.
* http://code.google.com/p/crypto-js/wiki/License
*/
if (typeof Crypto == "undefined" || !Crypto.util) {
  (function () {

    var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // Global Crypto object
    var Crypto = global.Crypto = {};

    // Crypto utilities
    var util = Crypto.util = {

      // Bit-wise rotate left
      rotl: function (n, b) {
        return (n << b) | (n >>> (32 - b));
      },

      // Bit-wise rotate right
      rotr: function (n, b) {
        return (n << (32 - b)) | (n >>> b);
      },

      // Swap big-endian to little-endian and vice versa
      endian: function (n) {

        // If number given, swap endian
        if (n.constructor == Number) {
          return util.rotl(n, 8) & 0x00FF00FF |
          util.rotl(n, 24) & 0xFF00FF00;
        }

        // Else, assume array and swap all items
        for (var i = 0; i < n.length; i++)
          n[i] = util.endian(n[i]);
        return n;

      },

      // Generate an array of any length of random bytes
      randomBytes: function (n) {
        for (var bytes = []; n > 0; n--)
          bytes.push(Math.floor(Math.random() * 256));
        return bytes;
      },

      // Convert a byte array to big-endian 32-bit words
      bytesToWords: function (bytes) {
        for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
          words[b >>> 5] |= (bytes[i] & 0xFF) << (24 - b % 32);
        return words;
      },

      // Convert big-endian 32-bit words to a byte array
      wordsToBytes: function (words) {
        for (var bytes = [], b = 0; b < words.length * 32; b += 8)
          bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
        return bytes;
      },

      // Convert a byte array to a hex string
      bytesToHex: function (bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
          hex.push((bytes[i] >>> 4).toString(16));
          hex.push((bytes[i] & 0xF).toString(16));
        }
        return hex.join("");
      },

      // Convert a hex string to a byte array
      hexToBytes: function (hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
          bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
      },

      // Convert a byte array to a base-64 string
      bytesToBase64: function (bytes) {
        for (var base64 = [], i = 0; i < bytes.length; i += 3) {
          var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
          for (var j = 0; j < 4; j++) {
            if (i * 8 + j * 6 <= bytes.length * 8)
              base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
            else base64.push("=");
          }
        }

        return base64.join("");
      },

      // Convert a base-64 string to a byte array
      base64ToBytes: function (base64) {
        // Remove non-base-64 characters
        base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");

        for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
          if (imod4 == 0) continue;
          bytes.push(((base64map.indexOf(base64.charAt(i - 1)) & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2)) |
              (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
        }

        return bytes;
      }

    };

    // Crypto character encodings
    var charenc = Crypto.charenc = {};

    // UTF-8 encoding
    var UTF8 = charenc.UTF8 = {

      // Convert a string to a byte array
      stringToBytes: function (str) {
        return Binary.stringToBytes(unescape(encodeURIComponent(str)));
      },

      // Convert a byte array to a string
      bytesToString: function (bytes) {
        return decodeURIComponent(escape(Binary.bytesToString(bytes)));
      }

    };

    // Binary encoding
    var Binary = charenc.Binary = {

      // Convert a string to a byte array
      stringToBytes: function (str) {
        for (var bytes = [], i = 0; i < str.length; i++)
          bytes.push(str.charCodeAt(i) & 0xFF);
        return bytes;
      },

      // Convert a byte array to a string
      bytesToString: function (bytes) {
        for (var str = [], i = 0; i < bytes.length; i++)
          str.push(String.fromCharCode(bytes[i]));
        return str.join("");
      }

    };

  })();
}



/*!
* Crypto-JS v2.5.4	SHA256.js
* http://code.google.com/p/crypto-js/
* Copyright (c) 2009-2013, Jeff Mott. All rights reserved.
* http://code.google.com/p/crypto-js/wiki/License
*/
(function () {

  // Shortcuts
  var C = Crypto,
    util = C.util,
    charenc = C.charenc,
    UTF8 = charenc.UTF8,
    Binary = charenc.Binary;

  // Constants
  var K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
        0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
        0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
        0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
        0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
        0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
        0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
        0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
        0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
        0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
        0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
        0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
        0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
        0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
        0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
        0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

  // Public API
  var SHA256 = C.SHA256 = function (message, options) {
    var digestbytes = util.wordsToBytes(SHA256._sha256(message));
    return options && options.asBytes ? digestbytes :
      options && options.asString ? Binary.bytesToString(digestbytes) :
      util.bytesToHex(digestbytes);
  };

  // The core
  SHA256._sha256 = function (message) {

    // Convert to byte array
    if (message.constructor == String) message = UTF8.stringToBytes(message);
    /* else, assume byte array already */

    var m = util.bytesToWords(message),
    l = message.length * 8,
    H = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
        0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19],
    w = [],
    a, b, c, d, e, f, g, h, i, j,
    t1, t2;

    // Padding
    m[l >> 5] |= 0x80 << (24 - l % 32);
    m[((l + 64 >> 9) << 4) + 15] = l;

    for (var i = 0; i < m.length; i += 16) {

      a = H[0];
      b = H[1];
      c = H[2];
      d = H[3];
      e = H[4];
      f = H[5];
      g = H[6];
      h = H[7];

      for (var j = 0; j < 64; j++) {

        if (j < 16) w[j] = m[j + i];
        else {

          var gamma0x = w[j - 15],
        gamma1x = w[j - 2],
        gamma0 = ((gamma0x << 25) | (gamma0x >>> 7)) ^
                    ((gamma0x << 14) | (gamma0x >>> 18)) ^
                    (gamma0x >>> 3),
        gamma1 = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                    ((gamma1x << 13) | (gamma1x >>> 19)) ^
                    (gamma1x >>> 10);

          w[j] = gamma0 + (w[j - 7] >>> 0) +
            gamma1 + (w[j - 16] >>> 0);

        }

        var ch = e & f ^ ~e & g,
      maj = a & b ^ a & c ^ b & c,
      sigma0 = ((a << 30) | (a >>> 2)) ^
                  ((a << 19) | (a >>> 13)) ^
                  ((a << 10) | (a >>> 22)),
      sigma1 = ((e << 26) | (e >>> 6)) ^
                  ((e << 21) | (e >>> 11)) ^
                  ((e << 7) | (e >>> 25));


        t1 = (h >>> 0) + sigma1 + ch + (K[j]) + (w[j] >>> 0);
        t2 = sigma0 + maj;

        h = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;

      }

      H[0] += a;
      H[1] += b;
      H[2] += c;
      H[3] += d;
      H[4] += e;
      H[5] += f;
      H[6] += g;
      H[7] += h;

    }

    return H;

  };

  // Package private blocksize
  SHA256._blocksize = 16;

  SHA256._digestsize = 32;

})();



/*!
* Random number generator with ArcFour PRNG
*
* NOTE: For best results, put code like
* <body onclick='SecureRandom.seedTime();' onkeypress='SecureRandom.seedTime();'>
* in your main HTML document.
*
* Copyright Tom Wu, bitaddress.org  BSD License.
* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
*/
(function () {

  // Constructor function of Global SecureRandom object
  var sr = global.SecureRandom = function () { };

  // Properties
  sr.state;
  sr.pool;
  sr.pptr;
  sr.poolCopyOnInit;

  // Pool size must be a multiple of 4 and greater than 32.
  // An array of bytes the size of the pool will be passed to init()
  sr.poolSize = 256;

  // --- object methods ---

  // public method
  // ba: byte array
  sr.prototype.nextBytes = function (ba) {
    var i;
    if (global.crypto && global.crypto.getRandomValues && global.Uint8Array) {
      try {
        var rvBytes = new Uint8Array(ba.length);
        global.crypto.getRandomValues(rvBytes);
        for (i = 0; i < ba.length; ++i)
          ba[i] = sr.getByte() ^ rvBytes[i];
        return;
      } catch (e) {
        alert(e);
      }
    }
    for (i = 0; i < ba.length; ++i) ba[i] = sr.getByte();
  };


  // --- static methods ---

  // Mix in the current time (w/milliseconds) into the pool
  // NOTE: this method should be called from body click/keypress event handlers to increase entropy
  sr.seedTime = function () {
    sr.seedInt(new Date().getTime());
  }

  sr.getByte = function () {
    if (sr.state == null) {
      sr.seedTime();
      sr.state = sr.ArcFour(); // Plug in your RNG constructor here
      sr.state.init(sr.pool);
      sr.poolCopyOnInit = [];
      for (sr.pptr = 0; sr.pptr < sr.pool.length; ++sr.pptr)
        sr.poolCopyOnInit[sr.pptr] = sr.pool[sr.pptr];
      sr.pptr = 0;
    }
    // TODO: allow reseeding after first request
    return sr.state.next();
  }

  // Mix in a 32-bit integer into the pool
  sr.seedInt = function (x) {
    sr.seedInt8(x);
    sr.seedInt8((x >> 8));
    sr.seedInt8((x >> 16));
    sr.seedInt8((x >> 24));
  }

  // Mix in a 16-bit integer into the pool
  sr.seedInt16 = function (x) {
    sr.seedInt8(x);
    sr.seedInt8((x >> 8));
  }

  // Mix in a 8-bit integer into the pool
  sr.seedInt8 = function (x) {
    sr.pool[sr.pptr++] ^= x & 255;
    if (sr.pptr >= sr.poolSize) sr.pptr -= sr.poolSize;
  }

  // Arcfour is a PRNG
  sr.ArcFour = function () {
    function Arcfour() {
      this.i = 0;
      this.j = 0;
      this.S = new Array();
    }

    // Initialize arcfour context from key, an array of ints, each from [0..255]
    function ARC4init(key) {
      var i, j, t;
      for (i = 0; i < 256; ++i)
        this.S[i] = i;
      j = 0;
      for (i = 0; i < 256; ++i) {
        j = (j + this.S[i] + key[i % key.length]) & 255;
        t = this.S[i];
        this.S[i] = this.S[j];
        this.S[j] = t;
      }
      this.i = 0;
      this.j = 0;
    }

    function ARC4next() {
      var t;
      this.i = (this.i + 1) & 255;
      this.j = (this.j + this.S[this.i]) & 255;
      t = this.S[this.i];
      this.S[this.i] = this.S[this.j];
      this.S[this.j] = t;
      return this.S[(t + this.S[this.i]) & 255];
    }

    Arcfour.prototype.init = ARC4init;
    Arcfour.prototype.next = ARC4next;

    return new Arcfour();
  };


  // Initialize the pool with junk if needed.
  if (sr.pool == null) {
    sr.pool = new Array();
    sr.pptr = 0;
    var t;

    while (sr.pptr < sr.poolSize) {  // extract some randomness from Math.random()
      t = Math.floor(65536 * Math.random());
      sr.pool[sr.pptr++] = t >>> 8;
      sr.pool[sr.pptr++] = t & 255;
    }
    sr.pptr = Math.floor(sr.poolSize * Math.random());
    sr.seedTime();
    // entropy
    var entropyStr = '';
    fs.open('/dev/random', 'r', (err, data) => {
      var buffer = new Buffer(100);
      fs.read(data, buffer, 0, 100, 0, function(err, num) {
        entropyStr =+ buffer.toString('utf8', 0, num);

        var entropyBytes = Crypto.SHA256(entropyStr, { asBytes: true });
        for (var i = 0 ; i < entropyBytes.length ; i++) {
          sr.seedInt8(entropyBytes[i]);
        }
      })
    })
  }
})();
