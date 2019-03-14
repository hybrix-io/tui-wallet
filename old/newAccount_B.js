// PRNG seeder and generator
PRNG = {}
﻿PRNG.seeder = {
  init: (function () {

  })(),

  restart: function() {
    PRNG.seeder.seedCount = 0;
    PRNG.seeder.isStillSeeding = true;
  },

  // number of mouse movements to wait for
  seedLimit: (function () {
    var num = Crypto.util.randomBytes(12)[11];
    return 1000 + Math.floor(num);
  })(),

  seedCount: 0, // counter
  seedPoolDisplay: '',
  lastInputTime: new Date().getTime(),
  seedPoints: [],
  isStillSeeding: true,

  mkNewAccount: function  () {
    var numberList = new Array(PRNG.seeder.seedLimit).fill(0).map(() => {
      return biguint(crypto.randomBytes(16), 'dec')
    });
    numberList.forEach(PRNG.seeder.seed)
  },

  // seed function exists to wait for mouse movement to add more entropy before generating an address
  seed: function (randomNumber) {
    var timeStamp = new Date().getTime();
    // seeding is over now we generate and display the address
    if (PRNG.seeder.seedCount === PRNG.seeder.seedLimit - 1) {
      PRNG.seeder.seedingOver();
    }
    // seed mouse position X and Y when mouse movements are greater than 40ms apart.
    else if (PRNG.seeder.seedCount < PRNG.seeder.seedLimit) {
      SecureRandom.seedTime();
      SecureRandom.seedInt16(randomNumber);
      PRNG.seeder.seedCount++;
      PRNG.seeder.lastInputTime = new Date().getTime();
      PRNG.seeder.updatePool();
    }
  },

  updatePool: function () {
    var poolHex = SecureRandom.poolCopyOnInit != null
        ? Crypto.util.bytesToHex(SecureRandom.poolCopyOnInit)
        : Crypto.util.bytesToHex(SecureRandom.pool)
    PRNG.seeder.seedPoolDisplay = poolHex;
  },

  seedingOver: function () {
    PRNG.seeder.isStillSeeding = false;
    generateAccount(PRNG.seeder.seedPoolDisplay); // generate account using random data
  }
};

function generateAccount (entropy) {
  // Default set to high level security
  var offset = Math.floor(Math.random() * (511 - 100))
  var passwd = hexToBase32(entropy.substr(offset + 20, 60));
  var userid = hexToBase32(entropy.substr(offset, 12) +
                           DJB2.hash(entropy.substr(offset, 12).toUpperCase()).substr(0, 4) +
                           DJB2.hash(entropy.substr(offset, 12).toLowerCase() + passwd.toUpperCase()).substr(4, 4));

  finalizeAccount(userid, passwd, entropy);
}

// Give back credentials
function finalizeAccount(userid, passwd, entropy) {
  console.log('Your userID', userid)
  console.log('Your pass', passwd)
}
