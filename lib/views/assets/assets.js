// view: asset screen
UI.views.assets = function () {

  require('./assets.ui.js');

  UI.edit.topbar = [];
  UI.edit.lowbar = ['Logger','Terminal','Quit'];
  UI.edit.taborder = [4,1];

  // elements: MAIN
  balance = {}
  balance.asset = [];
  balance.starred = [];
  balance.amount = [];
  balance.lasttx = [];

  mainView();
}

function getBalances (properties) {
  var i = properties.i;
  var balance = properties.balance;
  // fill asset elements
  for (j = 0; j < i; j++) {
    setTimeout(
      function(j) {
        if(typeof balance.asset[j] !== 'undefined') {
          var element = 'AssetsA-'+balance.asset[j];
          var address = '';
          if((balance.lasttx[j]+60000)<(new Date).getTime()) {
            hybriddcall({r:'a/'+balance.asset[j]+'/balance/'+assets.addr[balance.asset[j]],z:0},element,
                        function(object){
                          if(typeof object.data=='string') { object.data = formatFloat(object.data); }
                          return object;
                        }
                       );
          }
        }
      }
      ,j*500,j);
  }
}

function getStorage(cb) {
  if(typeof GL.assetsActive === 'undefined') {
    storage.Get( userStorageKey('ff00-0033') , function(crypted) {
      GL.assetsActive = userDecode(crypted);

      if(typeof GL.assetsStarred === 'undefined') {
        storage.Get( userStorageKey('ff00-0034') , function(crypted) {
          GL.assetsStarred = userDecode(crypted);
          cb();
        });
      }
    });
  } else {
    cb();
  }
}

