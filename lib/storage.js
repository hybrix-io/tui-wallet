// storage.js :: higher level storage functions
// depends on localforage.nopromises.min.js

var storage = (function() {
  
  var storepath = path.normalize(process.cwd()+'/storage/');

  function makeDir(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    }
    fs.mkdirSync(dirname);
  }

	var storage = {	  

    Set : function(storekey, storevalue) {
      try {
        var fold = storekey.substr(0,2)+'/';
        makeDir(storepath+fold);
        fs.writeFileSync(storepath+fold+storekey, storevalue);
        return true;
      } catch(e) {
        return false;
      }
    },

    Get : function (storekey,postfunction) {
      if(typeof storekey=='string') {
        var fold = storekey.substr(0,2)+'/';
        if(fs.existsSync(storepath+fold+storekey)) {
          try {
            if(typeof postfunction == 'function') {
                postfunction( String(fs.readFileSync(storepath+fold+storekey)) );
            }
          } catch(e) {
            if(typeof postfunction == 'function') {
              postfunction(null);
            }
          }
        } else { if(typeof postfunction == 'function') { postfunction(null); } }
      } else { if(typeof postfunction == 'function') { postfunction(null); } }
    },

    Del : function(storekey) {
      try {
        var fold = storekey.substr(0,2)+'/';
        fs.unlinkSync(storepath+fold+storekey);
        return true;
      } catch(e) {
        return false;
      }
    }    

    /*
    writesafe : function (storekey, storevalue) {
        // try to load item if exists
        localforage.getItem( storekey, function (err, val) {
            if ( val == null ) {
                // item does not exist yet, so we can go ahead and store
                localforage.setItem( storekey, storevalue, function (err) {
                    if ( err == null ) {
                        // success, no action necessary
                    } else {
                        alert("! Could not store "+storekey);                    
                    } 
                });                
            } else {
                // value is already set, ask for overwrite
                if ( confirm("This record already exists, overwrite?") ) {
                    localforage.setItem( storekey, storevalue, function (err) {
                        if ( err == null ) {
                            // success, no action necessary
                        } else {
                            alert("! Could not store "+storekey);                    
                        }                                    
                    });
                }                
            }
        });
    }*/

  }

  return storage;

})();

if (typeof define === 'function' && define.amd) {
  define(function () { return storage; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = storage;
} else if( typeof angular !== 'undefined' && angular != null ) {
  angular.module('storage', [])
  .factory('storage', function () {
    return storage;
  });
}
