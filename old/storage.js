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

  var GetFile = function(storekey,postfunction) {
    if(typeof storekey=='string') {
      var fold = storekey.substr(0,2)+'/';
      if(fs.existsSync(storepath+fold+storekey)) {
        if(typeof postfunction === 'function') {
            postfunction( String(fs.readFileSync(storepath+fold+storekey)) );
        }
      } else { if(typeof postfunction === 'function') { postfunction(null); } }
    } else { if(typeof postfunction === 'function') { postfunction(null); } }
  }

  var SetFile = function(storekey,storevalue) {
    var fold = storekey.substr(0,2)+'/';
    makeDir(storepath+fold);
    fs.writeFileSync(storepath+fold+storekey, storevalue);
    fs.writeFileSync(storepath+fold+storekey+'.meta',JSON.stringify({time:Date.now(),hash:DJB2.hash(storevalue)}));
  }

  var Sync = function(storekey,postfunction) {
    // compare meta data
    var loop_step = next_step();
    hybrixdcall({r:'s/storage/meta/'+storekey,c:GL.usercrypto,s:loop_step,z:0},0, function(object) {
      var meta = object.data;
      if(typeof meta==='undefined' || meta===null || meta==='null') {
        meta = {time:0,hash:null}
      }
      GetFile(storekey+'.meta',function(localmeta) {
        try { var localmeta = JSON.parse(localmeta); } catch(err) {}
        if(localmeta===null) { localmeta = {time:0,hash:0}; }
        // difference detected
        var meta = this.meta;
        // DEBUG: logger(' KEY: '+storekey+' HASHES: '+meta.hash+' '+localmeta.hash);
        if(meta.hash!==localmeta.hash) {
          // remote is newer
          if(meta.time>localmeta.time) {
            var loop_step = next_step();
            hybrixdcall({r:'s/storage/get/'+storekey,c:GL.usercrypto,s:loop_step,z:0},0, function(object) {
              if(typeof object.data==='undefined' || object.data===null || object.data==='null') {
                GetFile(storekey,function(value) {
                  if(typeof postfunction === 'function') {
                    postfunction(value);
                  }
                });
              } else {
                if(typeof postfunction === 'function') {
                 postfunction(object.data);
                }
                try {
                  SetFile(storekey, object.data);
                  return true;
                } catch(e) {
                  return false;
                }
              }
            });
          // remote is older
          } else {
            GetFile(storekey,function(value) {
              if(typeof postfunction === 'function') {
                postfunction(value);
              }
              var loop_step = next_step();
              hybrixdcall({r:'s/storage/set/'+storekey+'/'+value,c:GL.usercrypto,s:loop_step,z:0},0, function(object) {
                // add to proof of work queue
                if(typeof object.data === 'string' && (meta.res !== 'undefined' && meta.res !== 1) && typeof GL.powqueue !== 'undefined' && GL.powqueue.indexOf(meta.res) === -1) {
                  GL.powqueue.push(storekey+'/'+object.data);
                }
              });
            });
          }
        // no changes between remote and local
        } else {
          GetFile(storekey,function(value) {
            if(typeof postfunction === 'function') {
              postfunction(value);
            }
            if((meta.res !== 'undefined' && meta.res !== 1) && typeof GL.powqueue !== 'undefined' && GL.powqueue.indexOf(meta.res) !== -1) {
              // add to proof of work queue
              GL.powqueue.push(storekey+'/'+meta.res);
            }
          });
        }
      }.bind({meta:meta}));
    });
  }

	var storage = {

    Set : function(storekey, storevalue) {
      SetFile(storekey,storevalue);
      if(storekey.substr(-6)!=='-LOCAL') {
        setTimeout(function(storekey) {
          //DEBUG: logger('storekey: '+storekey);
          Sync(storekey);
        },2000,storekey);
      }
      return true;
    },

    Get : function(storekey, postfunction) {
      if(storekey.substr(-6)==='-LOCAL') {
        GetFile(storekey,function(value) {
          postfunction(value);
        });
      } else {
        Sync(storekey, function(value) { postfunction(value); });
      }
      return true;
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
