// view: asset screen
UI.views.assets = function() {

  require('./assets.ui.js');

  UI.edit.topbar = [];
  UI.edit.lowbar = ['Logger','Terminal','Quit'];
  UI.edit.taborder = [3,1];

  // elements: MAIN
  balance = {}
  balance.asset = [];
  balance.amount = [];
  balance.lasttx = [];
  
  mainView();
  
}

function getBalances(properties) {
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

function mainView() {
  // reset assets
  assets.reset();

  // destroy UI elements
  UI.clearElements();
  
  
  // query local storage for active assets
  if(typeof GL.assetsActive === 'undefined') {
    storage.Get( nacl.to_hex(GL.usercrypto.user_keys.boxPk)+'.asset.user' , function(list) {
      try {
        list = JSON.parse(list);
      } catch (err) {
        list = null;
      }
      // init asset display
      GL.assetsActive = list;
      assetDisplay();
    });
  } else {
    assetDisplay();
  }

  function assetDisplay() {

    if(GL.assetsActive == null || typeof GL.assetsActive !== 'object') {
      GL.assetsActive = ["btc","eth"];
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
      content: 'Asset',
      width: '25%',
      height: 1,
      style: {
        fg: '#cccccc',
        bg: 'transparent'
      }
    });
    
    UI.text['AssetsH2'] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: '25%',
      top: 1,
      tags: true,
      name: 'AssetsH2',
      content: 'Balance',
      width: 16,
      height: 1,
      style: {
        fg: '#cccccc',
        bg: 'transparent'
      }
    });

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
          // increment array counter
          i++;
          // get and initialize deterministic encryption routines for assets
          // timeout used to avoid double downloading of deterministic routines            
          var defer = (assets.init.indexOf(GL.assetmodes[entry].split('.')[0])==-1?0:3000);
          assets.init.push(GL.assetmodes[entry].split('.')[0]);
          setTimeout(function(entry) {
            init_asset(entry,GL.assetmodes[entry]);
          },(100*i)+defer,entry);
          // if all assets inits are called run  // if(i==assets.count) { }
        }
        
        // create and display the table of assets
        displayAssets(activeAssetsObj);
        
        // finally: initialize UI.edit for this screen with their navigation and tab orders
        UI.buttonfunc.init({'topbar':UI.edit.topbar,'box':['ManageAssets','ManageAssets','ManageAssets'].concat(UI.edit.box),'lowbar':UI.edit.lowbar},UI.edit.taborder);

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
            if(assetsloaded) {
              getBalances({i:GL.assetsActive.length,balance:balance});                     
              clearInterval(loadinterval);
            }
          }
        ,500);          

      }
    );

  }

  //
  // add and remove assets
  //
  
  UI.edit['ManageAssets'] = UI.buttonfunc.make(lang.buttonManageAssets,UI.box,-2,1,0,'#446644');
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
          UI.edit.focus = 2;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        UI.edit['ManageAssets-'+entry].key(['right', 'd', '.'], function(ch, key) {
          UI.edit.override = true;
          UI.edit.focus = UI.edit.cycle.length-1;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });      
        UI.edit['ManageAssets-'+entry].key(['end', 'S', '['], function(ch, key) {
          UI.edit.override = true;
          UI.edit.focus = UI.edit.cycle.length-2;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        UI.edit['ManageAssets-'+entry].key(['escape'], function(ch, key) {
          UI.edit.override = true;
          UI.edit.focus = UI.edit.cycle.length-1;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        
        UI.modal.box.list.render();
        
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

    UI.edit.Searchbox.on('focus', function() {
      UI.edit.Searchbox.readInput();
    });
    
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
      keys: true,
      vi: true,
      mouse: true,
      draggable: false,
      content: null,
      scrollback: 1000,
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
    });
    
    UI.edit.Reset.on('press', function() {
      UI.edit.Searchbox.setValue('');
      renderAssets(GL.assetnames)
    });

    UI.edit.Cancel.on('press', function() {
      UI.modalfunc.destroy();
    });
    
    UI.edit.Close.on('press', function() {
      var array = [];
      for(var entry in GL.assetnames) {
        if(GL.assetSelect[entry]) {
          array.push(entry);
        }
      }
      storage.Set( nacl.to_hex(GL.usercrypto.user_keys.boxPk)+'.asset.user' , JSON.stringify(array) );
      GL.assetsActive = array;
      // manually destroy modal for UI reinitialization
      UI.modal.box.destroy();
      UI.modal.hide();
      UI.modal.isvisible = false;
      // restart the main asset view
      mainView();
    });

  });

}