function mainView() {
  // reset assets
  assets.reset();

  // destroy UI elements
  UI.clearElements();

  commandLineInitMessage();

  // query local storage for active assets
  getStorage(assetDisplay);

  function assetDisplay() {
    if(GL.assetsActive === null || typeof GL.assetsActive !== 'object') {
      GL.assetsActive = ["btc","eth"];
      // NOT NEEDED: storage.Set(userStorageKey('ff00-0033'), userEncode(GL.assetsActive));
    }

    // Assets active in Dashboard
    if(GL.assetsStarred === null || typeof GL.assetsStarred !== 'object') {
      var initAssetsStarred = GL.assetsActive.map((asset) => ({id: asset, starred: false}));

      GL.assetsStarred = initAssetsStarred;
      // NOT NEEDED: storage.Set(userStorageKey('ff00-0034'), userEncode(initAssetsStarred));
    }

    var starredAssetsIDs = GL.assetsStarred.map((asset) => asset.id)
    var missingStarredAssetsIDs = GL.assetsActive.filter((asset) => !starredAssetsIDs.includes(asset));

    if(missingStarredAssetsIDs !== []){
      var newStarredAssets = missingStarredAssetsIDs.map((asset) => ({id: asset, starred: false}));
      GL.assetsStarred = GL.assetsStarred.concat(newStarredAssets)
      // NOT NEEDED: storage.Set(userStorageKey('ff00-0034'), userEncode(newStarredAssets));
    }

    var i = 0;
    var output = '';

    // create asset table
    UI.text['AssetsH1'] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: 0,
      top: 1,
      tags: true,
      name: 'AssetsH1',
      content: lang.headerAsset,
      width: '18%',
      height: 1,
      style: {
        fg: '#cccccc',
        bg: 'transparent'
      }
    });

    UI.text['AssetsH2'] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: '18%',
      top: 1,
      tags: true,
      name: 'AssetsH2',
      content: lang.headerStarred,
      height: 1,
      style: {
        fg: 'yellow',
      }
    });

    UI.text['AssetsH3'] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: '36%',
      top: 1,
      tags: true,
      name: 'AssetsH3',
      content: lang.headerBalance,
      width: 16,
      height: 1,
      style: {
        fg: '#cccccc',
        bg: 'transparent'
      }
    });

    // asset management button
    UI.edit['ManageAssets'] = UI.buttonfunc.make(lang.buttonManageAssets,UI.box,-2,1,0,'#446644');

    //
    // initialize all assets
    //

    hybriddcall({r:'/s/deterministic/hashes',z:1},null,
                function(object){
                  assets.modehashes = object.data;

                  // create mode array of selected assets
                  var activeAssetsObj = {};
                  var i = 0;
                  for(i = 0; i < GL.assetsActive.length; ++i) {
                    if(typeof GL.assetmodes[GL.assetsActive[i]] !== 'undefined') {
                      activeAssetsObj[GL.assetsActive[i]] = GL.assetmodes[GL.assetsActive[i]];
                    }
                  }

                  // initialize all assets
                  i = 0;
                  for(var entry in activeAssetsObj) {
                    // load assets and balances into arrays
                    balance.asset[i] = entry;
                    balance.amount[i] = 0;
                    // balance.starred[i] = 0;
                    balance.starred[i] = GL.assetsStarred[i].starred;
                    // increment array counter
                    i++;
                    // get and initialize deterministic encryption routines for assets
                    // timeout used to avoid double downloading of deterministic routines
                    var defer = (assets.init.indexOf(GL.assetmodes[entry].split('.')[0])==-1?0:3000);
                    assets.init.push(GL.assetmodes[entry].split('.')[0]);
                    setTimeout(function(entry) {
                      initAsset(entry,GL.assetmodes[entry], processCommandLineInputWhenAvailable);
                    },(100*i)+defer,entry);
                    // if all assets inits are called run  // if(i==assets.count) { }
                  }

                  // refresh assets
                  if(typeof intervals!=='undefined') {
                    clearInterval(intervals);
                  }
                  intervals = setInterval( function(nodepath,i) {
                    getBalances({i:i,balance:balance});
                  },30000,nodepath,i);

                  // fill the field elements when interface has just loaded
                  if(typeof loadinterval!=='undefined') {
                    clearInterval(loadinterval);
                  }
                  var loadcnt = 0;
                  loadinterval = setInterval(
                    // check if assets are loaded by hybriddcall
                    function() {
                      var assetsloaded = true;
                      var k;
                      for (k = 0; k < GL.assetsActive.length; k++) {
                        if(typeof balance.asset[k] !== 'undefined' && typeof assets.addr[balance.asset[k]] === 'undefined') {
                          assetsloaded = false;
                        }
                      }
                      if(assetsloaded || loadcnt>8) {
                        clearInterval(loadinterval);
                        // get first balances
                        getBalances({i:GL.assetsActive.length,balance:balance});
                        // activate asset management button
                        setTimeout( function() {
                          manageAssets();
                        },5000);
                      }
                      loadcnt += 1;
                    }
                    ,1000);

                  // If automatic transaction is enabled don't render assets
                  if (Object.keys(globals.transactionDetails).length !== 0) {
                    return 0;
                  }

                  // create and display the table of assets
                  displayAssets(activeAssetsObj);
                }
               );

  }

  //
  // add and remove assets
  //

  manageAssets = function manageAssets() {
    UI.edit['ManageAssets'].on('press', function() {

      var renderAddButton = function renderAddButton(entry,y,toggle) {
        if(typeof toggle!=='undefined' && toggle) {

          if(GL.assetSelect[entry] === true) {
            GL.assetSelect[entry] = false;
            UI.edit['ManageAssets-'+entry].setContent('{green-bg} '+lang.buttonManageAssetsAdd+' {/green-bg}');
          } else {
            GL.assetSelect[entry] = true;
            UI.edit['ManageAssets-'+entry].setContent('{red-bg} '+lang.buttonManageAssetsDel+' {/red-bg}');
          }

        } else {

          if(GL.assetSelect[entry] === true) {
            UI.edit['ManageAssets-'+entry] = UI.buttonfunc.make(lang.buttonManageAssetsDel,UI.modal.box.list,-3,y,' '+lang.buttonManageAssetsDel+' ','red',0);
          } else {
            UI.edit['ManageAssets-'+entry] = UI.buttonfunc.make(lang.buttonManageAssetsAdd,UI.modal.box.list,-3,y,' '+lang.buttonManageAssetsAdd+' ','green',0);
          }

          UI.edit['ManageAssets-'+entry].on('focus', function() {
            UI.scrollWindow(UI.modal.box.list,this.y);
          }.bind({y:UI.edit['ManageAssets-'+entry].top}));

          UI.edit['ManageAssets-'+entry].on('press', function() {
            renderAddButton(this.entry,this.y,1);
            screen.render();
          }.bind({entry:entry,y:y}));

          UI.edit['ManageAssets-'+entry].key(['left', 'a', ','], function(ch, key) {
            UI.edit.override = true;
            UI.edit.focus = 1;
            UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
            screen.render();
          });
          UI.edit['ManageAssets-'+entry].key(['home', 'W', ']'], function(ch, key) {
            UI.edit.override = true;
            UI.edit.focus = 3;
            UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
            screen.render();
          });
          UI.edit['ManageAssets-'+entry].key(['right', 'd', '.'], function(ch, key) {
            UI.edit.override = true;
            UI.edit.focus = UI.edit.cycle.length-2;
            UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
            screen.render();
          });
          UI.edit['ManageAssets-'+entry].key(['end', 'S', '['], function(ch, key) {
            UI.edit.override = true;
            UI.edit.focus = UI.edit.cycle.length-3;
            UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
            screen.render();
          });
          UI.edit['ManageAssets-'+entry].key(['escape'], function(ch, key) {
            UI.edit.override = true;
            UI.edit.focus = UI.edit.cycle.length-2;
            UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
            screen.render();
          });

        }
      }

      var renderAssets = function renderAssets(list,search) {
        if(typeof search !== 'undefined') {
          search = search.toLowerCase();
        }
        var linecontent;
        var buttons = [];
        var y=0;
        for (var entry in list) {
          // destroy old elements and keybindings
          if(typeof UI.text['ManageAssets-'+entry] !== 'undefined') {
            UI.text['ManageAssets-'+entry].destroy();
          }
          if(typeof UI.edit['ManageAssets-'+entry] !== 'undefined') {
            UI.edit['ManageAssets-'+entry].destroy();
          }
          // add search stuff here...
          if(typeof search === 'undefined' || entry.toLowerCase().indexOf(search) !== -1 || list[entry].toLowerCase().indexOf(search) !== -1 ) {
            linecontent = String(entry.toUpperCase()+'            ').substr(0,12)+'{grey-fg}'+list[entry]+'{/grey-fg}';

            UI.text['ManageAssets-'+entry] = blessed.text({
              parent: UI.modal.box.list,
              left: 0,top: y,tags:true,shrink:true,align:'left',
              content: linecontent,
              style: { fg: 'white', bg: 'black' }
            });

            renderAddButton(entry,y);
            buttons.push('ManageAssets-'+entry);

            y+=1;
          }
        }
        UI.buttonfunc.init({'box':['Searchbox','Reset'].concat(buttons,['Cancel','Close'])},[1,1]);
      }

      UI.modalfunc.make(lang.modalManageAssetsTitle);

      UI.text['SearchboxTitle'] = blessed.text({
        parent: UI.modal.box,
        left: 0,top: 1,tags:true,shrink:true,align:'left',
        content: lang.modalManageAssetsSearchbox,
        style: { fg: 'white', bg: 'black' }
      });

      UI.modalfunc.input('Searchbox',0,2,'100%-8')

      UI.edit['Reset'] = UI.buttonfunc.make('Reset',UI.modal.box,-1,2,'X','#446644');

      UI.edit['Cancel'] = UI.buttonfunc.make('Cancel',UI.modal.box,-5-lang.buttonApply.length,-1,lang.buttonCancel,'#400040');

      UI.edit['Close'] = UI.buttonfunc.make('Close',UI.modal.box,-2,-1,lang.buttonApply,'blue');

      UI.modal.box.list = blessed.form({
        parent: UI.modal.box,
        scrollable: true,
        top: 4,
        left: 0,
        width: '100%-4',
        bottom: 2,
        border: false,
        tags: true,
        keys: false,
        vi: false,
        mouse: true,
        draggable: false,
        content: null,
        scrollback: 5000,
        style: {
          bg: 'black'
        },
        scrollbar: {
          ch: ' ',
          track: {
            bg: 'yellow'
          },
          style: {
            inverse: true
          }
        }
      });

      GL.assetSelect = [];
      for(var entry in GL.assetnames) {
        if(GL.assetsActive.indexOf(entry) === -1) {
          GL.assetSelect[entry] = false;
        } else {
          GL.assetSelect[entry] = true;
        }
      }
      renderAssets(GL.assetnames);

      UI.edit.Searchbox.focus();

      UI.edit.Searchbox.key(['enter'], function(ch, key) {
        var search = UI.edit.Searchbox.getValue();
        renderAssets(GL.assetnames,search)
        // one extra late render in case searching produces a race condition
        setTimeout(function() {
          UI.edit[UI.edit.cycle[2]].focus();
          screen.render();
          UI.edit.Searchbox.focus();
        },300);

      });

      UI.edit.Reset.on('press', function() {
        UI.edit.Searchbox.setValue('');
        renderAssets(GL.assetnames)
      });

      UI.edit.Cancel.on('press', function() {
        // manually destroy modal for UI reinitialization (blessed lib is buggy!)
        UI.modal.box.destroy();
        UI.modal.hide();
        UI.modal.isvisible = false;
        // restart the main asset view
        mainView();
      });

      UI.edit.Close.on('press', function() {
        var array = [];
        for(var entry in GL.assetnames) {
          if(GL.assetSelect[entry]) {
            array.push(entry);
          }

        }

        GL.assetsActive = array;

        var newAssetsToStar = GL.assetsActive.filter(function (asset) {
          var foundOrUndefinedId = GL.assetsStarred.find(function (starred) {
            return starred.id === asset;
          })
          return foundOrUndefinedId === undefined;
        })

        GL.assetsStarred = GL.assetsActive.map(function (asset) {
          var foundOrUndefinedId = GL.assetsStarred.find(function (starred) {
            return asset === starred.id;
          })
          return foundOrUndefinedId === undefined ? {id: asset, starred: false} : foundOrUndefinedId;
        })

        storage.Set(  userStorageKey('ff00-0033') , userEncode(array) );
        storage.Set(  userStorageKey('ff00-0034') , userEncode(GL.assetsStarred) );

        // manually destroy modal for UI reinitialization (blessed lib is buggy!)
        UI.modal.box.destroy();
        UI.modal.hide();
        UI.modal.isvisible = false;
        // restart the main asset view
        mainView();
      });

    });
  }
}


