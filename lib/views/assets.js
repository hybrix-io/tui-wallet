// view: asset screen
UI.views.assets = function() {
  require('./assets.ui.js');
  
  // fill local usercrypto object with keys and nonce later on
  GL.usercrypto = { user_keys: GL.session.user_keys, nonce: GL.session.nonce };
  
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
  // GL.cur_step = next_step();
  // najax({ url: nodepath+zchan(GL.usercrypto,GL.cur_step,'a'),
  //  success: function(object,pass){

  // destroy UI elements
  UI.clearElements();
  
    UI.edit.box.push('ManageAssets');
    UI.edit['ManageAssets'] = UI.buttonfunc.make(lang.buttonManageAssets,UI.box,-2,1,0,'#446644');
    UI.edit['ManageAssets'].on('press', function() {

      var renderAddButton = function renderAddButton(entry,y,toggle) {
        if(typeof UI.edit['ManageAssets-'+entry]!=='undefined') {
          UI.edit['ManageAssets-'+entry].destroy();
        }
        if(typeof toggle!=='undefined' && toggle) {
          if(GL.assetSelect[entry] === true) {
            GL.assetSelect[entry] = false;
          } else {
            GL.assetSelect[entry] = true;
          }
        }
        if(GL.assetSelect[entry] === true) {
          UI.edit['ManageAssets-'+entry] = UI.buttonfunc.make(lang.buttonManageAssetsDel,UI.modal.box.list,-3,y,lang.buttonManageAssetsDel,'red');
        } else {
          UI.edit['ManageAssets-'+entry] = UI.buttonfunc.make(lang.buttonManageAssetsAdd,UI.modal.box.list,-3,y,lang.buttonManageAssetsAdd,'green');
        }
        UI.edit['ManageAssets-'+entry].on('press', function() {
          renderAddButton(this.entry,this.y,1);
          screen.render();
        }.bind({entry:entry,y:y}));        
      }

      var renderAssets = function renderAssets(list,search) {
        //UI.modal.box.list.setContent(null);
        UI.modal.box.list.assetSelect = [];
        
        if(typeof search !== 'undefined') {
          search = search.toLowerCase();
        }
        var linecontent;
        var buttons = ['Searchbox','Reset'];
        var y=0;
        for (var entry in list) {
          if(typeof UI.text['ManageAssets-'+entry] !== 'undefined') {
            UI.text['ManageAssets-'+entry].destroy();
          }
          // add search stuff here...
          if(typeof search === 'undefined' || entry.toLowerCase().indexOf(search) !== -1 ) {
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
          } else {
            if(typeof UI.text['ManageAssets-'+entry] !== 'undefined') {
              UI.text['ManageAssets-'+entry].destroy();
              UI.edit['ManageAssets-'+entry].destroy();
            }
          }
        }
        buttons.push('Close');
        UI.buttonfunc.init({'box':buttons},[1,1]);
        screen.render();
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

      UI.edit['Close'] = UI.buttonfunc.make('Close',UI.modal.box,-2,-1,lang.buttonClose,'#800080');
      UI.edit['Close'].on('press', function() {
        UI.modalfunc.destroy();
        mainView();
      });

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
  
      UI.buttonfunc.init({'box':['Close']},[1,1]);

      GL.cur_step = next_step();
      najax({url: nodepath+zchan(GL.usercrypto,GL.cur_step,'l/asset/names'), timeout: 30000,
        success: function(object){
          object = zchan_obj(GL.usercrypto,GL.cur_step,object);
          UI.modal.box.listcontents = object.data;
          // FIX: for now set all entries in list to false
          GL.assetSelect = [];
          for(var entry in object.data) {
            GL.assetSelect[entry] = false;
          }
          renderAssets(object.data);

          UI.edit.Searchbox.key(['enter'], function(ch, key) {
            var search = UI.edit.Searchbox.getValue();
            renderAssets(this.list,search)
          }.bind({list:object.data}));
          
          UI.edit.Reset.on('press', function() {
            UI.edit.Searchbox.setValue('');
            renderAssets(this.list)
          }.bind({list:object.data}));
        }
      });
    });

  storage.Get( nacl.to_hex(GL.usercrypto.user_keys.boxPk)+'.asset.user' , function(object) {
    if(object === null || typeof object.data === 'undefined') {
      object = { "data":{"btc":"bitcoinjslib.bitcoin","eth":"ethereum.main"} }
    }

    //var object = zchan_obj(GL.usercrypto,GL.cur_step,object);
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
        fg: '#dddddd',
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
        fg: '#dddddd',
        bg: 'transparent'
      }
    });

    // initialize all assets
    if( assets.count==0 ) { for (var entry in object.data) { assets.count++; } }
    
    var pass = object.data;
    hybriddcall({r:'/s/deterministic/hashes',z:1,pass:pass},null,
      function(object,passdata){
        assets.modehashes = object.data;

        var i = 0;
        for (var entry in passdata) {
          // load assets and balances into arrays
          balance.asset[i] = entry;
          balance.amount[i] = 0;
          // increment array counter
          i++;
          // get and initialize deterministic encryption routines for assets
          // timeout used to avoid double downloading of deterministic routines            
          var defer = (assets.init.indexOf(passdata[entry].split('.')[0])==-1?0:3000);
          assets.init.push(passdata[entry].split('.')[0]);
          setTimeout(function(entry,passdata) {
            init_asset(entry,passdata[entry]);
          },(100*i)+defer,entry,passdata);
          // if all assets inits are called run  // if(i==assets.count) { }
        }
        
        // create and display the table of assets
        displayAssets(passdata);
        
        // finally: initialize UI.edit for this screen with their navigation and tab orders
        UI.buttonfunc.init({'topbar':UI.edit.topbar,'box':UI.edit.box,'lowbar':UI.edit.lowbar},UI.edit.taborder);

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
            for (k = 0; k < assets.count; k++) {
              if(typeof balance.asset[k] != 'undefined' && typeof assets.addr[balance.asset[k]] == 'undefined') {
                assetsloaded = false;
              }
            }
            if(assetsloaded) {
              getBalances({i:k,balance:balance});                     
              clearInterval(loadinterval);
            }
          }
        ,500);          

      }
    );
  });
}