function processCommandLineInputWhenAvailable () {
  var maybeNewAsset = globals.newAsset;
  var maybeTransactionDetails = globals.transactionDetails;
  var maybeAddress = globals.addressToGet;
  var assetNameIsNotNull = maybeNewAsset !== null;
  var transactionDetailsExist = Object.keys(maybeTransactionDetails).length !== 0;
  var addresIsNotNull = maybeAddress !== null;
  var addressesAvailable = areAssetsAddressesAvailable();

  if (addressesAvailable) {
    if (transactionDetailsExist) {
      doAutomaticTransaction(maybeTransactionDetails);
    } else if (assetNameIsNotNull) {
      addNewAsset(maybeNewAsset);
    } else if (maybeAddress) {
      renderAssetAddress(maybeAddress);
    }
  }
}

function doAutomaticTransaction (transactionDetails) {
  var asset = transactionDetails.asset;
  var amount = Number(transactionDetails.amount);
  var amountIsNumber = !isNaN(amount);
  var target = transactionDetails.target;

  if (amountIsNumber) {
    sendTransaction({
      element: null,
      asset: asset,
      amount: amount,
      source: assets.addr[asset],
      target: target
    });
  } else {
    console.log('Transaction failed: Amount is not a number.\n');
    return 1;
  }
}

function addNewAsset (assetName) {
  var availableAssetNames = Object.keys(GL.assetmodes);
  var assetNameExists = assetExists(assetName, availableAssetNames)
  var assetDoesNotExistInWallet = !GL.assetsActive.includes(assetName);

  assetNameExists
    ? assetDoesNotExistInWallet
    ? addNewAssetToWalletAndExit(assetName)
    : renderErrorAndExit(GL.assetsActive, 'Asset already exists in wallet. Current wallet assets are:\n')
  : renderErrorAndExit(availableAssetNames, 'Could not find asset name in available assets.\n Available assets are:\n');
}

function renderAssetAddress (assetName) {
  var assetsAddresses = assets.addr;
  var availableAddressesKeys = Object.keys(assetsAddresses);
  var assetNameExists = assetExists(assetName, GL.assetsActive);

  assetNameExists
    ? renderAddressAndExit(assetName)
    : renderErrorAndExit(availableAddressesKeys, 'Could not find asset in wallet.\n Available assets are:\n')
}

// TODO SET CONSOLE LOG INSTEAD OF STDOUT
function renderAddressAndExit (assetName) {
  var address = assets.addr[assetName];
  console.log((`Asset ${ assetName.toUpperCase() } address is: ${ address }`));
  exitWithDelay(2000)
}

function assetExists (assetName, assetsList) {
  var assetNameExists = assetsList.includes(assetName);
  return assetNameExists
}

function addNewAssetToWalletAndExit (assetName) {
  var initAssetStarred = ({id: assetName, starred: false});
  setAssetTypeObjAndSaveToStorage(assetName, GL.assetsActive, 'ff00-0033');
  setAssetTypeObjAndSaveToStorage(initAssetStarred, GL.assetsStarred, 'ff00-0034');
  process.stdout.write('Succes: New asset has been saved to wallet.');
  exitWithDelay(4000);
}

function setAssetTypeObjAndSaveToStorage (newAsset, assetTypeObj, storageNumber) {
  var newActiveAssets = assetTypeObj.concat([newAsset]);
  assetTypeObj = newActiveAssets;
  storage.Set(userStorageKey(storageNumber), userEncode(newActiveAssets));
}

function areAssetsAddressesAvailable () {
  var sortedAddrKeys = Object.keys(assets.addr);
  var everyAddrIsAvailable = GL.assetsActive.every((asset) => sortedAddrKeys.includes(asset));
  return (everyAddrIsAvailable)
}

function renderErrorAndExit(availableAssetNames, message) {
  screen.destroy();
  process.stdout.write(message)
  availableAssetNames.forEach((assetName) => process.stdout.write(`- ${ assetName }\n`));
  exitWithDelay(4000)
}

function exitWithDelay (ms) {
  setTimeout(() => process.exit(), ms)
}

function commandLineInitMessage() {
  if (Object.keys(globals.transactionDetails).length !== 0) {
    process.stdout.write('Initializing assets.\n');
    process.stdout.write('Preparing transaction.\n');
  } else if (globals.newAsset !== null || globals.addressToGet !== null) {
    process.stdout.write('Initializing assets.\n');
    process.stdout.write('Checking if asset name exists.\n')
  }
}
